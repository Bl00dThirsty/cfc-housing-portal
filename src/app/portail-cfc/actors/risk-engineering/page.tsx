"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const betRisquesKpis: ActorKpiItem[] = [
  {
    title: "Dossiers en Expertise",
    value: "156",
    change: "6.5%",
    isPositive: true,
    previous: "146",
    period: "ce mois",
  },
  {
    title: "Visites Chantier Effectuées",
    value: "94",
    change: "18.2%",
    isPositive: true,
    previous: "79",
    period: "ce mois",
  },
  {
    title: "Ratio d'Endettement Moyen",
    value: "28.4%",
    change: "1.2%",
    isPositive: false,
    previous: "29.6%",
    period: "norme COBAC ≤ 33%",
  },
  {
    title: "Devis BET Contrôlés",
    value: "1,28 Mds FCFA",
    change: "15.4%",
    isPositive: true,
    previous: "1,11 Mds FCFA",
    period: "ce mois",
  },
  {
    title: "Délai Moyen d'Analyse",
    value: "4.2 jours",
    change: "12.5%",
    isPositive: true,
    previous: "4.8 jours",
    period: "cible ≤ 5j",
  },
];

const betDossiers = [
  {
    id: "b1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    project: "Construction Villa R+1 (Olembé)",
    expertBET: "Lucien Fame (BET Epsilon)",
    estimatedCost: "18 500 000 FCFA",
    debtRatio: "27.5%",
    status: "Rapport Visite Validé",
    date: "Aujourd'hui, 09:45",
  },
  {
    id: "b2",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    expertBET: "Cabinet BET Ingénierie",
    estimatedCost: "35 000 000 FCFA",
    debtRatio: "28.4%",
    status: "Devis sous réserve plan béton",
    date: "Hier, 16:20",
  },
  {
    id: "b3",
    ducId: "CFC-2026-DUC-04840",
    client: "ATANGANA Thérèse",
    project: "Acquisition & Extension (Mbankolo)",
    expertBET: "Direction des Risques CFC",
    estimatedCost: "12 000 000 FCFA",
    debtRatio: "31.2%",
    status: "Contrôle Solvabilité Conforme",
    date: "01 Sept 2026",
  },
  {
    id: "b4",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    project: "Construction Logement Social (Kribi)",
    expertBET: "BET Littoral Sud",
    estimatedCost: "15 000 000 FCFA",
    debtRatio: "24.8%",
    status: "Visite Terrain Programmée",
    date: "31 Août 2026",
  },
];

export default function BetRisquesActorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = betDossiers.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase()) ||
      d.expertBET.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G3
            </Badge>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent h-5 px-2 text-xs font-medium">
              Risques & Expertise BET
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Direction des Risques & Expertise BET
          </h1>
          <p className="text-sm text-muted-foreground">
            Évaluation de la solvabilité ménage, calcul du ratio d&apos;endettement COBAC, contre-expertise des devis et rapports de visite contradictoire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Rapport Risques
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={betRisquesKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par demandeur, N° DUC, BET ou projet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase 2 du Circuit CFC · Analyse Technique & Prudentielle</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Projet</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Expertise / BET Agréé</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Travaux</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Ratio Endettement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Avis Technique</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.project}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">{item.expertBET}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.estimatedCost}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className="font-mono text-xs font-medium h-5 px-2">
                      {item.debtRatio}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        item.status.includes("Validé") || item.status.includes("Conforme")
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
                          : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 h-5 px-2 text-xs font-medium"
                      }
                    >
                      {item.status}
                    </Badge>
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
