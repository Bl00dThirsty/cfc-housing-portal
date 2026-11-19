/**
 * Aiguillage des événements métier vers les modèles d'e-mail.
 *
 * Le produit n'écrit pas d'e-mail : il **enregistre un fait métier**
 * (`public.dossier_events`, création d'un profil citoyen). Ce module traduit
 * ce fait en « modèle + variables + destinataire », puis appelle la chaîne
 * d'envoi unique.
 *
 * C'est le point d'entrée à utiliser depuis toute action serveur :
 *
 * ```ts
 * await notifyDomainEvent({
 *   eventType: "KYC_APPROVED",
 *   dossierId,
 *   payload: { motif: "…" },
 * });
 * ```
 */

import "server-only";

import { getSiteUrl } from "@/server/env";
import { getAdminClient } from "@/server/supabase/admin";
import { factSubject } from "@/domain/entities/processes";
import { sendTemplatedEmail, type SendEmailResult } from "./send";
import type { EmailVariables } from "./types";

/** Événement métier → code de modèle. */
export const DOMAIN_EVENT_TEMPLATES: Record<string, string> = {
  PROFILE_CREATED: "WELCOME",
  MAGIC_LINK_REQUESTED: "MAGIC_LINK",
  PASSWORD_RESET_REQUESTED: "RESET_PASSWORD",
  STAFF_INVITATION_SENT: "STAFF_INVITATION",
  KYC_SUBMITTED: "KYC_SUBMITTED",
  KYC_APPROVED: "KYC_APPROVED",
  KYC_REJECTED: "KYC_REJECTED",
  APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
  APPLICATION_SUSPENDED: "APPLICATION_SUSPENDED",
  DOCUMENTS_READY: "DOCUMENTS_READY",
  DUC_ACTIVATED: "DUC_ACTIVATED",
  DUC_REFUSED: "DUC_REFUSED",
  DOCUMENT_REQUESTED: "DOCUMENT_REQUESTED",
  DOCUMENT_VALIDATED: "DOCUMENT_VALIDATED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  COMMITTEE_DECISION: "COMMITTEE_DECISION",
  LOAN_OFFER_ISSUED: "LOAN_OFFER_ISSUED",
  DISBURSEMENT_RELEASED: "DISBURSEMENT_RELEASED",
  PAYOFF_STATEMENT: "PAYOFF_STATEMENT",
  MAINLEVEE_READY: "MAINLEVEE_READY",
  SAVE_CONTACT: "SAVE_CONTACT",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOSSIER_UPDATED: "DOSSIER_UPDATED",
  DOSSIER_ASSIGNED: "DOSSIER_ASSIGNED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  SUPPORT_MESSAGE: "SUPPORT_MESSAGE",
};

/**
 * Enveloppe d'événement reçue du relais base de données.
 *
 * Elle est consommée par le dispatch des notifications
 * (`src/server/notifications/notify.ts`), qui décide à la fois du signal
 * in-app et du courriel.
 */
export interface DomainEventEnvelope {
  /** Table d'origine (`dossier_events`, `citizen_profiles`). */
  source?: string;
  /** Type d'événement métier. */
  event_type?: string;
  /** Ligne d'origine, telle que sérialisée par le déclencheur. */
  row?: Record<string, unknown>;
}

/** Événement métier décrit par le code applicatif. */
export interface DomainEvent {
  eventType: string;
  dossierId?: string | null;
  citizenId?: string | null;
  recipientEmail?: string | null;
  payload?: Record<string, unknown>;
}

/** Dossier et citoyen résolus. */
interface ResolvedRecipient {
  email: string | null;
  fullName: string | null;
  ducCode: string | null;
  dossierId: string | null;
  loanAmount: number | null;
  rate: number | null;
  durationYears: number | null;
  monthlyPayment: number | null;
  /** Le conseiller affecté au dossier — celui qui instruit. */
  advisor: string | null;
}

/** Découpe un nom complet en prénom et nom. */
export function splitName(fullName: string | null): { prenom: string; nom: string } {
  if (!fullName) return { prenom: "", nom: "" };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

/** Formate une date en français. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

/** Formate un montant en francs CFA. */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

/**
 * Construit les variables communes d'un message citoyen.
 *
 * Toute variable présente dans `payload` écrase la valeur calculée : le
 * fait métier porte la valeur de référence (un motif de refus, un montant
 * arrêtée par le comité…).
 */
export function buildVariables(
  context: {
    recipient: ResolvedRecipient;
    payload?: Record<string, unknown>;
    date?: string;
    link?: string;
  },
): EmailVariables {
  const { recipient, payload = {}, date, link } = context;
  const { prenom, nom } = splitName(recipient.fullName);
  const siteUrl = getSiteUrl();

  const variables: EmailVariables = {
    prenom,
    nom,
    email: recipient.email ?? "",
    duc: recipient.ducCode ?? "",
    reference: recipient.ducCode ?? "",
    date: date ?? formatDate(new Date()),
    lien: link ?? `${siteUrl}/portail-client`,
    /**
     * L'adresse du siege : elle est dans le pied de chaque message. Un
     * courriel du CFC qui ne dit pas d'ou il vient n'est pas un courriel du
     * CFC.
     */
    siege: siteUrl,
    /**
     * Le logo : une **URL absolue**, car un client e-mail ne sait pas
     * resoudre un chemin relatif. C'est elle qui fait la signature du
     * message.
     */
    logo: `${siteUrl}/images/logo-cfc.png`,
    montant: formatAmount(recipient.loanAmount),
    taux: recipient.rate === null ? "" : `${recipient.rate} %`,
    echeance:
      recipient.monthlyPayment === null
        ? recipient.durationYears === null
          ? ""
          : `${recipient.durationYears} an(s)`
        : formatAmount(recipient.monthlyPayment),
    duree: "30 minutes",
    motif: "",
    document: "",
    decision: "",
    telephone: "",
    // Le conseiller instruit le dossier : son nom figure dans les messages
    // qui engagent la banque. Sans lui, le message ne peut pas être rendu.
    conseiller: recipient.advisor ?? "",
  };

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;
    variables[key] = typeof value === "string" || typeof value === "number" ? value : JSON.stringify(value);
  }

  if (!variables.document && typeof payload.original_filename === "string") {
    variables.document = payload.original_filename;
  }

  return variables;
}

/** Résout le destinataire d'un dossier. */
async function resolveDossier(dossierId: string): Promise<ResolvedRecipient> {
  const empty: ResolvedRecipient = {
    email: null,
    fullName: null,
    ducCode: null,
    dossierId,
    loanAmount: null,
    rate: null,
    durationYears: null,
    monthlyPayment: null,
    advisor: null,
  };

  try {
    const client = getAdminClient();

    const { data: dossier } = await client
      .from("dossiers")
      .select(
        "id, duc_code, name, email, citizen_id, loan_amount, rate, duration_years, monthly_payment, advisor",
      )
      .eq("id", dossierId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!dossier) return empty;

    let fullName = (dossier.name as string | null) ?? null;
    let email = (dossier.email as string | null) ?? null;

    if (dossier.citizen_id) {
      const { data: profile } = await client
        .from("citizen_profiles")
        .select("full_name, email")
        .eq("id", dossier.citizen_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (profile) {
        fullName = (profile.full_name as string | null) ?? fullName;
        email = (profile.email as string | null) ?? email;
      }
    }

    return {
      email,
      fullName,
      ducCode: (dossier.duc_code as string | null) ?? null,
      dossierId: (dossier.id as string) ?? dossierId,
      loanAmount: dossier.loan_amount === null ? null : Number(dossier.loan_amount),
      rate: dossier.rate === null ? null : Number(dossier.rate),
      durationYears: dossier.duration_years === null ? null : Number(dossier.duration_years),
      monthlyPayment: dossier.monthly_payment === null ? null : Number(dossier.monthly_payment),
      advisor: (dossier.advisor as string | null) ?? null,
    };
  } catch {
    return empty;
  }
}

/**
 * Envoie le message correspondant à un événement métier.
 *
 * Le modèle est résolu par `DOMAIN_EVENT_TEMPLATES` ; un événement sans
 * modèle ne produit aucun envoi.
 */
export async function notifyDomainEvent(event: DomainEvent): Promise<SendEmailResult | null> {
  const templateCode = DOMAIN_EVENT_TEMPLATES[event.eventType];
  if (!templateCode) return null;

  let recipient: ResolvedRecipient;
  if (event.dossierId) {
    recipient = await resolveDossier(event.dossierId);
  } else {
    recipient = {
      email: event.recipientEmail ?? null,
      fullName: null,
      ducCode: null,
      dossierId: null,
      loanAmount: null,
      rate: null,
      durationYears: null,
      monthlyPayment: null,
      advisor: null,
    };
  }

  const to = event.recipientEmail ?? recipient.email;
  if (!to) return null;

  const link = recipient.dossierId
    ? `${getSiteUrl()}/portail-client/dossiers/${recipient.dossierId}`
    : `${getSiteUrl()}/portail-client`;

  const variables = buildVariables({ recipient, payload: event.payload, link });

  // La clé d'idempotence distingue deux faits **de même type** : deux demandes
  // de pièces différentes sur un même dossier sont deux courriels, pas un.
  const subject = factSubject(event.eventType, event.payload);

  const idempotencyKey =
    event.eventType === "PROFILE_CREATED"
      ? `PROFILE_CREATED:${event.citizenId ?? to}`
      : event.dossierId
        ? `${event.eventType}:${recipient.dossierId ?? to}:${subject}`
        : `${event.eventType}:${to}:${new Date().toISOString().slice(0, 10)}`;

  return sendTemplatedEmail({
    templateCode,
    to,
    variables,
    recipientUserId: event.citizenId ?? null,
    idempotencyKey,
  });
}
