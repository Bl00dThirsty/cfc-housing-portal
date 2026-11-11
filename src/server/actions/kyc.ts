"use server";

import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { hasCapability } from "@/domain/policies/permissions";
import {
  KYC_STATE_LABELS,
  canTransition,
  nextStates,
  type KycState,
} from "@/domain/workflows/kyc";

export type KycQueueEntry = {
  citizenId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  affiliation: string | null;
  kycState: KycState;
  riskRating: "LOW" | "STANDARD" | "HIGH" | null;
  isDiaspora: boolean;
  updatedAt: string | null;
  allowedNext: readonly KycState[];
};

export type KycQueueResult =
  | { ok: true; entries: KycQueueEntry[] }
  | { ok: false; error: string };

export type KycActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type CitizenRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  affiliation_status: string | null;
  kyc_state: string;
  risk_rating: string | null;
  is_diaspora: boolean;
  updated_at: string | null;
};

const VALID_STATES = new Set(Object.keys(KYC_STATE_LABELS));

export async function listKycQueueAction(): Promise<KycQueueResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "kyc:read")) {
    return { ok: false, error: "Votre habilitation ne permet pas de consulter le dossier KYC." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("citizen_profiles")
    .select(
      "id, full_name, email, phone, affiliation_status, kyc_state, risk_rating, is_diaspora, updated_at",
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as CitizenRow[];
  const entries: KycQueueEntry[] = rows.map((row) => {
    const state = (VALID_STATES.has(row.kyc_state) ? row.kyc_state : "pre_boarding") as KycState;
    return {
      citizenId: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      affiliation: row.affiliation_status,
      kycState: state,
      riskRating: (row.risk_rating ?? null) as KycQueueEntry["riskRating"],
      isDiaspora: row.is_diaspora,
      updatedAt: row.updated_at,
      allowedNext: nextStates(state),
    };
  });

  return { ok: true, entries };
}

/**
 * Fait avancer un dossier KYC.
 *
 * La transition est validée par la machine à états du domaine, la décision est
 * journalisée dans `public.dossier_events`, et l'habilitation
 * `kyc:decide` est vérifiée avant toute écriture.
 */
export async function advanceKycAction(input: {
  citizenId: string;
  to: KycState;
  note: string;
}): Promise<KycActionResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "kyc:decide")) {
    return { ok: false, error: "Votre habilitation ne permet pas de décider sur un dossier KYC." };
  }

  if (!VALID_STATES.has(input.to)) {
    return { ok: false, error: "État KYC inconnu." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error: readError } = await supabase
    .from("citizen_profiles")
    .select("kyc_state, full_name")
    .eq("id", input.citizenId)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (!data) return { ok: false, error: "Dossier introuvable." };

  const from = data.kyc_state as KycState;
  if (!canTransition(from, input.to)) {
    return {
      ok: false,
      error: `Transition interdite : « ${KYC_STATE_LABELS[from]} » ne peut pas aller vers « ${KYC_STATE_LABELS[input.to]} ».`,
    };
  }

  const { error: updateError } = await supabase
    .from("citizen_profiles")
    .update({ kyc_state: input.to, updated_at: new Date().toISOString() })
    .eq("id", input.citizenId);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: eventError } = await supabase.from("dossier_events").insert({
    dossier_id: null,
    event_type: "kyc.state_changed",
    actor_id: profile.actorId,
    actor_role: profile.role,
    payload: { from, to: input.to, note: input.note.trim() || null },
    legal_basis: "COBAC R-2023/01 — lignes directrices LC-COB/01",
  });

  if (eventError) return { ok: false, error: eventError.message };

  return {
    ok: true,
    message: `Dossier ${data.full_name ?? input.citizenId} : « ${KYC_STATE_LABELS[from]} » → « ${KYC_STATE_LABELS[input.to]} ».`,
  };
}
