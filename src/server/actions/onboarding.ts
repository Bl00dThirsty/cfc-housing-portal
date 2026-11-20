"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
import {
  EMPTY_DRAFT,
  fromStoredProfile,
  type AffiliationStatus,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

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
  id: string;
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

export async function loadOnboardingDraft(dossierId: string): Promise<OnboardingDraft> {
  const citizen = await currentCitizen();
  if (!citizen) return EMPTY_DRAFT;

  if (!/^[0-9a-f-]{36}$/i.test(dossierId)) return EMPTY_DRAFT;

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
        "id, duc_code, service_code, name, cni_raw, birth_date, phone, email, address, profession, employer, monthly_income, is_diaspora",
      )
      .eq("citizen_id", userId)
      .eq("id", dossierId)
      .is("deleted_at", null)
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
    dossierId: dossier?.id ?? null,
    fullName: profile?.full_name ?? dossier?.name ?? "",
    phone: profile?.phone ?? dossier?.phone ?? "",
    affiliation:
      (profile?.affiliation_status as AffiliationStatus | null) ??
      (dossier?.is_diaspora ? "non_resident" : null),
    profile: { identity, residence, employment, compliance },
  };
}

