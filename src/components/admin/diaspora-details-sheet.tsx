"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface DiasporaItem {
  id: string;
  client: string;
  country: string;
  flag: string;
  ducId: string;
  savings: string;
  channel: string;
  kyc: string;
  date: string;
  city?: string;
  profession?: string;
}

interface DiasporaDetailsSheetProps {
  dossier: DiasporaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiasporaDetailsSheet({
  dossier,
  open,
  onOpenChange,
}: DiasporaDetailsSheetProps) {
  if (!dossier) return null;

  const isKycComplete = dossier.kyc === "Complet";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col justify-between bg-background border-l border-border/40">
        <div className="space-y-5 p-6">
          {/* Header */}
          <SheetHeader className="space-y-2 border-b border-border/40 pb-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Guichet Diaspora &amp; Camerounais de l&apos;Étranger
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {dossier.ducId}
              </Badge>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="size-11 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center text-xl shrink-0">
                {dossier.flag}
              </div>
              <div className="flex flex-col min-w-0">
                <SheetTitle className="text-base font-bold text-foreground truncate">
                  {dossier.client}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground truncate">
                  Résidence : {dossier.country} · Canal : {dossier.channel}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Épargne Constituée</span>
              <span className="text-xs font-bold font-mono text-foreground block">
                {dossier.savings}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Virement SWIFT / Carte
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Statut KYC Diaspora</span>
              <Badge
                variant="secondary"
                className={
                  isKycComplete
                    ? "bg-emerald-500/10 text-emerald-700 h-4.5 px-1.5 text-[10px] font-medium"
                    : "bg-amber-500/10 text-amber-700 h-4.5 px-1.5 text-[10px] font-medium"
                }
              >
                {dossier.kyc}
              </Badge>
              <span className="text-[10px] text-muted-foreground block truncate">
                {dossier.date}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Pays d&apos;Origine</span>
              <span className="text-xs font-semibold text-foreground truncate block">
                {dossier.country}
              </span>
              <span className="text-[10px] text-muted-foreground block">Non-Résident</span>
            </div>
          </div>

          {/* Dossier Information Lines */}
          <div className="rounded-lg border border-border/40 p-4 space-y-3 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Modalités Bancaires &amp; Rapatriement de Fonds
            </h4>

            <div className="space-y-2 divide-y divide-border/30">
              <div className="flex items-center justify-between pt-1 text-muted-foreground">
                <span>Dossier DUC Associé :</span>
                <span className="font-mono font-medium text-foreground">{dossier.ducId}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Titulaire du Compte :</span>
                <span className="font-medium text-foreground">{dossier.client}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Pays de Résidence Actuelle :</span>
                <span className="font-medium text-foreground">{dossier.country} {dossier.flag}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Canal d&apos;Enrôlement :</span>
                <span className="text-foreground">{dossier.channel}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Dernier Flux d&apos;Épargne :</span>
                <span className="text-foreground">{dossier.date}</span>
              </div>
            </div>
          </div>

          {/* Spécificités Diaspora */}
          <div className="rounded-lg border border-border/40 p-4 space-y-2.5 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Pièces Spécifiques Non-Résidents (CFC Diaspora)
            </h4>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                <span className="text-muted-foreground">Carte Consulaire / Titre de Séjour :</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="size-3" /> Conforme
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                <span className="text-muted-foreground">Avis d&apos;Imposition Pays d&apos;Accueil :</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="size-3" /> Vérifié
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                <span className="text-muted-foreground">Procuration Notariée Représentant Local :</span>
                <span className={isKycComplete ? "inline-flex items-center gap-1 text-emerald-600 font-medium" : "inline-flex items-center gap-1 text-amber-600 font-medium"}>
                  {isKycComplete ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                  {isKycComplete ? "Enregistrée" : "En attente légalisation"}
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

          <Button
            asChild
            size="sm"
            className="text-xs font-medium gap-1.5"
          >
            <Link href="/admin/clients">
              Accéder au DUC
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
