"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const promotersKpis: ActorKpiItem[] = [
  {
    title: "Promoteurs Conventionnés",
    value: "24",
    change: "9.1%",
    isPositive: true,
    previous: "22",
    period: "ce trimestre",
  },
  {
    title: "Programmes Actifs",
    value: "38",
    change: "15.2%",
    isPositive: true,
    previous: "33",
    period: "ce trimestre",
  },
  {
    title: "Logements Disponibles",
    value: "1 240",
    change: "6.8%",
    isPositive: false,
    previous: "1 330",
    period: "ce trimestre",
  },
  {
    title: "Dossiers via Promoteurs (Mois)",
    value: "187",
    change: "24.0%",
    isPositive: true,
    previous: "151",
    period: "ce mois",
  },
  {
    title: "Taux de Réservation",
    value: "73.5%",
    change: "5.2%",
    isPositive: true,
    previous: "68.3%",
    period: "ce trimestre",
  },
];

const promoters = [
  {
    id: "p1",
    name: "SIC (Société Immobilière du Cameroun)",
    programme: "Résidence Les Palmiers – Phase 3",
    city: "Yaoundé",
    available: 45,
    total: 120,
    priceRange: "18 – 35 M FCFA",
    status: "Active",
    updated: "Aujourd'hui",
  },
  {
    id: "p2",
    name: "MAETUR",
    programme: "Lotissement Mendong Extension",
    city: "Yaoundé",
    available: 180,
    total: 350,
    priceRange: "8 – 15 M FCFA",
    status: "Active",
    updated: "Hier",
  },
  {
    id: "p3",
    name: "SIPIM SA",
    programme: "Cité des Cadres – Bonamoussadi",
    city: "Douala",
    available: 22,
    total: 80,
    priceRange: "25 – 55 M FCFA",
    status: "Active",
    updated: "02 Sept 2026",
  },
  {
    id: "p4",
    name: "Groupe Ngo & Fils",
    programme: "Green Villas Bastos",
    city: "Yaoundé",
    available: 8,
    total: 30,
    priceRange: "45 – 120 M FCFA",
    status: "Active",
    updated: "01 Sept 2026",
  },
  {
    id: "p5",
    name: "CFC Habitat (Interne)",
    programme: "Résidence CFC Nsimeyong",
    city: "Yaoundé",
    available: 0,
    total: 60,
    priceRange: "22 – 38 M FCFA",
    status: "Complet",
    updated: "30 Août 2026",
  },
  {
    id: "p6",
    name: "PROMETAL Cameroun",
    programme: "Cité Eco – Logbessou",
    city: "Douala",
    available: 95,
    total: 200,
    priceRange: "12 – 22 M FCFA",
    status: "Active",
    updated: "28 Août 2026",
  },
];

export default function PromotersPage() {
  const [search, setSearch] = React.useState("");

  const filtered = promoters.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.programme.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Offre Immobilière
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Partenariats Promoteurs Immobiliers &amp; SIC
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion des conventions promoteurs, suivi des programmes immobiliers conventionnés et disponibilité des logements SIC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Catalogue
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <ActorKpiStrip items={promotersKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par promoteur, programme ou ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Conventions Promoteurs · Programmes Immobiliers Conventionnés</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Promoteur / SIC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Programme Immobilier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Ville</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Disponibilité</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Fourchette Prix</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">MAJ</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const occupancyPercent = Math.round(((item.total - item.available) / item.total) * 100);
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-3 py-2.5">
                      <span className="text-xs font-semibold text-foreground">{item.name}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[200px]">
                      <span className="truncate block">{item.programme}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{item.city}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground">{item.available} / {item.total}</span>
                          <span className="text-muted-foreground">{occupancyPercent}%</span>
                        </div>
                        <Progress
                          value={occupancyPercent}
                          className="h-1.5"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-mono text-foreground whitespace-nowrap">
                      {item.priceRange}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge
                        variant="secondary"
                        className={
                          item.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium border-transparent"
                            : "bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 h-5 px-2 text-xs font-medium border-transparent"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.updated}</TableCell>
                    <TableCell className="text-right pr-4 py-2.5">
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
