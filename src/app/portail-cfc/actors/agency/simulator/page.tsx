"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const simulatorKpis: ActorKpiItem[] = [
  {
    title: "Simulations Réalisées (Mois)",
    value: "682",
    change: "31.2%",
    isPositive: true,
    previous: "520",
    period: "ce mois",
  },
  {
    title: "Score Moyen Portefeuille",
    value: "B+",
    change: "4.1%",
    isPositive: true,
    previous: "B",
    period: "ce mois",
  },
  {
    title: "Taux Éligibilité",
    value: "68.3%",
    change: "3.7%",
    isPositive: true,
    previous: "64.6%",
    period: "ce mois",
  },
  {
    title: "Apport Moyen Simulé",
    value: "4,2 M FCFA",
    change: "8.5%",
    isPositive: true,
    previous: "3,9 M FCFA",
    period: "ce mois",
  },
  {
    title: "Durée Moyenne Prêt",
    value: "18,5 ans",
    change: "2.3%",
    isPositive: false,
    previous: "19 ans",
    period: "ce mois",
  },
];

const simulations = [
  {
    id: "s1",
    ref: "SIM-2026-04829",
    client: "ABANDA Eric",
    revenus: "850 000 FCFA/mois",
    apport: "4 800 000 FCFA",
    score: "A",
    result: "Éligible",
    date: "Aujourd'hui, 15:20",
  },
  {
    id: "s2",
    ref: "SIM-2026-04830",
    client: "NKOULOU Sandrine",
    revenus: "420 000 FCFA/mois",
    apport: "2 100 000 FCFA",
    score: "B",
    result: "Éligible",
    date: "Aujourd'hui, 12:45",
  },
  {
    id: "s3",
    ref: "SIM-2026-04831",
    client: "FOKAM Emmanuel",
    revenus: "1 200 000 FCFA/mois",
    apport: "6 500 000 FCFA",
    score: "A+",
    result: "Éligible",
    date: "Hier, 17:30",
  },
  {
    id: "s4",
    ref: "SIM-2026-04832",
    client: "MBARGA Jean",
    revenus: "180 000 FCFA/mois",
    apport: "800 000 FCFA",
    score: "D",
    result: "Non éligible",
    date: "Hier, 10:15",
  },
  {
    id: "s5",
    ref: "SIM-2026-04833",
    client: "ESSOMBA Claire",
    revenus: "650 000 FCFA/mois",
    apport: "3 200 000 FCFA",
    score: "B+",
    result: "Éligible",
    date: "02 Sept 2026",
  },
  {
    id: "s6",
    ref: "SIM-2026-04834",
    client: "TABI Robert",
    revenus: "290 000 FCFA/mois",
    apport: "1 500 000 FCFA",
    score: "C",
    result: "Sous réserve",
    date: "01 Sept 2026",
  },
];

const scoreStyles: Record<string, string> = {
  "A+": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "A": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "B+": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "B": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "C": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "D": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

const resultStyles: Record<string, string> = {
  "Éligible": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Sous réserve": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Non éligible": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function SimulatorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = simulations.filter(
    (s) =>
      s.client.toLowerCase().includes(search.toLowerCase()) ||
      s.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G1
            </Badge>
            <Badge variant="secondary" className="bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 border-transparent h-5 px-2 text-xs font-medium">
              Scoring & Éligibilité
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Simulateur d&apos;Apport &amp; Scoring Client
          </h1>
          <p className="text-sm text-muted-foreground">
            Pré-évaluation de l&apos;apport personnel, capacité d&apos;endettement et score d&apos;éligibilité crédit habitat CFC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Simulations
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <ActorKpiStrip items={simulatorKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur ou N° simulation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Grille de scoring CFC · Barème COBAC 2026</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">N° Simulation</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Revenus Déclarés</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Apport Simulé</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3 text-center">Score</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Résultat</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date</TableHead>
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
                  <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
                    {item.client}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-foreground">
                    {item.revenus}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.apport}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center">
                    <Badge
                      variant="secondary"
                      className={`${scoreStyles[item.score] ?? ""} h-5 px-2 text-xs font-semibold border-transparent`}
                    >
                      {item.score}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${resultStyles[item.result] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.date}</TableCell>
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
