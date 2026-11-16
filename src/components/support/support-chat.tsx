"use client";

/**
 * Fil de support — connecte l'interface de messagerie à la persistance.
 *
 * Ce composant est le **seul** point de contact avec le serveur pour le fil :
 * il charge l'historique, dépose les pièces jointes et enregistre les
 * messages. `RealtimeChat` reste une interface de discussion, sans
 * connaissance du coffre ni des droits.
 *
 * La diffusion temps réel passe par le broadcast Supabase ; elle ne constitue
 * pas la mémoire du fil. Un message envoyé est d'abord écrit, puis diffusé —
 * de sorte qu'un rechargement ne perde jamais la conversation.
 */

import * as React from "react";

import { RealtimeChat } from "@/components/realtime-chat";
import { ErrorState } from "@/components/ui/error-state";
import {
  listSupportMessagesAction,
  requestSupportUploadAction,
  sendSupportMessageAction,
  signSupportAttachmentsAction,
  type SupportMessage,
} from "@/server/actions/support";
import type { ChatAttachment, ChatMessage } from "@/hooks/use-realtime-chat";
import type { ChatAnchor } from "@/components/chat-message";

export interface SupportChatProps {
  /** Identifiant de la conversation — un par dossier. */
  roomName: string;
  dossierId: string | null;
  /** Nom affiché de l'interlocuteur (l'agent, ou l'emprunteur côté agent). */
  displayName: string;
  /** Ancrage de la conversation : étape du circuit ou pièce du dossier. */
  anchor?: ChatAnchor | null;
}

/** Message du serveur → message de l'interface. */
function toChatMessage(message: SupportMessage): ChatMessage {
  return {
    id: message.id,
    content: message.content,
    user: { name: message.author_name },
    createdAt: message.created_at,
    attachment: message.attachment,
    // L'aperçu cité est résolu au rendu, depuis le fil lui-même.
    replyTo: null,
    replyToId: message.reply_to_id,
    stepCode: message.step_code,
    documentId: message.document_id,
  };
}

export function SupportChat({ roomName, dossierId, displayName, anchor = null }: SupportChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  /** Une conversation illisible ne doit pas ressembler à une conversation vide. */
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listSupportMessagesAction({ roomName });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setError(null);
    setMessages(result.data.map(toChatMessage));
    setLoading(false);
  }, [roomName]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /**
   * URL signées des pièces jointes.
   *
   * Le coffre est privé : une URL signée est demandée à la demande, pour
   * chaque pièce affichée. Elle expire, elle n'est jamais stockée.
   */
  const resolveAttachmentUrls = React.useCallback(
    async (paths: string[]): Promise<Record<string, string>> => {
      const result = await signSupportAttachmentsAction({ paths });
      return result.ok ? result.data : {};
    },
    [],
  );

  /** Dépose la pièce jointe : URL signée, puis octets. */
  const handleUpload = React.useCallback(
    async (file: File): Promise<ChatAttachment | null> => {
      if (!dossierId) return null;

      const ticket = await requestSupportUploadAction({
        dossierId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      if (!ticket.ok) {
        console.error("[support] dépôt refusé :", ticket.error);
        return null;
      }

      const response = await fetch(ticket.data.signedUrl, {
        method: "PUT",
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-upsert": "false",
        },
        body: file,
      });

      if (!response.ok) {
        console.error("[support] transfert refusé :", response.status);
        return null;
      }

      return {
        path: ticket.data.path,
        name: ticket.data.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      };
    },
    [dossierId],
  );

  /**
   * Identifiants persistés, en attente de résolution.
   *
   * Un message envoyé porte un identifiant **optimiste** : il n'existe pas
   * encore en base. Répondre à ce message — ou le lire après rechargement —
   * exige son identifiant **stocké**. La promesse permet d'attendre
   * l'écriture au lieu de deviner.
   */
  const persistedIds = React.useRef(new Map<string, Promise<string>>());

  /** Persiste le message, puis rend sa version écrite. */
  const persist = React.useCallback(
    async (message: ChatMessage): Promise<ChatMessage | null> => {
      const replyToId = message.replyToId ?? null;

      // Une réponse peut viser un message qui part à l'instant : on attend
      // son identifiant stocké, sinon la clé étrangère est refusée.
      const storedReplyToId = replyToId
        ? await (persistedIds.current.get(replyToId) ?? Promise.resolve(replyToId))
        : null;

      const pending = sendSupportMessageAction({
        roomName,
        dossierId,
        content: message.content,
        replyToId: storedReplyToId,
        stepCode: message.stepCode ?? null,
        documentId: message.documentId ?? null,
        attachment: message.attachment ?? null,
      });

      persistedIds.current.set(
        message.id,
        pending.then((result) => (result.ok ? result.data.id : message.id)),
      );

      const result = await pending;

      if (!result.ok) {
        console.error("[support] message non enregistré :", result.error);
        return null;
      }

      const persisted = toChatMessage(result.data);
      persistedIds.current.set(message.id, Promise.resolve(persisted.id));

      return persisted;
    },
    [dossierId, roomName],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
        Chargement de la conversation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <ErrorState
          title="Conversation indisponible"
          message={error}
          onRetry={() => void load()}
          className="border-none bg-transparent py-6"
        />
      </div>
    );
  }

  return (
    <RealtimeChat
      roomName={roomName}
      username={displayName}
      messages={messages}
      onSend={persist}
      showConnectionState
      onRequestUpload={handleUpload}
      resolveAttachmentUrls={resolveAttachmentUrls}
      anchor={anchor}
    />
  );
}
