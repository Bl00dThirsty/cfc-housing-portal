"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const geotechKpis: ActorKpiItem[] = [
  {
    title: "Parcelles Analysées (Mois)",
    value: "142",
    change: "16.4%",
    isPositive: true,
    previous: "122 parcelles",
    period: "ce mois",
  },
  {
    title: "Zones à Risque Écartées",
    value: "11",
    change: "15.4%",
    isPositive: true,
    previous: "13",
    period: "zones inondables/pentes",
  },
  {
    title: "Taux Conformité POS / PDU",
    value: "94.2%",
    change: "2.1%",
    isPositive: true,
    previous: "92.1%",
    period: "certificats d'urbanisme",
  },
  {
    title: "Études de Sol Exigées",
    value: "28",
    change: "7.7%",
    isPositive: false,
    previous: "26",
    period: "sols compressibles",
  },
  {
    title: "Délai Avis Géotechnique",
    value: "1.8 jour",
    change: "14.3%",
    isPositive: true,
    previous: "2.1 jours",
    period: "cible ≤ 2j",
  },
];

const geotechRecords = [
  {
    id: "geo1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    location: "Olembé (Yaoundé II)",
    soilType: "Latérite compacte",
    pduZoning: "Zone R1 (Habitat Individuel)",
    riskIndex: "Faible",
    recommendation: "Fondations standards (Semelles filantes)",
    date: "Aujourd'hui, 10:15",
  },
  {
    id: "geo2",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    location: "Bonapriso (Douala I)",
    soilType: "Sableux / Nappe phréatique haute",
    pduZoning: "Zone R3 (Immeubles Collectifs)",
    riskIndex: "Modéré",
    recommendation: "Radier généralisé étanche préconisé",
    date: "Hier, 16:30",
  },
  {
    id: "geo3",
    ducId: "CFC-2026-DUC-04840",
    client: "ATANGANA Thérèse",
    location: "Mbankolo (Yaoundé II)",
    soilType: "Versant collineux / Pente > 20%",
    pduZoning: "Zone R1 (Protection Pentes)",
    riskIndex: "Élevé",
    recommendation: "Étude géotechnique G2 obligatoire",
    date: "02 Sept 2026",
  },
  {
    id: "geo4",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    location: "Kribi Ville (Zone Portuaire)",
    soilType: "Arénacé limoneux",
    pduZoning: "Zone PDU Extension Urbaine",
    riskIndex: "Faible",
    recommendation: "Fondations superficielles admises",
    date: "01 Sept 2026",
  },
  {
    id: "geo5",
    ducId: "CFC-2026-DUC-04877",
    client: "ZRA Gabriel",
    location: "Maroua Djarengol",
    soilType: "Argile gonflante (Vertisol)",
    pduZoning: "Zone R1 Résidentielle",
    riskIndex: "Modéré",
    recommendation: "Longrines armées anti-dessiccation",
    date: "30 Août 2026",
  },
  {
    id: "geo6",
    ducId: "CFC-2026-DUC-04899",
    client: "EBOGO Laurent",
    location: "Biyem-Assi Bas-fonds",
    soilType: "Alluvions marécageuses",
    pduZoning: "Servitude naturelle non aedificandi",
    riskIndex: "Critique",
    recommendation: "Refus technique : Zone inconstructible",
    date: "28 Août 2026",
  },
];

const riskStyles: Record<string, string> = {
  "Faible": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Modéré": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Élevé": "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Critique": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function GeotechUrbanPage() {
  const [search, setSearch] = React.useState("");

  const filtered = geotechRecords.filter(
    (g) =>
      g.client.toLowerCase().includes(search.toLowerCase()) ||
      g.ducId.toLowerCase().includes(search.toLowerCase()) ||
      g.location.toLowerCase().includes(search.toLowerCase()) ||
      g.soilType.toLowerCase().includes(search.toLowerCase()) ||
      g.pduZoning.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Sécurité Foncière &amp; Sols
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Scoring Géotechnique &amp; Conformité Urbaine
          </h1>
          <p className="text-sm text-muted-foreground">
            Évaluation des risques naturels (inondation, éboulement, glissement), portance du terrain et conformité au Plan d&apos;Occupation des Sols (POS/PDU).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Fiches Sols
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={geotechKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur, N° DUC, localisation ou nature du sol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Plans d&apos;Urbanisme Directeurs (MINDDUH) &amp; Données Géologiques</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Parcelle</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Nature du Sol</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Zonage POS / PDU</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Niveau Risque</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Recommandation BET</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Avis</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
                    {item.soilType}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[160px]">
                    <span className="truncate block">{item.pduZoning}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center">
                    <Badge
                      variant="secondary"
                      className={`${riskStyles[item.riskIndex] ?? ""} h-5 px-2 text-xs font-semibold border-transparent`}
                    >
                      {item.riskIndex}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[200px]">
                    <span className="truncate block">{item.recommendation}</span>
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
