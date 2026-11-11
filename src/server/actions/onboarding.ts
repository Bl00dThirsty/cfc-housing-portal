"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
import {
  EMPTY_DRAFT,
  normalisePhone,
  type AffiliationStatus,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";
import type { SelectedAddress } from "@/domain/entities/address";

export type OnboardingResult =
  | { ok: true; message?: string; dossierCode?: string }
  | { ok: false; error: string };

function ducCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
  return `CFC-${year}-DUC-${suffix}`;
}

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
  profession: string | null;
  employer: string | null;
  affiliation_status: string | null;
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

  const [{ data: profileData }, { data: dossierData }] = await Promise.all([
    supabase
      .from("citizen_profiles")
      .select(
        "full_name, email, phone, birth_date, cni_raw, address, profession, employer, affiliation_status",
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
  ]);

  const profile = profileData as ProfileRow | null;
  const dossier = dossierData as DossierRow | null;

  const fullName = dossier?.name ?? profile?.full_name ?? "";
  const email = dossier?.email ?? profile?.email ?? "";
  const phone = dossier?.phone ?? profile?.phone ?? "";
  const birthDate = dossier?.birth_date ?? profile?.birth_date ?? "";
  const cniNumber = dossier?.cni_raw ?? profile?.cni_raw ?? "";
  const addressLabel = dossier?.address ?? profile?.address ?? null;
  const profession = dossier?.profession ?? profile?.profession ?? "";
  const employer = dossier?.employer ?? profile?.employer ?? "";

  if (!profile && !dossier) return EMPTY_DRAFT;

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
    monthlyIncome: dossier?.monthly_income ? String(dossier.monthly_income) : "",
  };
}

export async function saveAccountAction(input: {
  phone: string;
  affiliation: AffiliationStatus;
}): Promise<OnboardingResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const { supabase, userId } = citizen;

  const { error } = await supabase.from("citizen_profiles").upsert(
    {
      id: userId,
      phone: normalisePhone(input.phone),
      affiliation_status: input.affiliation,
      email: citizen.userId ? undefined : undefined,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Votre situation a été enregistrée." };
}

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

  const code = ducCode();
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
    monthly_income: input.monthlyIncome ? Number(input.monthlyIncome.replace(/\D/g, "")) : null,
    updated_at: new Date().toISOString(),
  };

  if (dossier) {
    const { error } = await supabase.from("dossiers").update(patch).eq("id", dossier.id);
    if (error) return { ok: false, error: error.message };
  }

  const { error: profileError } = await supabase.from("citizen_profiles").upsert(
    {
      id: userId,
      full_name: input.fullName.trim(),
      birth_date: input.birthDate || null,
      cni_raw: input.cniNumber.trim() || null,
      address: addressLabel,
      profession: input.profession.trim() || null,
      employer: input.employer.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) return { ok: false, error: profileError.message };

  return { ok: true, message: "Votre dossier a été mis à jour." };
}
