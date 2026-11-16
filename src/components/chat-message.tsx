"use client";

/**
 * Bulle de message — rendu de messagerie instantanée.
 *
 * La bulle porte le **message**, sa **réponse citée**, sa **pièce jointe**
 * et son **ancrage** dans le parcours (étape du circuit ou pièce du
 * dossier). L'aperçu de la réponse est repris du fil lui-même : il n'est
 * jamais stocké deux fois.
 */

import * as React from "react";
import { CornerUpLeft, FileText, Download, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-realtime-chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  /** L'auteur change : on réaffiche l'identité et l'horodatage. */
  showHeader: boolean;
  /** URL signées des pièces jointes, par chemin. */
  attachmentUrls?: Record<string, string>;
  /** Prépare la réponse à ce message. */
  onReply?: (message: ChatMessage) => void;
  /** Ancrage du message : une étape du circuit ou une pièce du dossier. */
  anchor?: ChatAnchor | null;
}

/** Ce sur quoi porte un message : une étape du parcours ou une pièce du dossier. */
export interface ChatAnchor {
  kind: "etape" | "piece";
  /** Code de l'étape (`CRD-07`) ou identifiant de la pièce. */
  id: string;
  /** Libellé lisible. */
  label: string;
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
  attachmentUrls = {},
  onReply,
  anchor,
}: ChatMessageItemProps) => {
  const attachment = message.attachment ?? null;
  const attachmentUrl = attachment ? attachmentUrls[attachment.path] : undefined;
  const isImage = attachment?.mime.startsWith("image/") ?? false;

  return (
    <div
      className={cn("group flex items-end gap-1", isOwnMessage ? "justify-end" : "justify-start")}
    >
      {!isOwnMessage ? (
        <div className="w-0 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onReply?.(message)}
            aria-label={`Répondre à ${message.user.name}`}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CornerUpLeft className="size-3.5" />
          </button>
        </div>
      ) : null}

      <div className={cn("flex max-w-[78%] flex-col gap-1", isOwnMessage ? "items-end" : "items-start")}>
        {showHeader ? (
          <div
            className={cn(
              "flex items-center gap-2 px-1 text-[10.5px] text-muted-foreground",
              isOwnMessage && "flex-row-reverse",
            )}
          >
            <span className="font-medium text-foreground/80">{message.user.name}</span>
            <span>{formatTime(message.createdAt)}</span>
          </div>
        ) : null}

        <div
          className={cn(
            "flex flex-col gap-1.5 rounded-2xl px-3 py-2 text-sm shadow-sm",
            isOwnMessage
              ? "rounded-br-sm bg-cfc-brown text-white"
              : "rounded-bl-sm border border-border/60 bg-card text-foreground",
          )}
        >
          {message.replyTo ? (
            <div
              className={cn(
                "rounded-lg border-l-2 px-2 py-1 text-[11px]",
                isOwnMessage
                  ? "border-white/60 bg-white/10 text-white/90"
                  : "border-cfc-gold bg-muted/60 text-muted-foreground",
              )}
            >
              <span className="block font-semibold">{message.replyTo.authorName}</span>
              <span className="line-clamp-2 block">
                {message.replyTo.content || "Pièce jointe"}
              </span>
            </div>
          ) : null}

          {anchor ? (
            <span
              data-anchor={anchor.kind}
              className={cn(
                "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                isOwnMessage ? "bg-white/15 text-white" : "bg-cfc-lightgold text-cfc-brown",
              )}
            >
              {anchor.kind === "etape" ? "Étape" : "Pièce"} · {anchor.label}
            </span>
          ) : null}

          {attachment ? (
            isImage ? (
              attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachmentUrl}
                    alt={attachment.name}
                    className="max-h-56 w-auto max-w-full rounded-lg object-cover"
                  />
                </a>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-black/10 px-2 py-2 text-xs">
                  <ImageIcon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{attachment.name}</span>
                </div>
              )
            ) : (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                download={attachment.name}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors",
                  isOwnMessage
                    ? "bg-white/15 hover:bg-white/25"
                    : "bg-muted/70 hover:bg-muted",
                )}
              >
                <FileText className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
                {attachmentUrl ? (
                  <Download className="size-3.5 shrink-0 opacity-70" aria-hidden />
                ) : null}
                {attachment.size > 0 ? (
                  <span className="shrink-0 opacity-70">{formatSize(attachment.size)}</span>
                ) : null}
              </a>
            )
          ) : null}

          {message.content ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : null}

          <span
            className={cn(
              "self-end text-[10px]",
              isOwnMessage ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>

      {isOwnMessage ? (
        <div className="w-0 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onReply?.(message)}
            aria-label="Répondre à ce message"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CornerUpLeft className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
