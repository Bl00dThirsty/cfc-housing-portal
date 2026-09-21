"use client";

import * as React from "react";
import {
  CheckCircle2,
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

export interface PromoterItem {
  id: string;
  name: string;
  programme: string;
  city: string;
  available: number;
  total: number;
  priceRange: string;
  status: string;
  updated: string;
  contact?: string;
  phone?: string;
}

interface PromoterDetailsSheetProps {
  promoter: PromoterItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoterDetailsSheet({
  promoter,
  open,
  onOpenChange,
}: PromoterDetailsSheetProps) {
  if (!promoter) return null;

  const reserved = promoter.total - promoter.available;
  const rate = Math.round((reserved / (promoter.total || 1)) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col justify-between bg-background border-l border-border/40">
        <div className="space-y-5 p-6">
          {/* Header */}
          <SheetHeader className="space-y-2 border-b border-border/40 pb-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Partenariats Promoteurs Immobiliers &amp; SIC
              </span>
              <Badge variant="outline" className="text-[10px]">
                {promoter.city}
              </Badge>
            </div>

            <div className="pt-1">
              <SheetTitle className="text-base font-bold text-foreground">
                {promoter.programme}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {promoter.name} · Ville de {promoter.city}
              </SheetDescription>
            </div>
          </SheetHeader>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Logements Dispo</span>
              <span className="text-sm font-bold font-mono text-foreground block">
                {promoter.available} / {promoter.total}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">
                {rate}% réservés
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Grille Prix</span>
              <span className="text-xs font-bold font-mono text-foreground block truncate">
                {promoter.priceRange}
              </span>
              <span className="text-[10px] text-muted-foreground block">Bonifié CFC</span>
            </div>

            <div className="p-3 rounded-lg bg-muted/25 border border-border/30 space-y-1">
              <span className="text-[10.5px] text-muted-foreground block">Convention</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 h-4.5 px-1.5 text-[10px] font-medium">
                {promoter.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground block truncate">
                {promoter.updated}
              </span>
            </div>
          </div>

          {/* Program Information Lines */}
          <div className="rounded-lg border border-border/40 p-4 space-y-3 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Fiche Programme Immobilier
            </h4>

            <div className="space-y-2 divide-y divide-border/30">
              <div className="flex items-center justify-between pt-1 text-muted-foreground">
                <span>Promoteur Conventionné :</span>
                <span className="font-medium text-foreground">{promoter.name}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Intitulé du Programme :</span>
                <span className="font-medium text-foreground">{promoter.programme}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Localisation :</span>
                <span className="text-foreground">{promoter.city}, Cameroun</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Unités Totales Prévues :</span>
                <span className="font-mono text-foreground">{promoter.total} logements</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Unités Restantes en Commercialisation :</span>
                <span className="font-mono font-semibold text-foreground">{promoter.available} logements</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Fourchette de Prix :</span>
                <span className="font-mono font-semibold text-foreground">{promoter.priceRange}</span>
              </div>
            </div>
          </div>

          {/* Conditions CFC */}
          <div className="rounded-lg border border-border/40 p-4 space-y-2 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Accompagnement Financement CFC
            </h4>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed">
              Ce programme bénéficie de l&apos;accord-cadre CFC permettant un taux d&apos;intérêt préférentiel de 5.50% l&apos;an sur 15 à 20 ans.
              Les acquéreurs éligibles bénéficient d&apos;un apport réduit à 15% pour les logements sociaux SIC.
            </p>
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
            size="sm"
            className="text-xs font-medium gap-1.5"
          >
            Consulter Lots Disponibles
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
