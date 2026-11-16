"use server";

/**
 * Les décisions de l'agent sur un dossier.
 *
 * Ce module est le pendant **réel** du panneau de démonstration : l'agent y
 * décide de l'activation du dossier unique, y refuse une éligibilité, y
 * demande une pièce, et y statue sur une pièce déposée.
 *
 * Deux règles structurantes :
 *
 * 1. **La décision appartient à la base.** L'action appelle une fonction
 *    `security definer` qui vérifie l'habilitation, le périmètre et applique
 *    la transition **atomiquement** — la décision, son effet et sa trace dans
 *    le journal forment un seul fait. L'action serveur ne réécrit jamais une
 *    colonne de dossier : le garde-fou de la migration 029 le lui interdit,
 *    et c'est bien ainsi.
 *
 * 2. **La décision se dit à l'emprunteur.** Chaque décision produit un signal
 *    in-app et, quand le fait le mérite, un courriel. C'est le même dispatch
 *    que le reste du produit (`notifyBusinessEvent`) : une seule rédaction, un
 *    seul vocabulaire.
 */

import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { notifyBusinessEvent } from "@/server/notifications/notify";
import { hasCapability } from "@/domain/policies/permissions";

export type DossierDecisionResult =
  | { ok: true; message: string; eventType: string }
  | { ok: false; error: string };

/** Un dossier qui attend une décision de l'agent. */
export interface DossierToOrient {
  dossierId: string;
  ducCode: string;
  citizenId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  /** Situation du parcours : `suspension`, `en_examen` ou `documents`. */
  onboardingState: string | null;
  /** Le DUC est-il activé ? */
  ducStatus: string | null;
  /** Le conseiller affecté au dossier. */
  advisor: string | null;
  serviceCode: string | null;
  isDiaspora: boolean;
  updatedAt: string | null;
}

export type DossierQueueResult =
  | { ok: true; dossiers: DossierToOrient[] }
  | { ok: false; error: string };

/** Une pièce du catalogue documentaire. */
export interface DocumentTypeOption {
  code: string;
  label: string;
}

/**
 * Les pièces que l'agent peut demander.
 *
 * On ne demande pas une pièce qui n'existe pas au catalogue : le demandeur
 * ne pourrait alors rien produire.
 */
export async function listDocumentTypesAction(): Promise<
  { ok: true; types: DocumentTypeOption[] } | { ok: false; error: string }
> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "document:request")) {
    return { ok: false, error: "Votre habilitation ne permet pas de demander une pièce." };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .schema("ref")
    .from("document_type")
    .select("code, label")
    .is("deleted_at", null)
    .order("label", { ascending: true });

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    types: ((data ?? []) as { code: string; label: string }[]).map((row) => ({
      code: row.code,
      label: row.label,
    })),
  };
}

/**
 * Les situations du parcours qui attendent l'agent.
 *
 * Un dossier `suspension` attend son orientation ; un dossier `en_examen` est
 * instruit ; un dossier `documents` attend ses pièces. Un dossier `active`
 * n'attend plus rien : il est sorti de la file.
 */
const PENDING_ONBOARDING_STATES = ["suspension", "en_examen", "documents"] as const;

/**
 * La file des dossiers à orienter.
 *
 * La lecture est faite par le client **authentifié** : c'est la RLS qui
 * restreint la liste au périmètre de l'agent (son agence, son portefeuille,
 * ses dossiers diaspora). L'application ne redéfinit pas le périmètre — elle
 * n'en fait qu'un seul, avec la base.
 */
export async function listDossiersToOrientAction(): Promise<DossierQueueResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "dossier:read")) {
    return { ok: false, error: "Votre habilitation ne permet pas de consulter les dossiers." };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("dossiers")
    .select(
      "id, duc_code, citizen_id, name, email, phone, onboarding_state, duc_status, advisor, service_code, is_diaspora, updated_at",
    )
    .in("onboarding_state", [...PENDING_ONBOARDING_STATES])
    .is("deleted_at", null)
    .order("updated_at", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as {
    id: string;
    duc_code: string;
    citizen_id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    onboarding_state: string | null;
    duc_status: string | null;
    advisor: string | null;
    service_code: string | null;
    is_diaspora: boolean;
    updated_at: string | null;
  }[];

  // Le nom de l'emprunteur vient du profil citoyen : le dossier en garde une
  // copie de travail, mais c'est le profil qui fait foi.
  const citizenIds = rows
    .map((row) => row.citizen_id)
    .filter((id): id is string => typeof id === "string");

  const names = new Map<string, string | null>();

  if (citizenIds.length > 0) {
    const { data: profiles } = await supabase
      .from("citizen_profiles")
      .select("id, full_name, email")
      .in("id", citizenIds);

    for (const profileRow of (profiles ?? []) as {
      id: string;
      full_name: string | null;
      email: string | null;
    }[]) {
      names.set(profileRow.id, profileRow.full_name ?? profileRow.email);
    }
  }

  return {
    ok: true,
    dossiers: rows.map((row) => ({
      dossierId: row.id,
      ducCode: row.duc_code,
      citizenId: row.citizen_id ?? "",
      fullName: (row.citizen_id ? names.get(row.citizen_id) : null) ?? row.name,
      email: row.email,
      phone: row.phone,
      onboardingState: row.onboarding_state,
      ducStatus: row.duc_status,
      advisor: row.advisor,
      serviceCode: row.service_code,
      isDiaspora: row.is_diaspora,
      updatedAt: row.updated_at,
    })),
  };
}

/**
 * Traduit une erreur de la base en message lisible.
 *
 * La base dit ce qui a échoué ; l'agent doit lire une phrase.
 */
function translateRpcError(message: string): string {
  if (/dossier_event_forbidden|dossier_decide_forbidden/.test(message)) {
    return "Ce dossier n'est pas dans votre périmètre : la décision n'a pas été enregistrée.";
  }
  if (/dossier_not_found/.test(message)) {
    return "Dossier introuvable.";
  }
  if (/motif_required/.test(message)) {
    return "Un refus se motive : indiquez pourquoi le dossier n'est pas activé.";
  }
  if (/unknown_document_type/.test(message)) {
    return "Cette pièce n'existe pas au catalogue documentaire.";
  }
  if (/document_not_decidable/.test(message)) {
    return "Cette pièce n'est pas déposée : elle ne peut pas être statuée.";
  }
  if (/document_reject_forbidden|document_validate_forbidden/.test(message)) {
    return "Votre habilitation ne permet pas de statuer sur cette pièce.";
  }
  if (/document_request_forbidden/.test(message)) {
    return "Votre habilitation ne permet pas de demander une pièce.";
  }
  return message;
}

/**
 * L'adresse de l'emprunteur, pour le courriel.
 *
 * Le dossier en garde une copie de travail ; c'est le profil citoyen qui
 * fait foi.
 */
async function resolveCitizenEmail(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  citizenId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("citizen_profiles")
    .select("email")
    .eq("id", citizenId)
    .maybeSingle();

  return ((data as { email: string | null } | null)?.email ?? null);
}

/**
 * Décide de l'activation du dossier unique.
 *
 * Deux issues, et elles ne se disent pas de la même façon : l'activation est
 * une bonne nouvelle, le refus doit dire ce qu'il faut corriger.
 */
export async function decideDucEligibilityAction(input: {
  dossierId: string;
  eligible: boolean;
  motif?: string;
}): Promise<DossierDecisionResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "dossier:decide")) {
    return { ok: false, error: "Votre habilitation ne permet pas de décider sur un dossier." };
  }

  const motif = input.motif?.trim() ?? "";

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("decide_duc_eligibility", {
    p_dossier_id: input.dossierId,
    p_eligible: input.eligible,
    p_motif: motif,
  });

  if (error) {
    return { ok: false, error: translateRpcError(error.message) };
  }

  const eventType = typeof data === "string" ? data : input.eligible ? "DUC_ACTIVATED" : "DUC_REFUSED";

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, citizen_id")
    .eq("id", input.dossierId)
    .maybeSingle();

  const citizenId = (dossier as { citizen_id: string | null } | null)?.citizen_id ?? null;

  if (citizenId) {
    await notifyBusinessEvent({
      eventType,
      dossierId: input.dossierId,
      recipientUserId: citizenId,
      recipientEmail: await resolveCitizenEmail(supabase, citizenId),
      payload: {
        motif,
        conseiller: profile.fullName,
      },
    });
  }

  return {
    ok: true,
    eventType,
    message: input.eligible
      ? "Dossier activé : l'emprunteur peut commencer sa demande de prêt."
      : "Éligibilité refusée : le motif est écrit et l'emprunteur est prévenu.",
  };
}

/**
 * Demande une pièce à l'emprunteur.
 *
 * La demande est un **fait** : elle est journalisée et notifiée. Elle ne
 * crée pas de pièce — une pièce qui n'existe pas encore n'a ni empreinte, ni
 * taille, ni nom de fichier.
 */
export async function requestDossierDocumentAction(input: {
  dossierId: string;
  docTypeCode: string;
  motif?: string;
}): Promise<DossierDecisionResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "document:request")) {
    return { ok: false, error: "Votre habilitation ne permet pas de demander une pièce." };
  }

  const docTypeCode = input.docTypeCode.trim();
  if (!docTypeCode) {
    return { ok: false, error: "Indiquez la pièce demandée." };
  }

  const motif = input.motif?.trim() ?? "";

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("request_dossier_document", {
    p_dossier_id: input.dossierId,
    p_doc_type_code: docTypeCode,
    p_motif: motif,
  });

  if (error) {
    return { ok: false, error: translateRpcError(error.message) };
  }

  const eventType = "DOCUMENT_REQUESTED";
  const returnedCode = typeof data === "string" ? data : docTypeCode;

  // Le libellé de la pièce : le courriel dit « CNI biométrique », pas
  // `CNI_BIO`.
  const { data: docType } = await supabase
    .schema("ref")
    .from("document_type")
    .select("label")
    .eq("code", returnedCode)
    .maybeSingle();

  const documentLabel =
    ((docType as { label: string | null } | null)?.label ?? null) ?? returnedCode;

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, citizen_id")
    .eq("id", input.dossierId)
    .maybeSingle();

  const citizenId = (dossier as { citizen_id: string | null } | null)?.citizen_id ?? null;

  if (citizenId) {
    await notifyBusinessEvent({
      eventType,
      dossierId: input.dossierId,
      recipientUserId: citizenId,
      recipientEmail: await resolveCitizenEmail(supabase, citizenId),
      payload: {
        // Le discriminant du fait : deux demandes de pièces différentes ne
        // sont pas le même fait.
        doc_type_code: returnedCode,
        document: documentLabel,
        motif,
        conseiller: profile.fullName,
      },
    });
  }

  return {
    ok: true,
    eventType,
    message: `Pièce demandée : ${documentLabel}. L'emprunteur est prévenu.`,
  };
}

/**
 * Statue sur une pièce déposée.
 *
 * Valider et rejeter sont deux habilitations distinctes : l'unité qui
 * contrôle une pièce ne la valide pas.
 */
export async function decideDossierDocumentAction(input: {
  documentId: string;
  decision: "validated" | "rejected";
  note?: string;
}): Promise<DossierDecisionResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };

  const capability =
    input.decision === "validated" ? "document:validate" : "document:reject";

  if (!hasCapability(profile.role, capability)) {
    return { ok: false, error: "Votre habilitation ne permet pas de statuer sur cette pièce." };
  }

  const note = input.note?.trim() ?? "";

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("decide_dossier_document", {
    p_document_id: input.documentId,
    p_decision: input.decision,
    p_note: note,
  });

  if (error) {
    return { ok: false, error: translateRpcError(error.message) };
  }

  const eventType =
    typeof data === "string"
      ? data
      : input.decision === "validated"
        ? "DOCUMENT_VALIDATED"
        : "DOCUMENT_REJECTED";

  // Le dossier de la pièce, pour l'adresser à l'emprunteur.
  const { data: document } = await supabase
    .from("dossier_documents")
    .select("id, dossier_id, doc_type_code")
    .eq("id", input.documentId)
    .maybeSingle();

  const dossierId = (document as { dossier_id: string } | null)?.dossier_id ?? null;

  if (dossierId) {
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("id, citizen_id")
      .eq("id", dossierId)
      .maybeSingle();

    const citizenId = (dossier as { citizen_id: string | null } | null)?.citizen_id ?? null;

    if (citizenId) {
      const { data: docType } = await supabase
        .schema("ref")
        .from("document_type")
        .select("label")
        .eq("code", (document as { doc_type_code: string }).doc_type_code)
        .maybeSingle();

      await notifyBusinessEvent({
        eventType,
        dossierId,
        recipientUserId: citizenId,
        recipientEmail: await resolveCitizenEmail(supabase, citizenId),
        payload: {
          // Le discriminant du fait : la pièce visée.
          document_id: input.documentId,
          document:
            ((docType as { label: string | null } | null)?.label ?? null) ??
            (document as { doc_type_code: string }).doc_type_code,
          motif: note,
          conseiller: profile.fullName,
        },
      });
    }
  }

  return {
    ok: true,
    eventType,
    message:
      input.decision === "validated"
        ? "Pièce validée : l'emprunteur est prévenu."
        : "Pièce rejetée : le motif est écrit et l'emprunteur est prévenu.",
  };
}
