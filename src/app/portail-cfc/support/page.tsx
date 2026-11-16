import Link from "next/link";
import { MessagesSquare, Paperclip } from "lucide-react";

import { SupportChat } from "@/components/support/support-chat";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Tag } from "@/components/ui/tag";
import { listSupportConversations } from "@/server/queries/support";
import { getServerProfile } from "@/server/auth/profile";

export const dynamic = "force-dynamic";

/**
 * File de support de la console CFC.
 *
 * Chaque conversation est **une pièce du dossier** : la liste montre les
 * dossiers en conversation, la conversation se lit à droite. L'agent reste
 * dans son périmètre — la RLS du fil ne lui montre que les dossiers qu'il
 * instruit.
 */
export default async function SupportConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>;
}) {
  const [profile, params, result] = await Promise.all([
    getServerProfile().catch(() => null),
    searchParams,
    listSupportConversations(),
  ]);

  const conversations = result.ok ? result.conversations : [];
  const selectedId = params.dossier ?? conversations[0]?.dossierId ?? null;
  const selected = conversations.find((item) => item.dossierId === selectedId) ?? null;

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            File de support
          </h1>
          <p className="text-xs text-muted-foreground">
            Les conversations rattachées aux dossiers que vous instruisez.
          </p>
        </div>
        <Badge variant="cfc">
          {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
        </Badge>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Liste des conversations */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <p className="border-b border-border/60 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </p>

          {conversations.length === 0 ? (
            <div className="p-3">
              <Empty title="Aucune conversation" />
              <p className="mt-2 text-xs text-muted-foreground">
                Les messages échangés avec les emprunteurs apparaîtront ici.
              </p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const active = conversation.dossierId === selectedId;
                return (
                  <li key={conversation.dossierId}>
                    <Link
                      href={`/portail-cfc/support?dossier=${conversation.dossierId}`}
                      aria-current={active ? "true" : undefined}
                      className={`block border-b border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/40 ${
                        active ? "bg-muted/60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {conversation.citizenName ?? conversation.ducCode}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(conversation.lastMessageAt).toLocaleDateString("fr-FR", {
                            dateStyle: "short",
                          })}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {conversation.lastMessagePreview}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <Tag tone="neutral" size="sm">
                          {conversation.ducCode}
                        </Tag>
                        {conversation.stepCode ? (
                          <Tag tone="blue" size="sm">
                            {conversation.stepCode}
                          </Tag>
                        ) : null}
                        {conversation.hasAttachment ? (
                          <Paperclip className="size-3 text-muted-foreground" aria-hidden />
                        ) : null}
                        <span className="text-[10px] text-muted-foreground">
                          {conversation.messageCount} message
                          {conversation.messageCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Conversation ouverte */}
        <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
          {selected ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {selected.citizenName ?? selected.ducCode}
                  </span>
                  <span className="truncate text-[10.5px] text-muted-foreground">
                    Dossier {selected.ducCode}
                  </span>
                </div>
                <Link
                  href={`/portail-cfc/clients?tab=duc`}
                  className="shrink-0 text-[11px] font-medium text-cfc-brown underline-offset-2 hover:underline"
                >
                  Ouvrir le dossier
                </Link>
              </header>

              <div className="min-h-0 flex-1">
                <SupportChat
                  roomName={`dossier:${selected.dossierId}`}
                  dossierId={selected.dossierId}
                  displayName={profile?.fullName ?? profile?.email ?? "Agent CFC"}
                  anchor={
                    selected.stepCode
                      ? { kind: "etape", id: selected.stepCode, label: selected.stepCode }
                      : null
                  }
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessagesSquare className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                Aucune conversation sélectionnée
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Choisissez une conversation à gauche, ou attendez qu&apos;un
                emprunteur vous écrive depuis son espace.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
