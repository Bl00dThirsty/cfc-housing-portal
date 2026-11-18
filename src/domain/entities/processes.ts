/**
 * Stable workflow codes used by the application state machine.
 * Process labels, ordering, and current catalogue entries live in Supabase.
 */
export type CreditPhase =
  | "kyc_savings"
  | "risk_bet"
  | "committees"
  | "notary_mortgage"
  | "disbursements"
  | "closing_release";

/** A process step read from the Supabase reference catalogue. */
export type ProcessStep = {
  code: string;
  label: string;
  process: string;
  phase: CreditPhase | null;
  lane: "client" | "agence" | "siege" | "partenaires" | "support";
  external: boolean;
};
export type DossierEvent = {
  id: string;
  event_type: string;
  actor_role: string | null;
  payload: Record<string, unknown>;
  legal_basis: string | null;
  occurred_at: string;
};

/**
 * Libellés lisibles des événements du journal.
 *
 * C'est le **vocabulaire unique** des faits métier : la chronologie de
 * l'emprunteur et le titre de la notification reprennent le même libellé, pour
 * qu'un événement ne s'appelle pas autrement selon l'écran où il apparaît.
 *
 * L'orthographe est celle du catalogue des notifications : `MAJUSCULES_SANS
 * TIRET`. Les faits qui ne sont pas des décisions — une étape de traitement,
 * un message de support — gardent leur nom d'origine : ils ne sont pas
 * notifiés, et le journal est leur seule trace.
 */
export const DOSSIER_EVENT_LABELS: Record<string, string> = {
  KYC_SUBMITTED: "Dossier KYC transmis",
  KYC_APPROVED: "Décision KYC approuvée",
  KYC_REJECTED: "Décision KYC refusée",
  APPLICATION_SUBMITTED: "Dossier transmis au conseiller",
  APPLICATION_SUSPENDED: "Dossier en attente d'orientation",
  DOCUMENTS_READY: "Dépôt des pièces ouvert",
  DUC_ACTIVATED: "Dossier activé",
  DUC_REFUSED: "Éligibilité refusée",
  DOCUMENT_REQUESTED: "Pièce justificative demandée",
  DOCUMENT_UPLOADED: "Pièce déposée au dossier",
  DOCUMENT_VALIDATED: "Pièce validée",
  DOCUMENT_REJECTED: "Pièce rejetée",
  COMMITTEE_DECISION: "Décision du comité de crédit",
  LOAN_OFFER_ISSUED: "Offre de prêt émise",
  DISBURSEMENT_RELEASED: "Déblocage effectué",
  PAYOFF_STATEMENT: "Décompte d'apurement émis",
  MAINLEVEE_READY: "Mainlevée prête",
  DOSSIER_UPDATED: "Dossier mis à jour",
  DOSSIER_ASSIGNED: "Dossier attribué",
  "kyc.state_changed": "Étape du dossier KYC",
  "support.message": "Message échangé",
};

/** Libellé lisible d'un événement du journal. */
export function eventLabel(eventType: string): string {
  return DOSSIER_EVENT_LABELS[eventType] ?? eventType.replace(/[._]/g, " ");
}

/**
 * Le champ qui distingue deux faits de même type sur un même dossier.
 *
 * Deux demandes de pièces différentes ne sont pas le même fait ; deux
 * activations du DUC, si. Sans cette distinction, la clé de fait fusionnerait
 * deux décisions distinctes en une seule notification.
 */
const FACT_DISCRIMINATOR: Record<string, string> = {
  DOCUMENT_REQUESTED: "doc_type_code",
  DOCUMENT_UPLOADED: "document_id",
  DOCUMENT_VALIDATED: "document_id",
  DOCUMENT_REJECTED: "document_id",
  APPLICATION_SUSPENDED: "prior_client_case",
  DOCUMENTS_READY: "prior_client_case",
  DOSSIER_UPDATED: "event_id",
  SUPPORT_MESSAGE: "message_id",
};

/**
 * L'identité d'un fait métier, enderessé à un destinataire.
 *
 * Un même fait peut être signalé **deux fois** : par l'action serveur, qui
 * connaît le destinataire, et par le relais de la base, qui constate le fait
 * sans le connaître. La clé de fait est ce qui réconcilie les deux chemins :
 * elle est **dérivée** du fait — son type, son dossier, ce qui le distingue
 * des autres faits du même type, son destinataire — et jamais d'un compteur ni
 * d'un horodatage.
 */
export function factKey(input: {
  eventType: string;
  dossierId: string | null;
  recipientUserId: string;
  payload?: Record<string, unknown> | null;
}): string {
  return [
    input.eventType,
    input.dossierId ?? "-",
    factSubject(input.eventType, input.payload),
    input.recipientUserId,
  ].join(":");
}

/**
 * Ce qui distingue un fait d'un autre fait de même type.
 *
 * Deux activations du DUC d'un même dossier ne se distinguent pas — il n'y en a
 * qu'une ; deux demandes de pièces, si.
 */
export function factSubject(
  eventType: string,
  payload?: Record<string, unknown> | null,
): string {
  const discriminator = FACT_DISCRIMINATOR[eventType];
  if (!discriminator) return "";
  return String((payload ?? {})[discriminator] ?? "");
}

/**
 * Les rôles du journal, en langage lisible.
 *
 * Pour l'emprunteur, « qui » est un **rôle** : un nom de personne n'a pas
 * à quitter la banque. C'est un usage interne du dossier ; la console, elle,
 * peut afficher l'agent.
 */
export const ACTOR_ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Emprunteur",
  GUICHET: "Agence",
  GESTIONNAIRE: "Gestionnaire",
  RISQUES_BET: "Risques & BET",
  NOTAIRE: "Notaire",
  COMITE: "Comité de crédit",
  DIASPORA: "Guichet diaspora",
  ADMIN: "Administration",
  SERVICE: "Service interne",
  SYSTEM: "Plateforme",
};

/** Le libellé lisible d'un rôle ; « Acteur » quand le rôle est inconnu ou absent. */
export function actorRoleLabel(role: string | null): string {
  if (!role) return "Acteur";
  return ACTOR_ROLE_LABELS[role] ?? "Acteur";
}
