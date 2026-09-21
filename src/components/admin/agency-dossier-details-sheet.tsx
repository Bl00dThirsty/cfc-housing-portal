"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getInitials } from "@/lib/utils";

export interface AgencyDossierItem {
  id: string;
  ducId: string;
  client: string;
  profession: string;
  agency: string;
  savingsAmount: string;
  savingsProgress: string;
  status: string;
  date: string;
  phone?: string;
  projectType?: string;
}

interface AgencyDossierDetailsSheetProps {
  dossier: AgencyDossierItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgencyDossierDetailsSheet({
  dossier,
  open,
  onOpenChange,
}: AgencyDossierDetailsSheetProps) {
  if (!dossier) return null;

  const isReady = dossier.status === "Prêt pour BET";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col justify-between bg-background border-l border-border/40">
        <div className="space-y-5 p-6">
          {/* Header */}
          <SheetHeader className="space-y-2 border-b border-border/40 pb-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Pôle Production des Crédits · Agence Commerciale
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {dossier.ducId}
              </Badge>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Avatar className="size-11 rounded-lg">
                <AvatarFallback className="rounded-lg text-sm font-bold bg-blue-500/15 text-blue-700">
                  {getInitials(dossier.client)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <SheetTitle className="text-base font-bold text-foreground truncate">
                  {dossier.client}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground truncate">
                  {dossier.profession} · {dossier.agency}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Épargne Réalisée</span>
              <span className="text-xs font-bold font-mono text-foreground block">
                {dossier.savingsAmount}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">
                {dossier.savingsProgress} de l&apos;apport
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Statut Circuit</span>
              <Badge
                variant="secondary"
                className={
                  isReady
                    ? "bg-emerald-500/10 text-emerald-700 h-4.5 px-1.5 text-[10px] font-medium"
                    : "bg-amber-500/10 text-amber-700 h-4.5 px-1.5 text-[10px] font-medium"
                }
              >
                {dossier.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground block truncate">
                {dossier.date}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Agence</span>
              <span className="text-xs font-semibold text-foreground truncate block">
                {dossier.agency.replace("Agence ", "")}
              </span>
              <span className="text-[10px] text-muted-foreground block">Guichet CFC</span>
            </div>
          </div>

          {/* Dossier Details Lines */}
          <div className="rounded-lg border border-border/40 p-4 space-y-3 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Données Civiles &amp; Instruction
            </h4>

            <div className="space-y-2 divide-y divide-border/30">
              <div className="flex items-center justify-between pt-1 text-muted-foreground">
                <span>Identifiant Unique :</span>
                <span className="font-mono font-medium text-foreground">{dossier.ducId}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Emprunteur :</span>
                <span className="font-medium text-foreground">{dossier.client}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Activité Professionnelle :</span>
                <span className="text-foreground">{dossier.profession}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Agence d&apos;Enrôlement :</span>
                <span className="text-foreground">{dossier.agency}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Dernière Activité :</span>
                <span className="text-foreground">{dossier.date}</span>
              </div>
            </div>
          </div>

          {/* Checklist KYC Préliminaire */}
          <div className="rounded-lg border border-border/40 p-4 space-y-2.5 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Contrôles Préalables Guichet Unique (G1)
            </h4>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                <span className="text-muted-foreground">Vérification CNI &amp; État-Civil :</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="size-3" /> Validé
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                <span className="text-muted-foreground">Fichier Central Anti-Doublon :</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="size-3" /> Conforme (0 doublon)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                <span className="text-muted-foreground">Apport Personnel Minimal (20%) :</span>
                <span className="inline-flex items-center gap-1 text-foreground font-semibold">
                  {dossier.savingsProgress}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-muted/15 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fermer
          </Button>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="text-xs font-medium gap-1.5"
            >
              <Link href="/admin/clients">
                Ouvrir dans le Hub DUC
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
