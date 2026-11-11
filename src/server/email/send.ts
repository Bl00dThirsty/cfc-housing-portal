/**
 * Chaîne d'envoi — **point unique** de sortie des e-mails du produit.
 *
 * Étapes, dans cet ordre :
 *
 * 1. **Idempotence** : si une clé a déjà été traitée, on rend la main
 *    (aucun doublon, aucun second envoi).
 * 2. **Résolution** du modèle courant dans le catalogue (repli sur le modèle
 *    par défaut).
 * 3. **Rendu** : substitution et échappement HTML ; une variable manquante
 *    produit une livraison `failed`, jamais une exception.
 * 4. **Fournisseur** : absent (aucune configuration) → livraison `skipped`.
 * 5. **Journalisation** dans `public.email_deliveries`, avant et après
 *    l'appel au fournisseur.
 *
 * La chaîne **ne lève jamais** : une panne de messagerie ne doit pas faire
 * échouer l'opération métier qui a déclenché l'envoi.
 */

import "server-only";

import { getAdminClient } from "@/server/supabase/admin";
import { getEmailProvider } from "./provider";
import { renderTemplate } from "./render";
import { getActiveTemplate } from "./templates";
import type { EmailDeliveryStatus, EmailDeliveryRow, EmailVariables } from "./types";

/** Entrée de la chaîne d'envoi. */
export interface SendEmailInput {
  /** Code du modèle (`WELCOME`, `KYC_APPROVED`, …). */
  templateCode: string;
  /** Adresse du destinataire. */
  to: string;
  /** Valeurs des variables du modèle. */
  variables: EmailVariables;
  /** Identité du destinataire (`public.actors.id`), si connue. */
  recipientUserId?: string | null;
  /** Clé d'idempotence : un envoi déjà effectué sous cette clé est ignoré. */
  idempotencyKey?: string | null;
  /** Auteur de la demande (agent connecté), pour la trace d'audit. */
  actorId?: string | null;
}

/** Résultat de la chaîne d'envoi. */
export interface SendEmailResult {
  /** État final de la livraison. */
  status: EmailDeliveryStatus;
  /** Modèle utilisé. */
  templateCode: string;
  /** Identifiant de la ligne journalisée (`null` si l'écriture a échoué). */
  deliveryId: string | null;
  /** Fournisseur contacté (`null` si aucun n'est configuré). */
  provider: string | null;
  /** Objet rendu. */
  subject: string;
  /** Message d'erreur (`null` si tout s'est bien passé). */
  error: string | null;
  /** Variables manquantes ayant empêché l'envoi. */
  missingVariables: string[];
}

/** Ligne à insérer dans le journal des livraisons. */
interface DeliveryDraft {
  template_code: string;
  recipient_email: string;
  recipient_user_id: string | null;
  subject: string | null;
  status: EmailDeliveryStatus;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  payload: Record<string, unknown>;
  idempotency_key: string | null;
  sent_at: string | null;
  created_by: string | null;
}

/**
 * Écrit une ligne dans le journal des livraisons.
 *
 * Ne lève jamais : l'observabilité ne doit pas casser l'envoi.
 */
async function recordDelivery(draft: DeliveryDraft): Promise<string | null> {
  try {
    const client = getAdminClient();
    const { data, error } = await client
      .from("email_deliveries")
      .insert(draft)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("[email] journal des livraisons indisponible :", error?.message);
      return null;
    }
    return (data as { id: string }).id;
  } catch (caught) {
    console.error(
      "[email] journal des livraisons indisponible :",
      caught instanceof Error ? caught.message : caught,
    );
    return null;
  }
}

/** Met à jour l'état d'une livraison journalisée. */
async function updateDelivery(
  id: string,
  patch: {
    status: EmailDeliveryStatus;
    provider?: string | null;
    provider_message_id?: string | null;
    error_message?: string | null;
    sent_at?: string | null;
  },
): Promise<void> {
  try {
    const client = getAdminClient();
    await client
      .from("email_deliveries")
      .update(patch)
      .eq("id", id)
      .is("deleted_at", null);
  } catch {
    // Journalisation best-effort : l'envoi a déjà eu lieu.
  }
}

/** Recherche une livraison déjà produite par cette clé d'idempotence. */
async function findByIdempotencyKey(key: string): Promise<EmailDeliveryRow | null> {
  try {
    const client = getAdminClient();
    const { data, error } = await client
      .from("email_deliveries")
      .select("*")
      .eq("idempotency_key", key)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as EmailDeliveryRow;
  } catch {
    return null;
  }
}

/** Variables sérialisées pour le journal (les valeurs nulles sont conservées). */
function serialiseVariables(variables: EmailVariables): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(variables)) {
    payload[key] = value ?? null;
  }
  return payload;
}

/**
 * Envoie un e-mail selon un modèle du catalogue.
 *
 * Ne lève jamais.
 */
export async function sendTemplatedEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const idempotencyKey = input.idempotencyKey?.trim() || null;

  // 1. Idempotence — un envoi déjà effectué n'est pas rejoué.
  if (idempotencyKey) {
    const existing = await findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return {
        status: existing.status,
        templateCode: existing.template_code,
        deliveryId: existing.id,
        provider: existing.provider,
        subject: existing.subject ?? "",
        error: existing.error_message,
        missingVariables: [],
      };
    }
  }

  // 2. Résolution du modèle.
  const { template } = await getActiveTemplate(input.templateCode, { service: true });
  const payload = serialiseVariables(input.variables);

  // 2 bis. Modèle désactivé : on journalise, on n'envoie pas.
  if (!template.isActive) {
    const subject = renderTemplate(
      {
        subject: template.subject,
        html: template.html,
        text: template.text,
        variables: template.variables,
      },
      input.variables,
    ).subject;

    const deliveryId = await recordDelivery({
      template_code: template.code,
      recipient_email: input.to,
      recipient_user_id: input.recipientUserId ?? null,
      subject,
      status: "skipped",
      provider: null,
      provider_message_id: null,
      error_message: `Modèle ${template.code} désactivé (version ${template.version}).`,
      payload,
      idempotency_key: idempotencyKey,
      sent_at: null,
      created_by: input.actorId ?? null,
    });

    return {
      status: "skipped",
      templateCode: template.code,
      deliveryId,
      provider: null,
      subject,
      error: `Modèle ${template.code} désactivé.`,
      missingVariables: [],
    };
  }

  // 3. Rendu.
  const rendered = renderTemplate(
    {
      subject: template.subject,
      html: template.html,
      text: template.text,
      variables: template.variables,
    },
    input.variables,
  );

  if (rendered.missing.length > 0) {
    const error = `Variables manquantes : ${rendered.missing.join(", ")}`;
    const deliveryId = await recordDelivery({
      template_code: template.code,
      recipient_email: input.to,
      recipient_user_id: input.recipientUserId ?? null,
      subject: rendered.subject,
      status: "failed",
      provider: null,
      provider_message_id: null,
      error_message: error,
      payload,
      idempotency_key: idempotencyKey,
      sent_at: null,
      created_by: input.actorId ?? null,
    });

    return {
      status: "failed",
      templateCode: template.code,
      deliveryId,
      provider: null,
      subject: rendered.subject,
      error,
      missingVariables: rendered.missing,
    };
  }

  // 4. Fournisseur — absent si aucune configuration n'est présente.
  const provider = getEmailProvider();
  if (!provider) {
    const deliveryId = await recordDelivery({
      template_code: template.code,
      recipient_email: input.to,
      recipient_user_id: input.recipientUserId ?? null,
      subject: rendered.subject,
      status: "skipped",
      provider: null,
      provider_message_id: null,
      error_message: "Aucun fournisseur de messagerie configuré.",
      payload,
      idempotency_key: idempotencyKey,
      sent_at: null,
      created_by: input.actorId ?? null,
    });

    return {
      status: "skipped",
      templateCode: template.code,
      deliveryId,
      provider: null,
      subject: rendered.subject,
      error: "Aucun fournisseur de messagerie configuré.",
      missingVariables: [],
    };
  }

  // 5. Journalisation puis envoi.
  const deliveryId = await recordDelivery({
    template_code: template.code,
    recipient_email: input.to,
    recipient_user_id: input.recipientUserId ?? null,
    subject: rendered.subject,
    status: "queued",
    provider: provider.name,
    provider_message_id: null,
    error_message: null,
    payload,
    idempotency_key: idempotencyKey,
    sent_at: null,
    created_by: input.actorId ?? null,
  });

  const result = await provider.send({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (deliveryId) {
    await updateDelivery(deliveryId, {
      status: result.ok ? "sent" : "failed",
      provider: provider.name,
      provider_message_id: result.messageId,
      error_message: result.error,
      sent_at: result.ok ? new Date().toISOString() : null,
    });
  }

  return {
    status: result.ok ? "sent" : "failed",
    templateCode: template.code,
    deliveryId,
    provider: provider.name,
    subject: rendered.subject,
    error: result.error,
    missingVariables: [],
  };
}
