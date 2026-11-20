/**
 * Types partagés par le service d'e-mail CFC.
 *
 * Ce module est **pur** : aucun import React, aucun import Supabase, aucune
 * dépendance à l'environnement. Il peut donc être repris par l'éditeur
 * d'e-mail, par le moteur d'envoi et par les tests unitaires.
 */

/** Destinataires attendus par un modèle. */
export type EmailAudience = "citizen" | "staff" | "both";

/** État d'une livraison dans le journal `public.email_deliveries`. */
export type EmailDeliveryStatus = "queued" | "sent" | "failed" | "skipped";

/** Valeur acceptée pour une variable de modèle. */
export type EmailVariableValue = string | number | null | undefined;

/** Mappe des variables substituées dans un modèle. */
export type EmailVariables = Record<string, EmailVariableValue>;

/** Contenu d'un modèle, indépendamment de son support (base ou défaut). */
export interface EmailTemplateContent {
  /** Code métier du modèle (`WELCOME`, `KYC_APPROVED`, …). */
  code: string;
  /** Numéro de version (1 pour le premier modèle publié). */
  version: number;
  /** Libellé affiché dans l'éditeur. */
  label: string;
  /** Objet du message, avec ses `{{variables}}`. */
  subject: string;
  /** Corps HTML, avec ses `{{variables}}`. */
  html: string;
  /** Corps texte brut, avec ses `{{variables}}`. */
  text: string;
  /** Événement métier déclencheur. */
  eventType: string;
  /** Destinataires attendus. */
  audience: EmailAudience;
  /** Le modèle est-il actif ? */
  isActive: boolean;
  /** Variables déclarées par le modèle. */
  variables: string[];
  /** Début de validité. */
  effectiveFrom: string;
  /** Fin de validité (`null` : version courante). */
  effectiveTo: string | null;
}

/** Ligne du catalogue telle que stockée en base. */
export interface EmailTemplateRow {
  code: string;
  version: number;
  label: string;
  subject_template: string;
  html_template: string;
  text_template: string;
  event_type: string;
  audience: EmailAudience;
  is_active: boolean;
  variables: string[] | null;
  effective_from: string;
  effective_to: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

/** Ligne du journal des livraisons. */
export interface EmailDeliveryRow {
  id: string;
  template_code: string;
  recipient_email: string;
  recipient_user_id: string | null;
  subject: string | null;
  status: EmailDeliveryStatus;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  payload: Record<string, unknown> | null;
  idempotency_key: string | null;
  sent_at: string | null;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

/** Message sortant, indépendant du fournisseur. */
export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}

/** Résultat d'une tentative d'envoi auprès d'un fournisseur. */
export interface ProviderResult {
  ok: boolean;
  /** Identifiant du message chez le fournisseur (`null` en cas d'échec). */
  messageId: string | null;
  /** Message d'erreur exploitable (`null` en cas de succès). */
  error: string | null;
}

/** Entrée de l'aperçu d'un modèle (brouillon ou modèle enregistré). */
export interface EmailPreviewInput {
  /** Code du modèle, lorsque l'aperçu porte sur un modèle existant. */
  code?: string;
  /** Objet en cours d'édition — prioritaire sur le modèle enregistré. */
  subject?: string;
  /** Corps HTML en cours d'édition — prioritaire sur le modèle enregistré. */
  html?: string;
  /** Corps texte en cours d'édition — prioritaire sur le modèle enregistré. */
  text?: string;
  /** Variables injectées dans l'aperçu. */
  variables?: Record<string, unknown>;
}

/** Entrée de publication d'une nouvelle version de modèle. */
export interface EmailTemplateUpsertInput {
  code: string;
  label: string;
  subject: string;
  html: string;
  text: string;
  /** Variables déclarées par le modèle. */
  variables: string[];
  /** Événement déclencheur (par défaut : celui du modèle courant). */
  eventType?: string;
  /** Destinataires attendus (par défaut : ceux du modèle courant). */
  audience?: EmailAudience;
  /** Modèle actif (par défaut : celui du modèle courant). */
  isActive?: boolean;
}

/** Entrée d'un envoi manuel piloté depuis la console. */
export interface EmailSendInput {
  templateCode: string;
  to: string;
  variables?: Record<string, unknown>;
  idempotencyKey?: string | null;
}

/** Résultat d'une action serveur, uniforme pour l'interface. */
export interface EmailActionResult {
  ok: boolean;
  message: string;
}
