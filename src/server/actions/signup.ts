"use server";

/**
 * L'inscription — la **seule** porte qui ouvre un compte.
 *
 * Tout se passe **côté serveur**, dans une seule requête : le compte, le
 * profil, le dossier et le consentement. Un `signUp` fait dans le navigateur
 * poserait la session après coup — la requête suivante, celle qui enregistre
 * la situation, partirait sans elle, et l'emprunteur lirait « votre session a
 * expiré » alors qu'il vient de créer son compte.
 *
 * Le consentement est daté par le **serveur** : la date du navigateur n'est
 * pas une preuve.
 */

import { createServerSupabaseClient } from "@/server/supabase/server";
import { getSiteUrl } from "@/server/env";
import { toE164 } from "@/domain/entities/phone";
import {
  SIGNUP_CONSENT_TEXT,
  validateSignupInput,
  type SignupInput,
} from "@/domain/entities/kyc-profile";

export type SignupResult =
  | {
      ok: true;
      /** La page à ouvrir ensuite. */
      redirectTo: string;
      /** Le compte est créé, mais l'e-mail doit être confirmé. */
      pendingConfirmation?: boolean;
      message?: string;
    }
  | {
      ok: false;
      error: string;
      /** Le refus, rattaché à son champ. */
      errors?: Record<string, string>;
      code?: "ACCOUNT_EXISTS" | "CNI_TAKEN";
    };

/**
 * Ouvre le compte et le dossier.
 *
 * Trois refus sont distingués, parce qu'ils ne se corrigent pas de la même
 * façon : un e-mail déjà pris (connectez-vous), une CNI déjà prise (écrivez à
 * l'agence), et un e-mail illisible (corrigez la saisie).
 */
export async function signupAction(input: SignupInput): Promise<SignupResult> {
  const validation = validateSignupInput(input);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Votre inscription est incomplète. Corrigez les champs signalés.",
      errors: validation.errors,
    };
  }

  const email = input.email.trim().toLowerCase();
  const phone = toE164(input.phone);
  const fullName = input.fullName.trim();
  const cniNumber = input.cniNumber.trim().toUpperCase();

  const supabase = await createServerSupabaseClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: new URL(
        "/auth/callback?next=/onboarding",
        getSiteUrl(),
      ).toString(),
    },
  });

  if (signUpError) {
    if (!/already registered|already exists/i.test(signUpError.message)) {
      return { ok: false, error: signUpError.message };
    }

    // Le compte existe : c'est peut-être le mot de passe qui ne va pas.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (signInError) {
      return {
        ok: false,
        code: "ACCOUNT_EXISTS",
        error:
          "Un compte existe déjà avec cette adresse e-mail. Connectez-vous pour reprendre votre dossier.",
      };
    }
  } else if (!data?.session) {
    // Le compte est créé, mais la session attend la confirmation de l'e-mail.
    return {
      ok: true,
      pendingConfirmation: true,
      redirectTo: "/login",
      message:
        "Votre compte a été créé. Confirmez votre adresse e-mail, puis connectez-vous pour reprendre votre dossier.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session requise." };
  }

  // Le profil citoyen porte l'**identité** ; la profession et l'employeur
  // appartiennent au dossier et viendront au KYC.
  const { error: profileError } = await supabase.from("citizen_profiles").upsert(
    {
      id: user.id,
      email,
      phone,
      full_name: fullName,
      cni_raw: cniNumber,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    // La CNI est unique en base : l'erreur Postgres est traduite, elle ne
    // remonte pas brute au demandeur.
    if (/cni_normalised|duplicate key|unique/i.test(profileError.message)) {
      return {
        ok: false,
        code: "CNI_TAKEN",
        error:
          "Ce numéro de CNI est déjà rattaché à un dossier. Contactez l'agence qui vous accompagne.",
      };
    }
    return { ok: false, error: profileError.message };
  }

  // Le dossier porte son code : la séquence le numérote, deux inscriptions
  // simultanées ne peuvent pas obtenir le même.
  const { data: code, error: codeError } = await supabase.rpc("next_duc_code");
  if (codeError || typeof code !== "string" || code.length === 0) {
    return {
      ok: false,
      error:
        "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
    };
  }

  const { error: dossierError } = await supabase.from("dossiers").insert({
    duc_code: code,
    citizen_id: user.id,
    name: fullName,
    email,
    phone,
    cni_raw: cniNumber,
    status: "open",
    current_phase: "kyc_savings",
    duc_status: "non_active",
    onboarding_state: "kyc",
    updated_at: new Date().toISOString(),
  });

  if (dossierError) {
    return {
      ok: false,
      error:
        "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
    };
  }

  // Le profil du parcours, avec le **consentement daté par le serveur**.
  const { error: kycError } = await supabase.from("kyc_profiles").upsert(
    {
      citizen_id: user.id,
      identity: {
        full_name: fullName,
        cni_number: cniNumber,
      },
      consent_at: new Date().toISOString(),
      consent_text: SIGNUP_CONSENT_TEXT,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "citizen_id" },
  );

  if (kycError) {
    return {
      ok: false,
      error:
        "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
    };
  }

  // La session doit être **usable** par le serveur : l'emprunteur doit pouvoir
  // relire sa propre fiche. Sans acteur — ou sans profil visible — la requête
  // suivante échouerait, et l'emprunteur lirait « votre session a expiré »
  // alors que son compte vient d'être créé.
  const { data: actor } = await supabase
    .from("actors")
    .select("id, actor_type")
    .eq("id", user.id)
    .maybeSingle();

  const { data: written } = await supabase
    .from("citizen_profiles")
    .select("id, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!actor || actor.actor_type !== "citizen" || !written) {
    return {
      ok: false,
      error:
        "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
    };
  }

  return {
    ok: true,
    redirectTo: "/onboarding",
    message: "Votre compte est créé. Completons votre dossier.",
  };
}
