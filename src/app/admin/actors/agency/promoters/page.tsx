"use client";

import * as React from "react";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import {
  PromoterDetailsSheet,
  type PromoterItem,
} from "@/components/admin/promoter-details-sheet";

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
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [selectedPromoter, setSelectedPromoter] = React.useState<PromoterItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const statusOptions = React.useMemo(() => [
    { label: "Active", value: "Active", count: promoters.filter((p) => p.status === "Active").length },
    { label: "Complet", value: "Complet", count: promoters.filter((p) => p.status === "Complet").length },
  ], []);

  const cityOptions = React.useMemo(() => [
    { label: "Yaoundé", value: "Yaoundé", count: promoters.filter((p) => p.city === "Yaoundé").length },
    { label: "Douala", value: "Douala", count: promoters.filter((p) => p.city === "Douala").length },
  ], []);

  const filtered = promoters.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.programme.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(p.status);
    const matchesCity =
      selectedCities.length === 0 || selectedCities.includes(p.city);

    return matchesSearch && matchesStatus && matchesCity;
  });

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
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <DataTableToolbar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par promoteur, programme ou ville..."
          totalCount={promoters.length}
          filteredCount={filtered.length}
          unitName="programmes"
          filters={[
            {
              id: "status",
              title: "Statut",
              options: statusOptions,
              selectedValues: selectedStatuses,
              onSelect: setSelectedStatuses,
            },
            {
              id: "city",
              title: "Ville",
              options: cityOptions,
              selectedValues: selectedCities,
              onSelect: setSelectedCities,
            },
          ]}
          onResetAll={() => {
            setSelectedStatuses([]);
            setSelectedCities([]);
          }}
        />

        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                    Aucun programme immobilier ne correspond aux critères sélectionnés.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const occupancyPercent = Math.round(((item.total - item.available) / item.total) * 100);
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => {
                        setSelectedPromoter(item);
                        setIsDetailsOpen(true);
                      }}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <TableCell className="px-3 py-2.5">
                        <span className="text-xs font-semibold text-foreground">{item.name}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[200px]">
                        <span className="truncate block font-medium">{item.programme}</span>
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
                      <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPromoter(item);
                            setIsDetailsOpen(true);
                          }}
                          className="size-8 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dedicated Promoter Details Sheet */}
      <PromoterDetailsSheet
        promoter={selectedPromoter}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
