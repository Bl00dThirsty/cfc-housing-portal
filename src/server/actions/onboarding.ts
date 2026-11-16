"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
import {
  EMPTY_DRAFT,
  fromStoredProfile,
  type AffiliationStatus,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

export type OnboardingResult =
  | { ok: true; message?: string; dossierCode?: string }
  | { ok: false; error: string };

async function currentCitizen() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: actor } = await supabase
    .from("actors")
    .select("id, actor_type")
    .eq("id", user.id)
    .maybeSingle();

  if (!actor || actor.actor_type !== "citizen") return null;

  return { supabase, userId: user.id };
}

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  cni_raw: string | null;
  address: string | null;
  affiliation_status: string | null;
};

/** Les déclarations du citoyen, telles que le parcours les a enregistrées. */
type KycProfileRow = {
  identity: Record<string, unknown> | null;
  residence: Record<string, unknown> | null;
  employment: Record<string, unknown> | null;
  compliance: Record<string, unknown> | null;
};

type DossierRow = {
  duc_code: string;
  service_code: string | null;
  name: string | null;
  cni_raw: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  profession: string | null;
  employer: string | null;
  monthly_income: number | null;
  is_diaspora: boolean;
};

export async function loadOnboardingDraft(): Promise<OnboardingDraft> {
  const citizen = await currentCitizen();
  if (!citizen) return EMPTY_DRAFT;

  const { supabase, userId } = citizen;

  const [
    { data: profileData, error: profileError },
    { data: dossierData, error: dossierError },
    { data: kycData, error: kycError },
  ] = await Promise.all([
    // Le profil **citoyen** porte l'identité ; la profession et l'employeur
    // appartiennent au dossier. Les demander ici ferait échouer la lecture
    // entière.
    supabase
      .from("citizen_profiles")
      .select(
        "full_name, email, phone, birth_date, cni_raw, address, affiliation_status",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("dossiers")
      .select(
        "duc_code, service_code, name, cni_raw, birth_date, phone, email, address, profession, employer, monthly_income, is_diaspora",
      )
      .eq("citizen_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Les déclarations du citoyen : le revenu déclaré, les personnes à charge,
    // les crédits en cours.
    supabase
      .from("kyc_profiles")
      .select("identity, residence, employment, compliance")
      .eq("citizen_id", userId)
      .maybeSingle(),
  ]);

  if (profileError || dossierError || kycError) {
    console.error(
      "[onboarding] lecture du parcours impossible :",
      profileError?.message ?? dossierError?.message ?? kycError?.message,
    );
  }

  const profile = profileData as ProfileRow | null;
  const dossier = dossierData as DossierRow | null;
  const kyc = (kycData ?? null) as KycProfileRow | null;

  if (!profile && !dossier && !kyc) return EMPTY_DRAFT;

  // Les déclarations sont **stockées** en snake_case : la traduction vit
  // dans le domaine, une fois.
  const { identity, residence, employment, compliance } = fromStoredProfile(kyc);
  // L'identité que l'inscription a portée est **pré-remplie** : le demandeur
  // la vérifie, il ne la ressaisit pas. Le dossier en est la copie de travail :
  // il porte les mêmes faits, et il comble ce que le profil citizen n'a pas.
  if (!identity.birthDate) {
    identity.birthDate = profile?.birth_date ?? dossier?.birth_date ?? null;
  }
  if (!identity.idDocumentNumber) {
    identity.idDocumentNumber = profile?.cni_raw ?? dossier?.cni_raw ?? null;
  }
  if (!identity.nationality && !dossier?.is_diaspora) {
    identity.nationality = "Cameroun";
  }

  return {
    serviceCode: dossier?.service_code ?? null,
    fullName: profile?.full_name ?? dossier?.name ?? "",
    phone: profile?.phone ?? dossier?.phone ?? "",
    affiliation:
      (profile?.affiliation_status as AffiliationStatus | null) ??
      (dossier?.is_diaspora ? "non_resident" : null),
    profile: { identity, residence, employment, compliance },
  };
}

/**
 * Enregistre la situation du demandeur.
 *
 * Le compte, lui, est ouvert par `/inscription` : cette action ne crée plus
 * de compte, elle ne complète que le dossier d'un demandeur déjà connecté.
 */
export async function saveServiceAction(serviceCode: string): Promise<OnboardingResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const { supabase, userId } = citizen;

  const { data: existing } = await supabase
    .from("dossiers")
    .select("id, duc_code")
    .eq("citizen_id", userId)
    .eq("service_code", serviceCode)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return { ok: true, dossierCode: existing.duc_code };
  }

  // Le dossier ouvert par l'inscription attend son service : on le complète,
  // on n'en ouvre pas un second. Un dossier par parcours.
  const { data: opened } = await supabase
    .from("dossiers")
    .select("id, duc_code, service_code")
    .eq("citizen_id", userId)
    .is("service_code", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (opened) {
    const { error } = await supabase
      .from("dossiers")
      .update({ service_code: serviceCode, updated_at: new Date().toISOString() })
      .eq("id", opened.id);

    if (error) return { ok: false, error: error.message };

    return { ok: true, dossierCode: opened.duc_code };
  }

  // Aucun dossier ouvert : on en ouvre un. Le code vient de la séquence, pour
  // que deux inscriptions simultanées n'aient pas le même.
  const { data: code, error: codeError } = await supabase.rpc("next_duc_code");
  if (codeError || typeof code !== "string" || code.length === 0) {
    return { ok: false, error: "Votre dossier n'a pas pu être ouvert. Réessayez." };
  }

  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      duc_code: code,
      citizen_id: userId,
      service_code: serviceCode,
      current_phase: "kyc_savings",
      status: "open",
    })
    .select("duc_code")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  return { ok: true, dossierCode: data?.duc_code ?? code };
}

/**
 * Le profil du demandeur est enregistré par `saveKycDraftAction`
 * (`src/server/actions/kyc-profile.ts`) : il n'y a qu'une action qui écrit
 * les déclarations, et elle écrit aussi la copie de travail du dossier.
 */

