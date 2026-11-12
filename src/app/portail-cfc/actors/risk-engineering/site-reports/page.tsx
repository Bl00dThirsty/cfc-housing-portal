"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const siteReportsKpis: ActorKpiItem[] = [
  {
    title: "Visites Réalisées (Mois)",
    value: "118",
    change: "14.2%",
    isPositive: true,
    previous: "103",
    period: "ce mois",
  },
  {
    title: "Taux d'Avancement Moyen",
    value: "54.2%",
    change: "6.8%",
    isPositive: true,
    previous: "47.4%",
    period: "chantiers suivis",
  },
  {
    title: "PV avec Réserves",
    value: "19",
    change: "15.0%",
    isPositive: false,
    previous: "22",
    period: "taux 16.1%",
  },
  {
    title: "Délai Rédaction PV",
    value: "2.1 jours",
    change: "8.7%",
    isPositive: true,
    previous: "2.3 jours",
    period: "cible ≤ 3j",
  },
  {
    title: "Chantiers Suspendus",
    value: "4",
    change: "20.0%",
    isPositive: true,
    previous: "5",
    period: "anomalies majeures",
  },
];

const siteReports = [
  {
    id: "r1",
    ref: "RVC-2026-00382",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    project: "Construction Villa R+1 (Olembé)",
    inspector: "Ing. Lucien Fame (BET Epsilon)",
    stage: "Gros Œuvre R+1",
    progress: 65,
    status: "Favorable",
    date: "Aujourd'hui, 11:30",
  },
  {
    id: "r2",
    ref: "RVC-2026-00381",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    inspector: "Cabinet BET Ingénierie",
    stage: "Fondations & Radier",
    progress: 25,
    status: "Avec réserves",
    date: "Hier, 15:45",
  },
  {
    id: "r3",
    ref: "RVC-2026-00380",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    project: "Logement Individuel (Kribi)",
    inspector: "BET Littoral Sud",
    stage: "Toiture & Charpente",
    progress: 80,
    status: "Favorable",
    date: "Hier, 10:15",
  },
  {
    id: "r4",
    ref: "RVC-2026-00379",
    ducId: "CFC-2026-DUC-04902",
    client: "BELINGA Sophie",
    project: "Extension Pavillon (Mvan)",
    inspector: "Direction Technique CFC",
    stage: "Second Œuvre & Finitions",
    progress: 92,
    status: "Favorable",
    date: "02 Sept 2026",
  },
  {
    id: "r5",
    ref: "RVC-2026-00378",
    ducId: "CFC-2026-DUC-04918",
    client: "KAMGA Roger",
    project: "Duplex Moderne (Bastos)",
    inspector: "Cabinet Polytech Sarl",
    stage: "Élévation Murs RDC",
    progress: 40,
    status: "Suspendu",
    date: "01 Sept 2026",
  },
  {
    id: "r6",
    ref: "RVC-2026-00377",
    ducId: "CFC-2026-DUC-04930",
    client: "ONANA David",
    project: "Villa Plain-Pied (Soa)",
    inspector: "Ing. Lucien Fame (BET Epsilon)",
    stage: "Coulage Dalle RDC",
    progress: 50,
    status: "Favorable",
    date: "31 Août 2026",
  },
];

const reportStatusStyles: Record<string, string> = {
  "Favorable": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Avec réserves": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Suspendu": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function SiteReportsPage() {
  const [search, setSearch] = React.useState("");

  const filtered = siteReports.filter(
    (r) =>
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.ref.toLowerCase().includes(search.toLowerCase()) ||
      r.ducId.toLowerCase().includes(search.toLowerCase()) ||
      r.inspector.toLowerCase().includes(search.toLowerCase()) ||
      r.project.toLowerCase().includes(search.toLowerCase())
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
              Contrôle Terrain
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Rapports de Visite Chantier &amp; Inspections
          </h1>
          <p className="text-sm text-muted-foreground">
            Constats contradictoires sur site, taux d&apos;avancement des travaux, levée des réserves et conformité au devis approuvé.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export PV Visites
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={siteReportsKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, emprunteur, N° DUC ou inspecteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Contrôle d&apos;avancement physique préalable aux déblocages de tranches</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Rapport</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Projet</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Inspecteur / Cabinet BET</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Stade des Travaux</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Avancement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Avis PV</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Visite</TableHead>
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
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.project}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[180px]">
                    <span className="truncate block">{item.inspector}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
                    {item.stage}
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
                      className={`${reportStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.date}
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
