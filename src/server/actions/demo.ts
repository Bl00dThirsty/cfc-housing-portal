"use server";

/**
 * Le panneau de démonstration — les décisions du **conseiller**.
 *
 * Ce module joue le rôle que l'agent joue en production : il décide, il
 * écrit le journal, il notifie le demandeur. Il le fait par le rôle de
 * service, parce qu'un outil de démonstration doit pouvoir écrire **n'importe
 * quel** dossier de test — et parce que les politiques RLS protègent le
 * citizen, pas le/developpeur.
 *
 * ⚠️ La route `/dev/demo` n'existe qu'en développement : le middleware la
 *    ferme en production (cf. `src/config/rbac/route-access.ts`).
 */

import { getAdminClient } from "@/server/supabase/admin";
import { notifyBusinessEvent } from "@/server/notifications/notify";
import { createServerSupabaseClient } from "@/server/supabase/server";
import {
  DEMO_PASSWORD,
  ensureDemoCitizen,
} from "@/server/testing/demo-citizen";

export type DemoResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Ouvre la session d'un compte de démonstration.
 *
 * La session est ouverte **côté serveur** : c'est elle qui pose le cookie de
 * session, et le demandeur arrive donc connecté à son portail.
 */
export async function demoSignInAction(input: {
  email: string;
  fullName: string;
}): Promise<DemoResult> {
  const admin = getAdminClient();

  try {
    await ensureDemoCitizen(admin, input.email, input.fullName);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Compte de démonstration indisponible.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, message: `Session ouverte pour ${input.email}.` };
}

/** Décide du dossier d'identité d'un demandeur. */
export async function demoDecideKycAction(input: {
  citizenId: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<DemoResult> {
  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("citizen_profiles")
    .select("kyc_state")
    .eq("id", input.citizenId)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "Demandeur introuvable." };
  }

  const from = profile.kyc_state as string;
  const to = input.decision === "approved" ? "approved" : "blocked";

  const { error: stateError } = await admin
    .from("citizen_profiles")
    .update({ kyc_state: to })
    .eq("id", input.citizenId);

  if (stateError) return { ok: false, error: stateError.message };

  const { data: dossier } = await admin
    .from("dossiers")
    .select("id")
    .eq("citizen_id", input.citizenId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dossier) {
    // La décision est **journalisée** : le journal fait foi.
    await admin.from("dossier_events").insert({
      dossier_id: dossier.id,
      event_type: input.decision === "approved" ? "KYC_APPROVED" : "KYC_REJECTED",
      actor_role: "ADMIN",
      payload: {
        from,
        to,
        ...(input.reason ? { reason: input.reason } : {}),
      },
      legal_basis: "COBAC R-2023/01 — lignes directrices LC-COB/01",
      occurred_at: new Date().toISOString(),
    });

    if (input.reason) {
      await admin
        .from("kyc_profiles")
        .update({ rejection_reason: input.reason })
        .eq("citizen_id", input.citizenId);
    }

    await notifyBusinessEvent({
      eventType: input.decision === "approved" ? "KYC_APPROVED" : "KYC_REJECTED",
      dossierId: dossier.id,
      recipientUserId: input.citizenId,
      payload: { from, to, ...(input.reason ? { reason: input.reason } : {}) },
    });
  }

  return {
    ok: true,
    message:
      input.decision === "approved"
        ? "Dossier d'identité validé."
        : "Dossier d'identité rejeté — le motif est écrit.",
  };
}

/**
 * Décide de l'**éligibilité** du demandeur.
 *
 * Éligible : le DUC est activé, et le demandeur peut commencer sa demande
 * de prêt. Non éligible : le DUC reste fermé, et l'explication est écrite —
 * elle est lisible par le demandeur sur son tableau de bord.
 */
export async function demoDecideEligibilityAction(input: {
  citizenId: string;
  eligible: boolean;
  note?: string;
}): Promise<DemoResult> {
  const admin = getAdminClient();

  const { data: dossier } = await admin
    .from("dossiers")
    .select("id, duc_code")
    .eq("citizen_id", input.citizenId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dossier) {
    return { ok: false, error: "Aucun dossier pour ce demandeur." };
  }

  const now = new Date().toISOString();

  const { error } = await admin
    .from("dossiers")
    .update({
      duc_status: input.eligible ? "active" : "non_active",
      duc_activated_at: input.eligible ? now : null,
      onboarding_state: input.eligible ? "active" : "suspension",
      updated_at: now,
    })
    .eq("id", dossier.id);

  if (error) return { ok: false, error: error.message };

  if (input.note) {
    await admin
      .from("kyc_profiles")
      .update({ rejection_reason: input.note })
      .eq("citizen_id", input.citizenId);
  }

  await admin.from("dossier_events").insert({
    dossier_id: dossier.id,
    event_type: input.eligible ? "DUC_ACTIVATED" : "DUC_REFUSED",
    actor_role: "ADMIN",
    payload: {
      duc_code: dossier.duc_code,
      ...(input.note ? { note: input.note } : {}),
    },
    legal_basis: "COBAC R-2023/01 — lignes directrices LC-COB/01",
    occurred_at: now,
  });

  await notifyBusinessEvent({
    eventType: input.eligible ? "DUC_ACTIVATED" : "DUC_REFUSED",
    dossierId: dossier.id,
    recipientUserId: input.citizenId,
    payload: input.note ? { note: input.note } : undefined,
  });

  return {
    ok: true,
    message: input.eligible
      ? "DUC activé : le demandeur peut commencer sa demande de prêt."
      : "Décision d'éligibilité : le dossier reste en attente.",
  };
}

/**
 * Remet le dossier à zéro.
 *
 * Le demandeur repart de l'identification : c'est la seule remise à zéro
 * qui rende la démonstration rejouable.
 */
export async function demoResetAction(input: { citizenId: string }): Promise<DemoResult> {
  const admin = getAdminClient();

  const { error: profileError } = await admin
    .from("citizen_profiles")
    .update({ kyc_state: "identity_capture" })
    .eq("id", input.citizenId);

  if (profileError) return { ok: false, error: profileError.message };

  const { error: dossierError } = await admin
    .from("dossiers")
    .update({
      duc_status: "non_active",
      duc_activated_at: null,
      onboarding_state: "kyc",
      prior_client_case: null,
      advisor: null,
      updated_at: new Date().toISOString(),
    })
    .eq("citizen_id", input.citizenId)
    .is("deleted_at", null);

  if (dossierError) return { ok: false, error: dossierError.message };

  await admin
    .from("kyc_profiles")
    .update({ submitted_at: null, rejection_reason: null })
    .eq("citizen_id", input.citizenId);

  return { ok: true, message: "Dossier remis à l'identification." };
}
