"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
import { notifyBusinessEvent } from "@/server/notifications/notify";
import { PRIOR_CLIENT_CASES, type PriorClientCase } from "@/domain/entities/kyc-profile";

export type BorrowerRequestActionResult =
  | { ok: true; message?: string; dossierId?: string; dossierCode?: string; advisor?: string; reused?: boolean }
  | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function currentCitizen() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: actor } = await supabase
    .from("actors")
    .select("actor_type")
    .eq("id", user.id)
    .maybeSingle();

  if (actor?.actor_type !== "citizen") return null;
  return { supabase, user };
}

function errorMessage(message: string): string {
  if (message.includes("borrower_region_required")) {
    return "Complétez votre région de résidence dans votre profil avant de créer une demande.";
  }
  if (message.includes("borrower_region_unroutable") || message.includes("no_active_regional_manager")) {
    return "Aucune agence avec gestionnaire actif ne couvre votre région. L’assistance CFC doit configurer votre routage avant la transmission.";
  }
  if (message.includes("borrower_request_not_found") || message.includes("no_dossier")) {
    return "Cette demande n’existe pas ou ne vous appartient pas.";
  }
  if (message.includes("request_not_withdrawable")) {
    return "Cette demande a déjà été transmise. Contactez votre gestionnaire depuis la conversation du dossier.";
  }
  if (message.includes("request_service_locked")) {
    return "Le service est déjà choisi pour cette demande. Annulez le brouillon pour en démarrer un autre.";
  }
  if (message.includes("service_required")) {
    return "Choisissez un service avant de continuer.";
  }
  if (message.includes("unknown_service")) {
    return "Ce service n’est pas disponible dans le catalogue actuel.";
  }
  if (message.includes("onboarding_suspended")) {
    return "Votre demande attend une orientation du conseiller avant sa transmission.";
  }
  if (message.includes("unknown_prior_client_case")) {
    return "La situation sélectionnée n’est pas reconnue.";
  }
  return "L’opération n’a pas abouti. Réessayez dans un instant.";
}

function rpcFailure(error: { message: string } | null, fallback: string): BorrowerRequestActionResult | null {
  if (!error) return null;
  return { ok: false, error: error.message ? errorMessage(error.message) : fallback };
}

export async function startBorrowRequestAction(): Promise<BorrowerRequestActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session emprunteur a expiré. Reconnectez-vous pour continuer." };
  }

  const { data, error } = await citizen.supabase.rpc("create_borrower_request");
  const failure = rpcFailure(error, "La nouvelle demande n’a pas pu être créée.");
  if (failure) return failure;

  const result = Array.isArray(data) ? data[0] : data;
  const row = result as { dossier_id?: string; duc_code?: string; reused?: boolean } | null;
  if (!row?.dossier_id || !row.duc_code) {
    return { ok: false, error: "La demande a été créée, mais son numéro n’a pas pu être relu." };
  }

  return {
    ok: true,
    dossierId: row.dossier_id,
    dossierCode: row.duc_code,
    reused: row.reused === true,
    message: row.reused
      ? "Votre demande en cours a été reprise."
      : "Votre nouvelle demande est ouverte.",
  };
}

export async function saveServiceAction(
  serviceCode: string,
  dossierId: string,
): Promise<BorrowerRequestActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session emprunteur a expiré. Reconnectez-vous pour continuer." };
  }
  if (!UUID_PATTERN.test(dossierId) || !serviceCode.trim()) {
    return { ok: false, error: "La demande ou le service sélectionné est invalide." };
  }

  const { error } = await citizen.supabase.rpc("save_borrower_request_service", {
    p_dossier_id: dossierId,
    p_service_code: serviceCode.trim(),
  });
  const failure = rpcFailure(error, "Le service n’a pas pu être enregistré.");
  if (failure) return failure;

  const { data: dossier } = await citizen.supabase
    .from("dossiers")
    .select("duc_code")
    .eq("id", dossierId)
    .eq("citizen_id", citizen.user.id)
    .maybeSingle();

  return {
    ok: true,
    dossierCode: typeof dossier?.duc_code === "string" ? dossier.duc_code : undefined,
    message: "Le service a été ajouté à cette demande.",
  };
}

export async function setPriorClientCaseAction(input: {
  priorClientCase: PriorClientCase;
  dossierId: string;
}): Promise<BorrowerRequestActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session emprunteur a expiré. Reconnectez-vous pour continuer." };
  }
  if (!UUID_PATTERN.test(input.dossierId) || !PRIOR_CLIENT_CASES.some((item) => item.value === input.priorClientCase)) {
    return { ok: false, error: "La demande ou la situation sélectionnée est invalide." };
  }

  const { data, error } = await citizen.supabase.rpc("set_prior_client_case", {
    p_dossier_id: input.dossierId,
    p_case: input.priorClientCase,
  });
  const failure = rpcFailure(error, "La situation n’a pas pu être enregistrée.");
  if (failure) return failure;

  const { data: dossier } = await citizen.supabase
    .from("dossiers")
    .select("advisor, duc_code")
    .eq("id", input.dossierId)
    .eq("citizen_id", citizen.user.id)
    .maybeSingle();

  const suspended = data === "suspension";
  if (data === "documents" || suspended) {
    await notifyBusinessEvent({
      eventType: data === "documents" ? "DOCUMENTS_READY" : "APPLICATION_SUSPENDED",
      dossierId: input.dossierId,
      recipientUserId: citizen.user.id,
      payload: {
        prior_client_case: input.priorClientCase,
        advisor: typeof dossier?.advisor === "string" ? dossier.advisor : null,
        duc_code: typeof dossier?.duc_code === "string" ? dossier.duc_code : null,
      },
    });
  }

  return {
    ok: true,
    advisor: typeof dossier?.advisor === "string" ? dossier.advisor : undefined,
    message: suspended
      ? "Votre demande a été transmise à un gestionnaire pour orientation."
      : "Votre demande passe au dépôt des pièces.",
  };
}

export async function submitServiceApplicationAction(
  dossierId: string,
): Promise<BorrowerRequestActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session emprunteur a expiré. Reconnectez-vous pour continuer." };
  }
  if (!UUID_PATTERN.test(dossierId)) {
    return { ok: false, error: "La demande sélectionnée est invalide." };
  }

  const { data, error } = await citizen.supabase.rpc("submit_service_application", {
    p_dossier_id: dossierId,
  });
  const failure = rpcFailure(error, "La demande n’a pas pu être transmise.");
  if (failure) return failure;

  const advisor = typeof data === "string" ? data : undefined;
  const { data: dossier } = await citizen.supabase
    .from("dossiers")
    .select("id, duc_code")
    .eq("id", dossierId)
    .eq("citizen_id", citizen.user.id)
    .maybeSingle();

  if (dossier) {
    await notifyBusinessEvent({
      eventType: "APPLICATION_SUBMITTED",
      dossierId: dossier.id,
      recipientUserId: citizen.user.id,
      payload: { conseiller: advisor ?? null, duc_code: dossier.duc_code },
    });
  }

  return { ok: true, advisor, message: "Votre demande a été transmise." };
}

export async function withdrawBorrowRequestAction(
  dossierId: string,
): Promise<BorrowerRequestActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session emprunteur a expiré. Reconnectez-vous pour continuer." };
  }
  if (!UUID_PATTERN.test(dossierId)) {
    return { ok: false, error: "La demande sélectionnée est invalide." };
  }

  const { error } = await citizen.supabase.rpc("withdraw_borrower_request", {
    p_dossier_id: dossierId,
  });
  const failure = rpcFailure(error, "La demande n’a pas pu être clôturée.");
  return failure ?? { ok: true, message: "Le brouillon a été clôturé. Son historique est conservé." };
}
