"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const boardKpis: ActorKpiItem[] = [
  {
    title: "Programmes Institutionnels",
    value: "12",
    change: "20.0%",
    isPositive: true,
    previous: "10 programmes",
    period: "conventions actives",
  },
  {
    title: "Enveloppe Globale Engagée",
    value: "18,6 Mds FCFA",
    change: "15.0%",
    isPositive: true,
    previous: "16,2 Mds FCFA",
    period: "programmes pluriannuels",
  },
  {
    title: "Arbitrages Conseil d'Admin.",
    value: "5",
    change: "25.0%",
    isPositive: true,
    previous: "4 dossiers",
    period: "session Q3 en cours",
  },
  {
    title: "Taux Réalisation Conventions",
    value: "88.4%",
    change: "3.6%",
    isPositive: true,
    previous: "84.8%",
    period: "jalons contractuels",
  },
  {
    title: "En Négociation Partenaire",
    value: "3",
    change: "25.0%",
    isPositive: true,
    previous: "4",
    period: "bailleurs & ministères",
  },
];

const boardRecords = [
  {
    id: "br1",
    ref: "CONV-MINHDU-CFC-2025-01",
    programmeName: "Programme National 10 000 Logements Sociaux",
    partner: "MINHDU / Direction Habitat",
    totalBudget: "7 500 000 000 FCFA",
    progress: 78,
    boardStatus: "Approuvé CA",
    lastReviewDate: "Conseil du 15 Juin 2026",
  },
  {
    id: "br2",
    ref: "CONV-SIC-CFC-2025-03",
    programmeName: "Opération Cité des Cadres Olembé (320 Logements)",
    partner: "Société Immobilière du Cameroun (SIC)",
    totalBudget: "4 200 000 000 FCFA",
    progress: 65,
    boardStatus: "Approuvé CA",
    lastReviewDate: "Conseil du 15 Juin 2026",
  },
  {
    id: "br3",
    ref: "CONV-MAETUR-CFC-2026-01",
    programmeName: "Viabilisation & Aménagement Mendong Extension",
    partner: "Mission Aménagement Terrains (MAETUR)",
    totalBudget: "2 800 000 000 FCFA",
    progress: 42,
    boardStatus: "Avis Favorable PCA",
    lastReviewDate: "Séance du 12 Août 2026",
  },
  {
    id: "br4",
    ref: "CONV-BDEAC-CFC-2026-02",
    programmeName: "Ligne de Financement Vert & Résilience Urbaine",
    partner: "Banque de Développement des États d'Afrique Centrale",
    totalBudget: "12 000 000 000 FCFA",
    progress: 20,
    boardStatus: "En Examen Conseil",
    lastReviewDate: "Inscrit Ordre du Jour Q3",
  },
  {
    id: "br5",
    ref: "CONV-FEICOM-CFC-2024-04",
    programmeName: "Logements Municipaux Communautaires (CTD)",
    partner: "Fonds d'Équipement Intercommunal (FEICOM)",
    totalBudget: "3 100 000 000 FCFA",
    progress: 90,
    boardStatus: "Approuvé CA",
    lastReviewDate: "Conseil du 15 Juin 2026",
  },
  {
    id: "br6",
    ref: "CONV-MINFI-CFC-2026-05",
    programmeName: "Dotation Bonification Taux d'Intérêt Habitat Social",
    partner: "Ministère des Finances (MINFI)",
    totalBudget: "1 500 000 000 FCFA",
    progress: 85,
    boardStatus: "Avis Favorable PCA",
    lastReviewDate: "Séance du 20 Août 2026",
  },
];

const boardStatusStyles: Record<string, string> = {
  "Approuvé CA": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Avis Favorable PCA": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En Examen Conseil": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function BoardInstitutionalPage() {
  const [search, setSearch] = React.useState("");

  const filtered = boardRecords.filter(
    (b) =>
      b.programmeName.toLowerCase().includes(search.toLowerCase()) ||
      b.ref.toLowerCase().includes(search.toLowerCase()) ||
      b.partner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G6
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-transparent h-5 px-2 text-xs font-medium">
              Gouvernance &amp; Attaché PCA
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dossiers Institutionnels &amp; Attaché PCA
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des grands programmes d&apos;habitat social conventionnés par l&apos;État, partenariats institutionnels et dossiers soumis à l&apos;arbitrage du Conseil d&apos;Administration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Synthèse CA
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={boardKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par convention, intitulé ou partenaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Présidence du Conseil d&apos;Administration (PCA) · Conventions Pluriannuelles</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Convention</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Programme Institutionnel</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Partenaire Institutionnel</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Dotation Engagée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Exécution</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut PCA / CA</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Dernière Revue</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ref}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-semibold text-xs text-foreground block max-w-[240px] truncate">
                      {item.programmeName}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
                    <span className="truncate block">{item.partner}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.totalBudget}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col gap-1 min-w-[90px]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${boardStatusStyles[item.boardStatus] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.boardStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.lastReviewDate}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
