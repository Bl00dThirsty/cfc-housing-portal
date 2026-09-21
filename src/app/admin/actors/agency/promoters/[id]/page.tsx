"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Printer,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { promotersData } from "../data";

export default function PromoterDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "p1";

  const promoter = promotersData.find((p) => p.id === id) || promotersData[0];
  const occupancyPercent = Math.round(
    ((promoter.total - promoter.available) / promoter.total) * 100
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/admin/actors/agency/promoters"
          className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Catalogue Promoteurs &amp; SIC
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span>Programme Immobilier</span>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span className="text-foreground font-semibold">{promoter.programme}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {promoter.programme}
            </h1>
            <Badge
              variant="secondary"
              className={
                promoter.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-700 h-5 px-2 text-xs font-semibold"
                  : "bg-slate-500/10 text-slate-700 h-5 px-2 text-xs font-semibold"
              }
            >
              {promoter.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Promoteur conventionné : {promoter.name} · Localisation : {promoter.city}, Cameroun
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-8 gap-1.5"
          >
            <Printer className="size-3.5" />
            Imprimer Fiche
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5">
            <Download className="size-3.5" />
            Export Convention PDF
          </Button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/30 bg-card/40 p-4 shadow-2xs space-y-2">
          <span className="text-xs text-muted-foreground">Disponibilité des Lots</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">
              {promoter.available}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              sur {promoter.total} logements
            </span>
          </div>
          <div className="space-y-1 pt-1">
            <Progress value={occupancyPercent} className="h-1.5" />
            <span className="text-[10px] text-muted-foreground block text-right">
              {occupancyPercent}% commercialisés
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/30 bg-card/40 p-4 shadow-2xs space-y-2">
          <span className="text-xs text-muted-foreground">Fourchette Tarifaire</span>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold font-mono text-foreground">
              {promoter.priceRange}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground block pt-1">
            Éligible crédit acquéreur direct CFC
          </span>
        </div>

        <div className="rounded-xl border border-border/30 bg-card/40 p-4 shadow-2xs space-y-2">
          <span className="text-xs text-muted-foreground">Conditions Convention CFC</span>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              5.50%
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">l&apos;an fixe</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block pt-1">
            Apport réduit à 15% pour logements SIC
          </span>
        </div>
      </div>

      {/* Main Programme Specs (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Programme Information Table */}
        <div className="md:col-span-8 rounded-xl border border-border/30 bg-card/40 p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] pb-2 border-b border-border/20">
            Fiche Technique du Programme Conventionné
          </h3>

          <div className="divide-y divide-border/20 text-xs">
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Promoteur Titulaire :</span>
              <span className="col-span-7 font-semibold text-foreground">{promoter.name}</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Nom du Programme :</span>
              <span className="col-span-7 text-foreground font-medium">{promoter.programme}</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Localisation Géographique :</span>
              <span className="col-span-7 text-foreground">{promoter.city}, Cameroun</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Capacité Totale du Site :</span>
              <span className="col-span-7 font-mono font-semibold text-foreground">{promoter.total} unités</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Logements Disponibles à l&apos;Attribution :</span>
              <span className="col-span-7 font-mono font-bold text-emerald-600">{promoter.available} unités</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Convention Cadre CFC :</span>
              <span className="col-span-7 text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Accord de financement direct actif
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Eligibility */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/30 bg-card/40 p-4 shadow-2xs space-y-3 text-xs">
            <h4 className="font-semibold text-foreground text-[11.5px]">
              Attribution aux Emprunteurs DUC
            </h4>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Les emprunteurs disposant d&apos;un DUC avec apport constitué de 15% ou 20% peuvent être positionnés directement sur les lots disponibles de ce programme.
            </p>
            <Button asChild className="w-full text-xs gap-1.5 mt-2">
              <Link href="/admin/clients">
                Positionner un Emprunteur DUC
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
