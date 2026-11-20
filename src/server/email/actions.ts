/**
 * Actions serveur du service d'e-mail.
 *
 * Toutes les actions sont **gardées par une capacité** : le contrôle
 * d'accès est fait ici, côté serveur, jamais dans l'interface. L'interface ne
 * fait que refléter la décision.
 *
 * Règle de versionnement : `upsertEmailTemplateAction` et
 * `toggleEmailTemplateAction` ne modifient **jamais** un modèle expédié. Ils
 * ferment la version courante et ouvrent une version nouvelle, par
 * l'intermédiaire de la fonction `public.publish_email_template` (migration
 * 016), qui est atomique.
 */

"use server";

import { hasCapability } from "@/domain/policies/permissions";
import type { Capability } from "@/domain/policies/capabilities";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { EMAIL_TEMPLATE_CODES } from "./defaults";
import { renderTemplate, toVariables } from "./render";
import { sendTemplatedEmail, type SendEmailResult } from "./send";
import {
  getActiveTemplate,
  getTemplateHistory,
  listCatalogue,
  type CatalogueEntry,
} from "./templates";
import { computeNextVersion } from "./versioning";
import type {
  EmailActionResult,
  EmailDeliveryRow,
  EmailPreviewInput,
  EmailSendInput,
  EmailTemplateContent,
  EmailTemplateUpsertInput,
} from "./types";

/** Vérifie la session et la capacité exigée. */
async function requireCapability(capability: Capability) {
  const profile = await getServerProfile().catch(() => null);

  if (!profile) {
    throw new Error("Session requise : reconnectez-vous pour continuer.");
  }

  if (!hasCapability(profile.role, capability, profile.capabilities)) {
    throw new Error(`Habilitation insuffisante : « ${capability} » est requis.`);
  }

  return profile;
}

/** Catalogue courant : une ligne par code. */
export async function listEmailTemplatesAction(): Promise<CatalogueEntry[]> {
  await requireCapability("email:read");
  return listCatalogue();
}

/** Modèle courant + historique des versions d'un code. */
export async function getEmailTemplateAction(code: string): Promise<{
  template: EmailTemplateContent;
  history: EmailTemplateContent[];
  isFallback: boolean;
}> {
  await requireCapability("email:read");

  const resolved = await getActiveTemplate(code);
  const history = await getTemplateHistory(code);

  return { template: resolved.template, history, isFallback: resolved.isFallback };
}

/**
 * Aperçu rendu **par le moteur réel** (`renderTemplate`).
 *
 * Si un objet, un corps HTML ou un corps texte sont fournis, l'aperçu porte
 * sur ce brouillon ; sinon sur le modèle enregistré du code indiqué.
 */
export async function previewEmailTemplateAction(
  input: EmailPreviewInput,
): Promise<{
  subject: string;
  html: string;
  text: string;
  missing: string[];
  undeclared: string[];
}> {
  await requireCapability("email:read");

  const variables = toVariables(input.variables);

  if (input.subject !== undefined || input.html !== undefined || input.text !== undefined) {
    const rendered = renderTemplate(
      {
        subject: input.subject ?? "",
        html: input.html ?? "",
        text: input.text ?? "",
        variables: [],
      },
      variables,
    );
    return rendered;
  }

  if (!input.code) {
    throw new Error("Aucun modèle à prévisualiser.");
  }

  const { template } = await getActiveTemplate(input.code);
  const rendered = renderTemplate(
    {
      subject: template.subject,
      html: template.html,
      text: template.text,
      variables: template.variables,
    },
    variables,
  );

  return rendered;
}

/**
 * Publie une **nouvelle version** du modèle.
 *
 * La version courante est fermée (`effective_to`) et la nouvelle est insérée.
 * Aucun modèle expédié n'est réécrit.
 */
export async function upsertEmailTemplateAction(
  input: EmailTemplateUpsertInput,
): Promise<EmailActionResult & { version: number | null }> {
  await requireCapability("email:manage");

  const code = input.code.trim().toUpperCase();
  if (!code) {
    return { ok: false, message: "Le code du modèle est obligatoire.", version: null };
  }

  if (!EMAIL_TEMPLATE_CODES.includes(code)) {
    return {
      ok: false,
      message: `Code de modèle inconnu : « ${code} ».`,
      version: null,
    };
  }

  if (!input.subject.trim()) {
    return { ok: false, message: "L'objet du message est obligatoire.", version: null };
  }

  const history = await getTemplateHistory(code);
  const expectedVersion = computeNextVersion(history.map((item) => ({ version: item.version })));

  const current = history[0] ?? null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("publish_email_template", {
    p_code: code,
    p_label: input.label.trim() || current?.label || code,
    p_subject_template: input.subject,
    p_html_template: input.html,
    p_text_template: input.text,
    p_event_type: input.eventType?.trim() || current?.eventType || code,
    p_audience: input.audience ?? current?.audience ?? "citizen",
    p_is_active: input.isActive ?? current?.isActive ?? true,
    p_variables: input.variables ?? [],
    p_version: expectedVersion,
  });

  if (error) {
    return {
      ok: false,
      message: `Publication refusée : ${error.message}`,
      version: null,
    };
  }

  const published = data as { version?: number } | null;

  return {
    ok: true,
    message: `Version ${published?.version ?? expectedVersion} publiée. La version précédente est close.`,
    version: published?.version ?? expectedVersion,
  };
}

/**
 * Active ou désactive un modèle.
 *
 * Le basculement passe par une **nouvelle version** : l'historique conserve
 * la trace du moment où le modèle a été désactivé.
 */
export async function toggleEmailTemplateAction(
  code: string,
  isActive: boolean,
): Promise<EmailActionResult & { version: number | null }> {
  await requireCapability("email:manage");

  const normalised = code.trim().toUpperCase();
  const history = await getTemplateHistory(normalised);

  if (history.length === 0) {
    return {
      ok: false,
      message: `Modèle « ${normalised} » introuvable dans le catalogue.`,
      version: null,
    };
  }

  const current = history[0];
  const expectedVersion = computeNextVersion(history.map((item) => ({ version: item.version })));

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("publish_email_template", {
    p_code: normalised,
    p_label: current.label,
    p_subject_template: current.subject,
    p_html_template: current.html,
    p_text_template: current.text,
    p_event_type: current.eventType,
    p_audience: current.audience,
    p_is_active: isActive,
    p_variables: current.variables,
    p_version: expectedVersion,
  });

  if (error) {
    return { ok: false, message: `Bascule refusée : ${error.message}`, version: null };
  }

  const published = data as { version?: number } | null;

  return {
    ok: true,
    message: isActive
      ? `Modèle ${normalised} activé (version ${published?.version ?? expectedVersion}).`
      : `Modèle ${normalised} désactivé (version ${published?.version ?? expectedVersion}).`,
    version: published?.version ?? expectedVersion,
  };
}

/** Journal des livraisons, filtrable. */
export async function listEmailDeliveriesAction(
  filter: { status?: string | null; templateCode?: string | null; limit?: number } = {},
): Promise<EmailDeliveryRow[]> {
  await requireCapability("email:read");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("email_deliveries")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(Math.min(filter.limit ?? 100, 500));

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.templateCode) query = query.eq("template_code", filter.templateCode);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as EmailDeliveryRow[];
}

/**
 * Envoie un message via un modèle du catalogue.
 *
 * Sert aux envois pilotés depuis la console (test de modèle) et aux
 * branches métier qui ne passent pas par un événement.
 */
export async function sendEmailAction(input: EmailSendInput): Promise<SendEmailResult> {
  const profile = await requireCapability("email:send");

  const to = input.to.trim();
  if (!to) {
    return {
      status: "failed",
      templateCode: input.templateCode,
      deliveryId: null,
      provider: null,
      subject: "",
      error: "Adresse du destinataire obligatoire.",
      missingVariables: [],
    };
  }

  return sendTemplatedEmail({
    templateCode: input.templateCode.trim().toUpperCase(),
    to,
    variables: toVariables(input.variables),
    idempotencyKey: input.idempotencyKey ?? null,
    actorId: profile.actorId,
  });
}

/** Rejoue un envoi échoué, à partir des variables journalisées. */
export async function resendEmailDeliveryAction(
  deliveryId: string,
): Promise<SendEmailResult & { ok: boolean; message: string }> {
  const profile = await requireCapability("email:send");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("*")
    .eq("id", deliveryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      message: "Livraison introuvable.",
      status: "failed",
      templateCode: "",
      deliveryId: null,
      provider: null,
      subject: "",
      error: "Livraison introuvable.",
      missingVariables: [],
    };
  }

  const delivery = data as EmailDeliveryRow;
  const payload = (delivery.payload ?? {}) as Record<string, unknown>;

  if (["MAGIC_LINK", "RESET_PASSWORD", "STAFF_INVITATION"].includes(delivery.template_code)) {
    return {
      ok: false,
      message: "Un lien d’authentification expirant ne peut pas être rejoué depuis le journal. Produisez un nouveau lien depuis la gestion des comptes.",
      status: "failed",
      templateCode: delivery.template_code,
      deliveryId: delivery.id,
      provider: delivery.provider,
      subject: delivery.subject ?? "",
      error: "auth_link_must_be_regenerated",
      missingVariables: [],
    };
  }

  const result = await sendTemplatedEmail({
    templateCode: delivery.template_code,
    to: delivery.recipient_email,
    variables: toVariables(payload),
    recipientUserId: delivery.recipient_user_id,
    idempotencyKey: null,
    actorId: profile.actorId,
  });

  return {
    ...result,
    ok: result.status === "sent",
    message:
      result.status === "sent"
        ? "Message réexpédié."
        : `Réexpédition impossible (${result.status}) : ${result.error ?? "cause inconnue."}`,
  };
}
