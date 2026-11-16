"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
import {
  EMPTY_DRAFT,
  type AffiliationStatus,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";
import { toE164 } from "@/domain/entities/phone";
import type { SelectedAddress } from "@/domain/entities/address";

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

  const employment = (kyc?.employment ?? {}) as Record<string, unknown>;
  const compliance = (kyc?.compliance ?? {}) as Record<string, unknown>;

  const fullName = dossier?.name ?? profile?.full_name ?? "";
  const email = dossier?.email ?? profile?.email ?? "";
  const phone = dossier?.phone ?? profile?.phone ?? "";
  const birthDate = dossier?.birth_date ?? profile?.birth_date ?? "";
  const cniNumber = dossier?.cni_raw ?? profile?.cni_raw ?? "";
  const addressLabel = dossier?.address ?? profile?.address ?? null;
  const profession = dossier?.profession ?? (employment.profession as string) ?? "";
  const employer = dossier?.employer ?? (employment.employer as string) ?? "";

  if (!profile && !dossier && !kyc) return EMPTY_DRAFT;

  return {
    ...EMPTY_DRAFT,
    email,
    phone,
    affiliation:
      (profile?.affiliation_status as AffiliationStatus | null) ??
      (dossier?.is_diaspora ? "non_resident" : null),
    serviceCode: dossier?.service_code ?? null,
    fullName,
    birthDate,
    cniNumber,
    address: addressLabel
      ? ({
          placeId: `stored-${addressLabel}`,
          label: addressLabel,
          shortLabel: addressLabel,
          kind: "other",
          lat: null,
          lon: null,
          osmType: "stored",
          osmId: "",
          postcode: null,
          countryCode: "cm",
          source: "manual",
        } satisfies SelectedAddress)
      : null,
    profession,
    employer,
    // Le revenu **déclaré** par le citoyen ; le revenu évalué par la
    // plateforme reste la référence du dossier.
    monthlyIncome: employment.declared_income
      ? String(employment.declared_income)
      : dossier?.monthly_income
        ? String(dossier.monthly_income)
        : "",
    dependants: Number(compliance.dependants ?? 0) || 0,
    existingLoans: (compliance.existing_loans as string) ?? "",
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

export async function saveProfileAction(input: {
  fullName: string;
  birthDate: string;
  cniNumber: string;
  phone: string;
  affiliation: AffiliationStatus | null;
  address: SelectedAddress | null;
  profession: string;
  employer: string;
  monthlyIncome: string;
  dependants: number;
  existingLoans: string;
}): Promise<OnboardingResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const { supabase, userId } = citizen;

  const addressLabel = input.address?.label ?? null;

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id")
    .eq("citizen_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const patch = {
    name: input.fullName.trim(),
    birth_date: input.birthDate || null,
    cni_raw: input.cniNumber.trim() || null,
    address: addressLabel,
    city: input.address?.shortLabel ?? null,
    region: input.address?.label?.split(",").slice(-2, -1)[0]?.trim() ?? null,
    profession: input.profession.trim() || null,
    employer: input.employer.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (dossier) {
    const { error } = await supabase.from("dossiers").update(patch).eq("id", dossier.id);
    if (error) return { ok: false, error: error.message };
  }

  // Les **déclarations** du citoyen : le revenu qu'il déclare, les personnes
  // à charge, les crédits en cours. Le revenu *assessé* par la plateforme
  // (`dossiers.monthly_income`) n'est pas écrit d'ici — la plateforme en
  // garde la main.
  const { error: kycError } = await supabase.from("kyc_profiles").upsert(
    {
      citizen_id: userId,
      identity: {
        full_name: input.fullName.trim(),
        birth_date: input.birthDate || null,
        cni_number: input.cniNumber.trim() || null,
      },
      residence: {
        address: addressLabel,
        city: input.address?.shortLabel ?? null,
        region: input.address?.label?.split(",").slice(-2, -1)[0]?.trim() ?? null,
      },
      employment: {
        profession: input.profession.trim() || null,
        employer: input.employer.trim() || null,
        declared_income: input.monthlyIncome
          ? Number(input.monthlyIncome.replace(/\D/g, ""))
          : null,
      },
      compliance: {
        dependants: input.dependants,
        existing_loans: input.existingLoans.trim() || null,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "citizen_id" },
  );

  if (kycError) return { ok: false, error: kycError.message };

  // Le profil citoyen porte l'**identité** ; la profession et l'employeur
  // appartiennent au dossier. Les écrire ici ferait échouer l'enregistrement
  // entier — et l'emprunteur verrait « votre session a expiré ».
  const { error: profileError } = await supabase.from("citizen_profiles").upsert(
    {
      id: userId,
      full_name: input.fullName.trim(),
      birth_date: input.birthDate || null,
      cni_raw: input.cniNumber.trim() || null,
      address: addressLabel,
      phone: input.phone ? toE164(input.phone) : null,
      affiliation_status: input.affiliation,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) return { ok: false, error: profileError.message };

  return { ok: true, message: "Votre dossier a été mis à jour." };
}
