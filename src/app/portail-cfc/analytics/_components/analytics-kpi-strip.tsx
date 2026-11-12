"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsKpi {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  previous: string;
  period: string;
  description: string;
  monthlyBreakdown: { month: string; actual: string; target: string }[];
  agenciesPerformance: { agency: string; contribution: string; trend: string }[];
}

const kpiItems: AnalyticsKpi[] = [
  {
    title: "Unique Visitors",
    value: "213.1k",
    change: "2.8%",
    isPositive: true,
    previous: "207.3k",
    period: "last 4 weeks",
    description: "Volume cumulé des visiteurs uniques ayant accédé au portail public et au simulateur de crédit CFC.",
    monthlyBreakdown: [
      { month: "Août 2026", actual: "213.1k", target: "200.0k" },
      { month: "Juillet 2026", actual: "207.3k", target: "190.0k" },
      { month: "Juin 2026", actual: "189.5k", target: "180.0k" },
      { month: "Mai 2026", actual: "174.2k", target: "170.0k" },
    ],
    agenciesPerformance: [
      { agency: "Centre & Siège (Yaoundé)", contribution: "48%", trend: "+5.2%" },
      { agency: "Littoral (Douala)", contribution: "32%", trend: "+3.8%" },
      { agency: "Ouest (Bafoussam)", contribution: "12%", trend: "+1.9%" },
      { agency: "Diaspora (International)", contribution: "8%", trend: "+14.5%" },
    ],
  },
  {
    title: "Sessions",
    value: "248.6k",
    change: "2.1%",
    isPositive: true,
    previous: "243.5k",
    period: "last 4 weeks",
    description: "Nombre total de sessions d'interaction sur les simulateurs, catalogues promoteurs et guichets en ligne.",
    monthlyBreakdown: [
      { month: "Août 2026", actual: "248.6k", target: "235.0k" },
      { month: "Juillet 2026", actual: "243.5k", target: "220.0k" },
      { month: "Juin 2026", actual: "218.0k", target: "205.0k" },
      { month: "Mai 2026", actual: "199.1k", target: "190.0k" },
    ],
    agenciesPerformance: [
      { agency: "Mobile Web (Smartphones)", contribution: "64%", trend: "+8.1%" },
      { agency: "Ordinateurs de bureau", contribution: "31%", trend: "-1.2%" },
      { agency: "Tablettes", contribution: "5%", trend: "0.0%" },
    ],
  },
  {
    title: "Pageviews",
    value: "547.9k",
    change: "3.3%",
    isPositive: false,
    previous: "566.8k",
    period: "last 4 weeks",
    description: "Pages de simulation, barèmes d'octroi et grilles de conditions consultées.",
    monthlyBreakdown: [
      { month: "Août 2026", actual: "547.9k", target: "580.0k" },
      { month: "Juillet 2026", actual: "566.8k", target: "550.0k" },
      { month: "Juin 2026", actual: "520.4k", target: "510.0k" },
      { month: "Mai 2026", actual: "490.2k", target: "480.0k" },
    ],
    agenciesPerformance: [
      { agency: "Page Simulateur d'Apport", contribution: "38%", trend: "+12.0%" },
      { agency: "Catalogue Promoteurs SIC/MAETUR", contribution: "27%", trend: "+4.5%" },
      { agency: "Guide Épargne Habitat", contribution: "21%", trend: "-2.1%" },
      { agency: "Guichet Diaspora", contribution: "14%", trend: "+18.0%" },
    ],
  },
  {
    title: "Engagement Rate",
    value: "61.4%",
    change: "4.2%",
    isPositive: true,
    previous: "58.9%",
    period: "last 4 weeks",
    description: "Taux de sessions actives avec exécution d'au moins un calcul de mensualité ou début d'enrôlement.",
    monthlyBreakdown: [
      { month: "Août 2026", actual: "61.4%", target: "60.0%" },
      { month: "Juillet 2026", actual: "58.9%", target: "55.0%" },
      { month: "Juin 2026", actual: "56.2%", target: "52.0%" },
      { month: "Mai 2026", actual: "53.0%", target: "50.0%" },
    ],
    agenciesPerformance: [
      { agency: "Simulations complétées", contribution: "72%", trend: "+6.4%" },
      { agency: "Consultation fiches programmes", contribution: "18%", trend: "+2.0%" },
      { agency: "Téléchargement barèmes", contribution: "10%", trend: "+1.2%" },
    ],
  },
  {
    title: "Conversion Rate",
    value: "8.4%",
    change: "5.6%",
    isPositive: false,
    previous: "8.9%",
    period: "last 4 weeks",
    description: "Proportion d'utilisateurs convertis en Dossier Unique Client (DUC) ou ouverture effective de compte épargne.",
    monthlyBreakdown: [
      { month: "Août 2026", actual: "8.4%", target: "10.0%" },
      { month: "Juillet 2026", actual: "8.9%", target: "9.5%" },
      { month: "Juin 2026", actual: "8.1%", target: "9.0%" },
      { month: "Mai 2026", actual: "7.8%", target: "8.5%" },
    ],
    agenciesPerformance: [
      { agency: "Comptes Épargne ouverts", contribution: "55%", trend: "+14.0%" },
      { agency: "Dossier Unique Client (DUC) déposés", contribution: "35%", trend: "-2.4%" },
      { agency: "Rendez-vous agence pris", contribution: "10%", trend: "+5.1%" },
    ],
  },
];

export function AnalyticsKpiStrip() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
        {kpiItems.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between p-5 gap-4 hover:bg-muted/25 transition-colors group"
          >
            {/* Header: Title + Options */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded opacity-60 group-hover:opacity-100"
                aria-label={`Options for ${item.title}`}
              >
                <Ellipsis className="size-4" />
              </button>
            </div>

            {/* Middle: Big Value + Trend Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {item.value}
              </span>
              <Badge
                variant="secondary"
                className={
                  item.isPositive
                    ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-medium text-xs px-2 py-0.5 border-transparent gap-1"
                    : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 font-medium text-xs px-2 py-0.5 border-transparent gap-1"
                }
              >
                {item.isPositive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {item.change}
              </Badge>
            </div>

            {/* Footer: Comparison subtitle */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                from <strong className="font-medium text-foreground">{item.previous}</strong>
              </span>
              <span>•</span>
              <span>{item.period}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
