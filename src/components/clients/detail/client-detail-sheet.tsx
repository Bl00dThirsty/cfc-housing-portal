"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderOpen, Kanban as KanbanIcon, Landmark } from "lucide-react";

import { SegmentBar } from "@/components/_common/segment-bar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag } from "@/components/ui/tag";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn, getInitials } from "@/lib/utils";

import { DetailSection } from "./detail-section";
import type { ClientItem } from "@/domain/entities/client";

type ClientDetailSheetProps = {
  /**
   * L'emprunteur dont la fiche est ouverte.
   *
   * L'état d'interface vit dans le hub, qui en est le parent commun : la
   * fiche ne possède plus de store, elle reçoit son sujet.
   */
  client: ClientItem | null;
  /** La fiche est-elle ouverte ? */
  open: boolean;
  /** Fermer la fiche : le hub décide de l'oublier. */
  onOpenChange: (open: boolean) => void;
  onOpenKanban: (client: ClientItem) => void;
  onOpenDuc: (client: ClientItem) => void;
  onOpenEpargne: (client: ClientItem) => void;
};

const STATUS_TONE: Record<ClientItem["status"], "green" | "neutral" | "red" | "teal" | "purple"> = {
  Conforme: "green",
  "En Examen": "neutral",
  "Pièces Manquantes": "red",
  Accordé: "teal",
  Mainlevée: "purple",
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="caption-style text-soft">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ClientDetailSheet({
  client,
  open,
  onOpenChange,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientDetailSheetProps) {
  const router = useRouter();

  return (
    <Sheet open={open && client !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:w-[560px] sm:max-w-[560px]"
      >
        {client && (
          <>
            <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-line-strong px-5 py-4 text-left">
              <div className="flex min-w-0 flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                  <Avatar className={cn("size-9 rounded-md border", client.avatarTone)}>
                    <AvatarFallback className="text-[11px] font-bold">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{client.name}</span>
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-xs">
                  <span className="font-mono">{client.ducId}</span>
                  <Tag tone="blue" size="sm">
                    {client.phase}
                  </Tag>
                  <Tag tone={STATUS_TONE[client.status]} size="sm">
                    {client.status}
                  </Tag>
                </SheetDescription>
              </div>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1">
              <DetailSection title="Situation du dossier">
                <div className="grid grid-cols-2 gap-3">
                  <Fact label="Montant du prêt" value={`${client.loanAmount} FCFA`} />
                  <Fact label="Épargne constituée" value={`${client.savingsCurrent} FCFA`} />
                  <Fact label="Apport" value={`${client.savingsPercent}%`} />
                  <Fact label="Taux" value={`${client.rate}`} />
                  <Fact label="Durée" value={`${client.durationYears} ans`} />
                  <Fact label="Mensualité" value={`${client.monthlyPayment} FCFA`} />
                  <Fact label="Revenu mensuel" value={`${client.monthlyIncome} FCFA`} />
                  <Fact label="Taux d'endettement" value={client.debtRatio} />
                  <Fact label="Titre foncier" value={client.landTitle ?? "—"} />
                  <Fact label="Agence" value={client.agency} />
                </div>
              </DetailSection>

              <DetailSection title="Avancement du circuit">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[28px] leading-none font-semibold text-foreground">
                      {client.completionPercent}%
                    </span>
                    <span className="caption-style text-soft">{client.phase}</span>
                  </div>
                  <SegmentBar
                    percent={client.completionPercent}
                    className="h-3 w-full border border-line-strong px-px"
                    segmentClassName="h-2"
                  />
                  <p className="caption-style text-soft">
                    Dernière activité : {client.lastActivity}
                  </p>
                </div>
              </DetailSection>

              <DetailSection title="Pièces du DUC">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="lead-style">Pièces au dossier</span>
                    <span className="caption-style text-soft">
                      {client.documents.length} document(s)
                    </span>
                  </div>
                  {client.documents.slice(0, 6).map((doc) => (
                    <div
                      key={`${doc.name}-${doc.date}`}
                      className="flex items-center justify-between gap-2 border-b border-line-strong pb-1.5 last:border-b-0"
                    >
                      <span className="truncate text-xs text-foreground">{doc.name}</span>
                      <span className="caption-style shrink-0 text-soft">{doc.status}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>

              <DetailSection title="Visas & décisions">
                <div className="flex flex-col gap-2">
                  {client.visas.length === 0 ? (
                    <p className="caption-style text-soft">Aucune décision enregistrée.</p>
                  ) : (
                    client.visas.map((visa, index) => (
                      <div
                        key={`${visa.stage}-${visa.date}-${index}`}
                        className="flex flex-col gap-0.5 border-b border-line-strong pb-2 last:border-b-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {visa.stage}
                          </span>
                          <Tag
                            tone={visa.decision === "Favorable" ? "green" : "amber"}
                            size="sm"
                          >
                            {visa.decision}
                          </Tag>
                        </div>
                        <span className="caption-style text-soft">
                          {visa.actor} · {visa.date}
                        </span>
                        {visa.comment && (
                          <span className="text-xs text-muted-foreground">{visa.comment}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DetailSection>

              {client.savingsPassbook && (
                <DetailSection title="Carnet d'épargne">
                  <div className="grid grid-cols-2 gap-3">
                    <Fact
                      label="Compte"
                      value={<span className="font-mono">{client.savingsPassbook.accountNumber}</span>}
                    />
                    <Fact
                      label="Objectif"
                      value={client.savingsPassbook.savingsTarget === null
                        ? "Non renseigné"
                        : `${client.savingsPassbook.savingsTarget.toLocaleString("fr-FR")} FCFA`}
                    />
                    <Fact
                      label="Solde"
                      value={`${client.savingsPassbook.currentBalance.toLocaleString("fr-FR")} FCFA`}
                    />
                    <Fact label="Statut" value={client.savingsPassbook.status} />
                  </div>
                </DetailSection>
              )}
            </ScrollArea>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-line-strong px-5 py-3">
              <SheetClose asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  Fermer
                </Button>
              </SheetClose>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenEpargne(client);
                  }}
                >
                  <Landmark className="size-3.5" />
                  Épargne
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenDuc(client);
                  }}
                >
                  <FolderOpen className="size-3.5" />
                  DUC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenKanban(client);
                  }}
                >
                  <KanbanIcon className="size-3.5" />
                  Kanban
                </Button>
                <Button
                  variant="cfc"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/portail-cfc/clients/${client.id}`);
                  }}
                >
                  <FileText className="size-3.5" />
                  Fiche complète
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
