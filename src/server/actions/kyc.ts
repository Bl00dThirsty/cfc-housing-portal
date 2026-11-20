"use server";

import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { notifyBusinessEvent } from "@/server/notifications/notify";
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
  | {
      ok: true;
      message: string;
      /**
       * La décision a-t-elle pu être **journalisée** ?
       *
       * Une décision qui change l'état du dossier citoyen mais qui n'apparaît
       * dans aucun journal est une décision sans trace : c'est un défaut, pas
       * un détail. Le fait est donc rapporté, jamais passé sous silence.
       */
      journaled: boolean;
    }
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

/**
 * États KYC qui constituent une **décision** notifiée à l'emprunteur.
 *
 * Les autres transitions sont des étapes de traitement : elles restent
 * journalisées, mais ne dérangent pas l'emprunteur.
 */
const KYC_DECISION_EVENTS: Partial<Record<KycState, string>> = {
  approved: "KYC_APPROVED",
  blocked: "KYC_REJECTED",
};

export async function listKycQueueAction(): Promise<KycQueueResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "kyc:read", profile.capabilities)) {
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
 *
 * Le **dossier visé** est la cible du journal. L'appelant peut le nommer ;
 * sinon il est déduit de l'emprunteur, de façon **déterministe** — à égalité
 * de date de création, l'identifiant départage. Une décision qui n'a pas pu
 * être journalisée est **rapportée** : elle n'est jamais appliquée en silence.
 */
export async function advanceKycAction(input: {
  citizenId: string;
  to: KycState;
  note: string;
  /** Dossier cible du journal ; déduit de l'emprunteur s'il est absent. */
  dossierId?: string | null;
}): Promise<KycActionResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "kyc:decide", profile.capabilities)) {
    return { ok: false, error: "Votre habilitation ne permet pas de décider sur un dossier KYC." };
  }

  if (!VALID_STATES.has(input.to)) {
    return { ok: false, error: "État KYC inconnu." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error: readError } = await supabase
    .from("citizen_profiles")
    .select("kyc_state, full_name, email")
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

  // Le journal porte la décision : il vise un dossier précis. L'appelant peut
  // le nommer — c'est le cas du test de bout en bout, et de toute interface
  // qui connaît le dossier. Sinon il est déduit de l'emprunteur, de façon
  // **déterministe** : à égalité de date de création, l'identifiant
  // départage. Sans cela, deux dossiers créés dans la même transaction
  // donneraient une cible au hasard.
  const dossierQuery = input.dossierId
    ? supabase
        .from("dossiers")
        .select("id")
        .eq("id", input.dossierId)
        .is("deleted_at", null)
        .maybeSingle()
    : supabase
        .from("dossiers")
        .select("id")
        .eq("citizen_id", input.citizenId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

  const { data: dossier } = await dossierQuery;

  const dossierId = (dossier as { id: string } | null)?.id ?? null;
  const note = input.note.trim() || null;

  // Une transition n'est pas toujours une décision : seules l'approbation et
  // le refus sont des **faits métier** notifiés à l'emprunteur. Le journal
  // porte donc le même vocabulaire que le catalogue des notifications.
  const decision = KYC_DECISION_EVENTS[input.to] ?? null;

  let journaled = false;

  if (dossierId) {
    // Le journal passe par l'enveloppe canonique : `dossier_events` est en
    // ajout seul, sous RLS forcé — seule la fonction `security definer`
    // écrit, après avoir vérifié l'habilitation de l'agent sur le dossier.
    const { error: eventError } = await supabase.rpc("append_dossier_event", {
      p_dossier_id: dossierId,
      p_event_type: decision ?? "kyc.state_changed",
      p_payload: { from, to: input.to, note },
      p_legal_basis: "COBAC R-2023/01 — lignes directrices LC-COB/01",
    });

    if (eventError) {
      return {
        ok: false,
        error: eventError.message.includes("dossier_event_forbidden")
          ? "Ce dossier n'est pas dans votre périmètre : la décision n'a pas été enregistrée."
          : eventError.message,
      };
    }

    journaled = true;
  }

  const { error: updateError } = await supabase
    .from("citizen_profiles")
    .update({ kyc_state: input.to, updated_at: new Date().toISOString() })
    .eq("id", input.citizenId);

  if (updateError) return { ok: false, error: updateError.message };

  if (decision) {
    await notifyBusinessEvent({
      eventType: decision,
      dossierId,
      recipientUserId: input.citizenId,
      recipientEmail: data.email ?? null,
      body: note,
      payload: { motif: note },
    });
  }

  return {
    ok: true,
    journaled,
    message: journaled
      ? `Dossier ${data.full_name ?? input.citizenId} : « ${KYC_STATE_LABELS[from]} » → « ${KYC_STATE_LABELS[input.to]} ».`
      : `Dossier ${data.full_name ?? input.citizenId} : « ${KYC_STATE_LABELS[from]} » → « ${KYC_STATE_LABELS[input.to]} ». Attention : aucun dossier de crédit n'est ouvert pour cet emprunteur — la décision n'a pas pu être journalisée.`,
  };
}
