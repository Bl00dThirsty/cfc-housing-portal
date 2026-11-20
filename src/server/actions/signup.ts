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
import { getAdminClient } from "@/server/supabase/admin";
import { getSiteUrl } from "@/server/env";
import { sendTemplatedEmail } from "@/server/email/send";
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
  const admin = getAdminClient();

  // Le compte est ouvert par la **plateforme**, et son adresse confirmée
  // d'emblée.
  //
  // La confirmation par e-mail dépend de la messagerie de la plateforme,
  // dont le quota sature : le compte existait, mais l'emprunteur ne
  // recevait jamais le lien, et ne pouvait donc jamais entrer. L'identité,
  // elle, est vérifiée par le parcours KYC — CNI, justificatifs, contrôle de
  // vigilance.
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    // L'API d'administration dit « a user with this email address has already
    // been registered » ; l'API publique dit « user already registered ».
    if (!/already (been )?registered|already exists/i.test(createError.message)) {
      return { ok: false, error: createError.message };
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
  } else {
    // Le compte vient d'être ouvert : la session est ouverte tout de suite,
    // pour que le parcours puisse enregistrer le dossier sans interruption.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (signInError) {
      return {
        ok: false,
        error:
          "Votre compte a été créé, mais la session n'a pas pu être ouverte. Reconnectez-vous pour le reprendre.",
      };
    }
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

  // Repeated signup attempts for an existing account resume its initial KYC
  // request. A new DUC is opened only when this actor has no active KYC draft.
  const { data: existingDraft, error: existingDraftError } = await supabase
    .from("dossiers")
    .select("id")
    .eq("citizen_id", user.id)
    .eq("onboarding_state", "kyc")
    .is("service_code", null)
    .is("deleted_at", null)
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let dossierId = existingDraft?.id ?? null;
  if (existingDraftError) {
    return {
      ok: false,
      error:
        "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
    };
  }

  if (!dossierId) {
    // The sequence allocates a unique DUC code under concurrent signups.
    const { data: code, error: codeError } = await supabase.rpc("next_duc_code");
    if (codeError || typeof code !== "string" || code.length === 0) {
      return {
        ok: false,
        error:
          "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
      };
    }

    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .insert({
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
      })
      .select("id")
      .single();

    if (dossierError || !dossier) {
      return {
        ok: false,
        error:
          "Votre compte a été créé, mais votre dossier n'a pas pu être ouvert. Reconnectez-vous pour le reprendre.",
      };
    }
    dossierId = dossier.id;
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

  // Le message de bienvenue part **ici**, et non par le relais d'événements :
  // le relais n'est pas actif partout, et un message de bienvenue qui ne
  // part pas est un compte sans explication. La clé d'idempotence est celle
  // du même fait : le relais, s'il est actif, n'enverra pas de second
  // message.
  await sendTemplatedEmail({
    templateCode: "WELCOME",
    to: email,
    recipientUserId: user.id,
    variables: {
      prenom: fullName.split(" ")[0] ?? fullName,
      nom: fullName.split(" ").slice(1).join(" "),
      email,
      date: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
      lien: `${getSiteUrl()}/onboarding?dossier=${encodeURIComponent(dossierId)}`,
    },
    idempotencyKey: `PROFILE_CREATED:${user.id}`,
  });

  return {
    ok: true,
    redirectTo: `/onboarding?dossier=${encodeURIComponent(dossierId)}`,
    message: "Votre compte est créé. Completons votre dossier.",
  };
}
