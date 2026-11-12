"use server";

/**
 * Fil de support — persistance des messages.
 *
 * La diffusion temps réel passe par le broadcast Supabase ; elle ne constitue
 * pas la mémoire du fil. Chaque message est donc **écrit** ici, et relu au
 * chargement de la conversation.
 *
 * Un message peut porter :
 * - un **texte** ;
 * - une **pièce jointe** (image ou document), déposée dans le coffre privé
 *   `support-attachments` ;
 * - une **réponse** à un message précis (`reply_to_id`) ;
 * - un **ancrage** dans le parcours : une étape du circuit (`step_code`) ou
 *   une pièce du dossier (`document_id`).
 *
 * L'auteur d'un message est celui de la session : un message ne peut pas
 * être posté au nom de quelqu'un d'autre.
 */

import { getServerProfile } from "@/server/auth/profile";
import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { notify } from "@/server/notifications/notify";
import {
  isAllowedAttachmentType,
  MAX_ATTACHMENT_BYTES,
  sanitizeFileName,
  SUPPORT_BUCKET,
} from "@/server/support/attachments";
import { stepByCode } from "@/domain/workflows/tracking";

export type SupportMessage = {
  id: string;
  room_name: string;
  dossier_id: string | null;
  author_user_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  /** Message auquel celui-ci répond. */
  reply_to_id: string | null;
  /** Pièce jointe, si le message en porte une. */
  attachment: SupportAttachment | null;
  /** Étape du circuit visée. */
  step_code: string | null;
  /** Pièce du dossier visée. */
  document_id: string | null;
};

export type SupportAttachment = {
  path: string;
  name: string;
  mime: string;
  size: number;
};

export type SupportResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Lecture du fil, avec les pièces jointes et les ancrages. */
export async function listSupportMessagesAction(input: {
  roomName: string;
  limit?: number;
}): Promise<SupportResult<SupportMessage[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Session requise." };

    const { data, error } = await supabase
      .from("support_messages")
      .select(
        "id, room_name, dossier_id, author_user_id, author_name, author_role, content, created_at, reply_to_id, attachment_path, attachment_name, attachment_mime, attachment_size, step_code, document_id",
      )
      .eq("room_name", input.roomName)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(input.limit ?? 200);

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: (data ?? []).map(toSupportMessage) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

/** Convertit une ligne de la table en message de fil. */
function toSupportMessage(row: Record<string, unknown>): SupportMessage {
  const attachmentPath = (row.attachment_path as string | null) ?? null;

  return {
    id: row.id as string,
    room_name: row.room_name as string,
    dossier_id: (row.dossier_id as string | null) ?? null,
    author_user_id: row.author_user_id as string,
    author_name: row.author_name as string,
    author_role: row.author_role as string,
    content: (row.content as string) ?? "",
    created_at: row.created_at as string,
    reply_to_id: (row.reply_to_id as string | null) ?? null,
    attachment: attachmentPath
      ? {
          path: attachmentPath,
          name: (row.attachment_name as string | null) ?? "Pièce jointe",
          mime: (row.attachment_mime as string | null) ?? "application/octet-stream",
          size: Number((row.attachment_size as number | null) ?? 0),
        }
      : null,
    step_code: (row.step_code as string | null) ?? null,
    document_id: (row.document_id as string | null) ?? null,
  };
}

/**
 * Demande une URL signée de dépôt pour une pièce jointe.
 *
 * Le contrôle est fait ici, côté serveur : l'appelant ne peut déposer que
 * dans le dossier dont il a la charge, et qu'un type de fichier admis.
 */
export async function requestSupportUploadAction(input: {
  dossierId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<
  SupportResult<{ path: string; signedUrl: string; token: string; name: string }>
> {
  try {
    const profile = await getServerProfile();
    if (!profile) return { ok: false, error: "Session requise." };

    if (input.sizeBytes <= 0) {
      return { ok: false, error: "Le fichier est vide." };
    }
    if (input.sizeBytes > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: "La pièce jointe dépasse 10 Mo." };
    }
    if (!isAllowedAttachmentType(input.mimeType, input.filename)) {
      return { ok: false, error: "Ce type de fichier n'est pas admis dans le fil." };
    }

    const supabase = await createServerSupabaseClient();
    const { data: dossier, error } = await supabase
      .from("dossiers")
      .select("id, citizen_id, owner_user_id")
      .eq("id", input.dossierId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!dossier) return { ok: false, error: "Dossier introuvable." };

    const isParty =
      dossier.citizen_id === profile.actorId || dossier.owner_user_id === profile.actorId;
    if (!isParty && profile.role === "CITIZEN") {
      return { ok: false, error: "Ce dossier ne vous est pas ouvert." };
    }
    if (!isParty && profile.role !== "CITIZEN") {
      // Un agent dépose dans le dossier qu'il suit ; le périmètre est
      // contrôlé par les politiques de lecture du dossier.
      const { data: readable } = await supabase
        .from("dossiers")
        .select("id")
        .eq("id", input.dossierId)
        .maybeSingle();
      if (!readable) return { ok: false, error: "Ce dossier n'est pas dans votre périmètre." };
    }

    const name = sanitizeFileName(input.filename) || "piece-jointe";
    const path = `${input.dossierId}/${crypto.randomUUID()}-${name}`;

    const { data: signed, error: signError } = await supabase.storage
      .from(SUPPORT_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (signError || !signed) {
      return {
        ok: false,
        error: `URL de dépôt non délivrée : ${signError?.message ?? "cause inconnue"}`,
      };
    }

    return {
      ok: true,
      data: { path, signedUrl: signed.signedUrl, token: signed.token, name },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

/**
 * URL signée de consultation d'une pièce jointe.
 *
 * Le coffre est privé : seule une URL signée, à durée courte, donne accès à
 * la pièce. Elle n'est jamais stockée dans la base.
 */
export async function signSupportAttachmentsAction(input: {
  paths: string[];
}): Promise<SupportResult<Record<string, string>>> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Session requise." };

    const urls: Record<string, string> = {};

    for (const path of input.paths.slice(0, 50)) {
      const { data, error } = await supabase.storage
        .from(SUPPORT_BUCKET)
        .createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) urls[path] = data.signedUrl;
    }

    return { ok: true, data: urls };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

/** Entrée d'écriture d'un message. */
export interface SendSupportMessageInput {
  roomName: string;
  dossierId: string | null;
  content: string;
  replyToId?: string | null;
  stepCode?: string | null;
  documentId?: string | null;
  attachment?: SupportAttachment | null;
}

/**
 * Enregistre un message et **notifie l'interlocuteur**.
 *
 * L'interlocuteur est l'autre partie du dossier : l'agent qui le suit, ou
 * l'emprunteur si c'est un agent qui écrit.
 */
export async function sendSupportMessageAction(
  input: SendSupportMessageInput,
): Promise<SupportResult<SupportMessage>> {
  try {
    const content = input.content.trim();
    const attachment = input.attachment ?? null;

    if (!content && !attachment) {
      return { ok: false, error: "Le message est vide." };
    }
    if (content.length > 4000) {
      return { ok: false, error: "Le message dépasse 4 000 caractères." };
    }

    // Un ancrage doit désigner une étape réelle du circuit.
    if (input.stepCode && !stepByCode(input.stepCode)) {
      return { ok: false, error: "Étape de parcours inconnue." };
    }

    const profile = await getServerProfile();
    if (!profile) return { ok: false, error: "Session requise." };

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        room_name: input.roomName,
        dossier_id: input.dossierId,
        author_user_id: profile.actorId,
        author_name: profile.fullName ?? profile.email,
        author_role: profile.role,
        content,
        reply_to_id: input.replyToId ?? null,
        attachment_path: attachment?.path ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_mime: attachment?.mime ?? null,
        attachment_size: attachment?.size ?? null,
        step_code: input.stepCode ?? null,
        document_id: input.documentId ?? null,
      })
      .select(
        "id, room_name, dossier_id, author_user_id, author_name, author_role, content, created_at, reply_to_id, attachment_path, attachment_name, attachment_mime, attachment_size, step_code, document_id",
      )
      .single();

    if (error) return { ok: false, error: error.message };

    const message = toSupportMessage(data as Record<string, unknown>);

    await notifyCounterpart({
      message,
      dossierId: input.dossierId,
      authorUserId: profile.actorId,
      authorRole: profile.role,
    });

    return { ok: true, data: message };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

/** Détermine et notifie l'interlocuteur du fil. */
async function notifyCounterpart(input: {
  message: SupportMessage;
  dossierId: string | null;
  authorUserId: string;
  authorRole: string;
}): Promise<void> {
  if (!input.dossierId) return;

  try {
    const admin = getAdminClient();

    const { data: dossier } = await admin
      .from("dossiers")
      .select("id, duc_code, citizen_id, owner_user_id")
      .eq("id", input.dossierId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!dossier) return;

    const isCitizen = input.authorRole === "CITIZEN";
    const recipientId = isCitizen ? dossier.owner_user_id : dossier.citizen_id;
    if (!recipientId || recipientId === input.authorUserId) return;

    await notify({
      recipientUserId: recipientId,
      type: "support.message",
      title: isCitizen
        ? "Nouveau message de votre conseiller"
        : "Nouveau message d'un emprunteur",
      body: input.message.content.slice(0, 280) || "Pièce jointe",
      dossierId: input.dossierId,
      actionUrl: isCitizen ? "/portail-client" : "/portail-cfc/clients",
    });
  } catch (error) {
    console.error("[support] notification de l'interlocuteur impossible :", error);
  }
}
