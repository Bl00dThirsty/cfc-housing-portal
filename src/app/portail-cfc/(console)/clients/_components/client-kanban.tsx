"use client";

import { ArrowRight, FileText, History, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import type { ClientItem } from "@/domain/entities/client";

const WORKFLOW_COLUMNS = [
  { id: "kyc_savings", title: "Épargne & KYC", subtitle: "Identité et épargne" },
  { id: "risk_bet", title: "Risques & BET", subtitle: "Études et solvabilité" },
  { id: "committees", title: "Comités de crédit", subtitle: "Instruction et arbitrage" },
  { id: "notary_mortgage", title: "Notaire & hypothèque", subtitle: "Actes et garanties" },
  { id: "disbursements", title: "Déblocages", subtitle: "Mise à disposition du prêt" },
  { id: "closing_release", title: "Clôture & mainlevée", subtitle: "Remboursement et clôture" },
] as const;

interface ClientKanbanProps {
  client: ClientItem | null;
  onOpenDuc?: () => void;
}

export function ClientKanban({ client, onOpenDuc }: ClientKanbanProps) {
  if (!client) {
    return (
      <section className="rounded-lg border bg-card p-8 text-center">
        <UserRound className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h2 className="font-semibold">Sélectionnez un dossier</h2>
        <p className="mt-1 text-sm text-muted-foreground">Le tableau affiche l’étape et l’historique enregistrés pour le dossier choisi.</p>
      </section>
    );
  }

  const current = WORKFLOW_COLUMNS.find((column) => column.id === client.phaseCode);
  const latestActivity = client.visas[0];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className={cn("size-10 rounded-md border", client.avatarTone)}>
            <AvatarFallback className="text-xs font-bold">{getInitials(client.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold">{client.name}</h2>
              <Badge variant="outline" className="font-mono text-[10px]">{client.ducId}</Badge>
              <Badge variant="secondary" className="text-[10px]">{client.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {current ? `Étape actuelle : ${current.title}` : `Étape actuelle : ${client.phase}`}
              {client.officer !== "—" ? ` · Gestionnaire : ${client.officer}` : ""}
            </p>
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onOpenDuc}>
          <FileText className="size-3.5" />
          Ouvrir le DUC
          <ArrowRight className="size-3" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {WORKFLOW_COLUMNS.map((column) => {
          const isCurrent = current?.id === column.id;
          return (
            <article
              key={column.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "min-h-44 rounded-lg border bg-card p-4",
                isCurrent && "border-primary/50 bg-primary/[0.025]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{column.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{column.subtitle}</p>
                </div>
                <Badge variant={isCurrent ? "default" : "outline"} className="text-[10px]">
                  {isCurrent ? "Étape actuelle" : "Étape du parcours"}
                </Badge>
              </div>

              {isCurrent ? (
                <div className="mt-4 space-y-3 rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{client.ducId}</span>
                    <span className="text-[10px] text-muted-foreground">{client.documents.length} pièce{client.documents.length > 1 ? "s" : ""} enregistrée{client.documents.length > 1 ? "s" : ""}</span>
                  </div>
                  {latestActivity ? (
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <History className="mt-0.5 size-3.5 shrink-0" />
                      <p className="min-w-0">
                        <span className="font-medium text-foreground">{latestActivity.stage}</span>
                        {latestActivity.comment && latestActivity.comment !== "—" ? ` · ${latestActivity.comment}` : ""}
                        <span className="mt-1 block text-[10px]">{latestActivity.date}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucun événement n’a encore été journalisé pour cette étape.</p>
                  )}
                </div>
              ) : (
                <p className="mt-7 text-xs text-muted-foreground">Aucun élément de ce dossier n’est enregistré à cette étape.</p>
              )}
            </article>
          );
        })}
      </div>

      {!current && (
        <p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
          Le code de l’étape en base ne correspond pas aux étapes configurées dans l’interface. Le dossier reste visible avec son état original.
        </p>
      )}
    </section>
  );
}
