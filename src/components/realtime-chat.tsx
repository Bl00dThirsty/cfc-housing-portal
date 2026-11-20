"use client";

/**
 * Fil de discussion en temps réel (broadcast Supabase).
 *
 * Les messages sont **persistés** par l'appelant (`onSend`) : le broadcast ne
 * porte que la diffusion temps réel, il ne constitue pas la mémoire du fil.
 *
 * Le composeur offre ce qu'attend une conversation de dossier : **texte**,
 * **émojis**, **pièce jointe** (image ou document) et **réponse** à un
 * message précis.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CornerUpLeft, Loader2, Paperclip, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ChatMessageItem, type ChatAnchor } from "@/components/chat-message";
import { EmojiPicker } from "@/components/support/emoji-picker";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import {
  useRealtimeChat,
  type ChatAttachment,
  type ChatMessage,
} from "@/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";

/**
 * Ancrage affiché sur une bulle.
 *
 * Le message porte son ancrage — une étape du circuit ou une pièce du
 * dossier. Le libellé précis n'est connu que pour l'ancrage courant : au-delà,
 * on affiche le code de l'étape.
 */
function anchorOf(message: ChatMessage, current: ChatAnchor | null): ChatAnchor | null {
  if (message.stepCode) {
    return {
      kind: "etape",
      id: message.stepCode,
      label:
        current?.kind === "etape" && current.id === message.stepCode
          ? current.label
          : message.stepCode,
    };
  }

  if (message.documentId) {
    return {
      kind: "piece",
      id: message.documentId,
      label:
        current?.kind === "piece" && current.id === message.documentId
          ? current.label
          : "Pièce du dossier",
    };
  }

  return null;
}

/**
 * Rattache à chaque message l'aperçu de la réponse qu'il cite.
 *
 * L'aperçu n'est **jamais stocké** deux fois : il est résolu depuis le fil,
 * au moment du rendu. Un message reçu par diffusion comme un message relu
 * depuis la base sont donc traités de la même façon.
 */
export function withResolvedReplies(messages: ChatMessage[]): ChatMessage[] {
  const byId = new Map(messages.map((message) => [message.id, message]));

  return messages.map((message) => {
    if (message.replyTo) return message;
    if (!message.replyToId) return message;

    const quoted = byId.get(message.replyToId);
    if (!quoted) return message;

    return {
      ...message,
      replyTo: {
        id: quoted.id,
        authorName: quoted.user.name,
        content: quoted.content,
      },
    };
  });
}

interface RealtimeChatProps {  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
  /**
   * Persiste un message (fil de support) et rend sa version écrite.
   *
   * L'identifiant diffusé est celui de la base : une réponse à ce message
   * peut donc le viser, des deux côtés du fil.
   */
  onSend?: (message: ChatMessage) => Promise<ChatMessage | null> | ChatMessage | null;
  /** Affiche la pastille « en ligne ». */
  showConnectionState?: boolean;
  /**
   * Dépose une pièce jointe et rend sa description.
   *
   * Le parent possède le coffre et les droits : ce composant ne connaît que
   * l'interface.
   */
  onRequestUpload?: (file: File) => Promise<ChatAttachment | null>;
  /** URL signées des pièces jointes, par chemin. */
  attachmentUrls?: Record<string, string>;
  /**
   * Demande les URL signées des pièces jointes qui n'en ont pas encore.
   *
   * Le coffre est privé : une URL signée est demandée à la demande. Le
   * propriétaire du coffre reste hors du composant — c'est lui qui décide
   * ce qu'un acteur a le droit de voir.
   */
  resolveAttachmentUrls?: (paths: string[]) => Promise<Record<string, string>>;
  /**
   * Ancrage de la conversation : l'étape du circuit ou la pièce du dossier
   * dont on parle. Chaque message écrit est rattaché à cet ancrage.
   */
  anchor?: ChatAnchor | null;
}

export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
  onSend,
  showConnectionState = false,
  onRequestUpload,
  attachmentUrls = {},
  resolveAttachmentUrls,
  anchor = null,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { messages: realtimeMessages, sendMessage, isConnected } = useRealtimeChat({
    roomName,
    username,
    onSend,
  });

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  /** Refus affiché au-dessus du composeur : une action échouée ne se tait pas. */
  const [error, setError] = useState<string | null>(null);

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id),
    );
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return withResolvedReplies(sortedMessages);
  }, [initialMessages, realtimeMessages]);

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages);
    }
  }, [allMessages, onMessage]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  /**
   * URL signées des pièces jointes.
   *
   * Les URL connues arrivent avec les messages ; celles qui manquent — un
   * message reçu par diffusion, par exemple — sont demandées à la demande.
   */
  const urls = useMemo(
    () => ({ ...attachmentUrls, ...signedUrls }),
    [attachmentUrls, signedUrls],
  );

  const missingUrls = useMemo(() => {
    const paths = allMessages
      .map((message) => message.attachment?.path)
      .filter((path): path is string => Boolean(path));

    return [...new Set(paths)].filter((path) => !urls[path]);
  }, [allMessages, urls]);

  useEffect(() => {
    if (missingUrls.length === 0 || !resolveAttachmentUrls) return;

    let cancelled = false;

    void resolveAttachmentUrls(missingUrls).then((resolved) => {
      if (cancelled) return;
      setSignedUrls((current) => ({ ...current, ...resolved }));
    });

    return () => {
      cancelled = true;
    };
  }, [missingUrls, resolveAttachmentUrls]);

  /** Insère un emoji à la position du curseur. */
  const insertEmoji = useCallback(
    (emoji: string) => {
      const element = inputRef.current;
      const start = element?.selectionStart ?? draft.length;
      const end = element?.selectionEnd ?? draft.length;

      const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
      setDraft(next);

      requestAnimationFrame(() => {
        element?.focus();
        const caret = start + emoji.length;
        element?.setSelectionRange(caret, caret);
      });
    },
    [draft],
  );

  /** Dépose la pièce jointe : URL signée, puis octets. */
  const handleFile = useCallback(
    async (file: File) => {
      if (!onRequestUpload) return;
      setUploading(true);
      try {
        const uploaded = await onRequestUpload(file);
        if (uploaded) {
          setAttachment(uploaded);
          setError(null);
        } else {
          setError(
            "La pièce jointe n'a pas pu être déposée. Vérifiez votre connexion et réessayez.",
          );
        }
      } finally {
        setUploading(false);
      }
    },
    [onRequestUpload],
  );

  const handleSendMessage = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const content = draft.trim();
      if ((!content && !attachment) || !isConnected) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: { name: username },
        createdAt: new Date().toISOString(),
        attachment: attachment ?? null,
        replyToId: replyTo?.id ?? null,
        replyTo: replyTo
          ? {
              id: replyTo.id,
              authorName: replyTo.user.name,
              content: replyTo.content,
            }
          : null,
        stepCode: anchor?.kind === "etape" ? anchor.id : null,
        documentId: anchor?.kind === "piece" ? anchor.id : null,
      };

      const sent = await sendMessage(message);

      if (!sent) {
        // Le message n'est pas parti : on le rend au composeur, texte et
        // pièce comprise, plutôt que de le laisser disparaître.
        setDraft(content);
        setAttachment(attachment);
        setError(
          "Votre message n'a pas pu être enregistré. Vérifiez votre connexion et réessayez.",
        );
        return;
      }

      setDraft("");
      setAttachment(null);
      setReplyTo(null);
      setError(null);
    },
    [anchor, attachment, draft, isConnected, replyTo, sendMessage, username],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage(event);
    }
  };

  const canSend = (draft.trim().length > 0 || attachment !== null) && isConnected && !uploading;

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 space-y-1 overflow-y-auto p-4">
        {allMessages.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aucun message pour l&apos;instant. Ouvrez la conversation.
          </div>
        ) : null}

        {allMessages.map((message, index) => {
          const prevMessage = index > 0 ? allMessages[index - 1] : null;
          const showHeader = !prevMessage || prevMessage.user.name !== message.user.name;

          return (
            <div
              key={message.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <ChatMessageItem
                message={message}
                isOwnMessage={message.user.name === username}
                showHeader={showHeader}
                attachmentUrls={urls}
                onReply={setReplyTo}
                anchor={anchorOf(message, anchor)}
              />
            </div>
          );
        })}
      </div>

      {/* Refus : une action qui n'a pas abouti se dit. */}
      {error ? (
        <div
          role="alert"
          className="mx-3 mb-1 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
          <p className="flex-1 text-[11px] leading-relaxed text-danger">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Masquer le message d'erreur"
            className="shrink-0 rounded p-0.5 text-danger/70 transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {/* Réponse en cours */}
      {replyTo ? (
        <div className="mx-3 mb-1 flex items-start gap-2 rounded-lg border-l-2 border-cfc-gold bg-muted/50 px-3 py-2">
          <CornerUpLeft className="mt-0.5 size-3.5 shrink-0 text-cfc-brown" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold text-foreground">
              Réponse à {replyTo.user.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {replyTo.content || "Pièce jointe"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            aria-label="Annuler la réponse"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {/* Pièce jointe en attente */}
      {attachment ? (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
            {attachment.name}
          </span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Retirer la pièce jointe"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSendMessage}
        className="flex w-full items-end gap-1.5 border-t border-border p-3"
      >
        <input
          ref={fileRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />

        {onRequestUpload ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isConnected || uploading}
            onClick={() => fileRef.current?.click()}
            aria-label="Joindre un fichier"
            className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Paperclip className="size-4" aria-hidden />
            )}
          </Button>
        ) : null}

        <EmojiPicker onSelect={insertEmoji} disabled={!isConnected} />

        <textarea
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Écrivez votre message…"
          aria-label="Votre message"
          disabled={!isConnected}
          className={cn(
            "max-h-32 min-h-9 flex-1 resize-none rounded-2xl border border-line-strong bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-[border-color] duration-150 ease-power3-out placeholder:text-subtle focus:border-ring focus:ring-1 focus:ring-ring/40",
          )}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label="Envoyer le message"
          className="size-8 shrink-0 rounded-full bg-cfc-brown text-white transition-colors hover:bg-cfc-darkbrown disabled:opacity-40"
        >
          <Send className="size-3.5" aria-hidden />
        </Button>
      </form>

      {showConnectionState ? (
        <p className="px-4 pb-2 caption-style text-subtle">
          {isConnected ? "Connexion au fil établie." : "Connexion au fil en cours…"}
        </p>
      ) : null}
    </div>
  );
};
