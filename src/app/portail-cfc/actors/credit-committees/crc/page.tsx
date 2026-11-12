"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const crcKpis: ActorKpiItem[] = [
  {
    title: "Dossiers Traités CRC (Mois)",
    value: "26",
    change: "8.3%",
    isPositive: true,
    previous: "24 dossiers",
    period: "ce mois",
  },
  {
    title: "Créances Régularisées",
    value: "315 M FCFA",
    change: "24.0%",
    isPositive: true,
    previous: "254 M FCFA",
    period: "protocoles signés",
  },
  {
    title: "Recouvrement Amiable",
    value: "84.6%",
    change: "4.2%",
    isPositive: true,
    previous: "80.4%",
    period: "sans voie contentieuse",
  },
  {
    title: "Moratoire Moyen Accordé",
    value: "6.4 mois",
    change: "15.8%",
    isPositive: true,
    previous: "7.6 mois",
    period: "réduction des délais",
  },
  {
    title: "Transmis au Contentieux",
    value: "4",
    change: "33.3%",
    isPositive: true,
    previous: "6 dossiers",
    period: "recours judiciaire",
  },
];

const crcRecords = [
  {
    id: "crc1",
    ref: "CRC-2026-REC-089",
    client: "ETS MBIDA & FILS",
    ducId: "CFC-2024-DUC-01942",
    outstandingDebt: "42 500 000 FCFA",
    measureType: "Rééchelonnement sur 36 mois",
    expectedRecovery: "100%",
    decision: "Protocole Validé",
    date: "Séance du 03 Sept 2026",
  },
  {
    id: "crc2",
    ref: "CRC-2026-REC-090",
    client: "EKANE Martin",
    ducId: "CFC-2025-DUC-03118",
    outstandingDebt: "14 800 000 FCFA",
    measureType: "Moratoire de paiement 6 mois",
    expectedRecovery: "100%",
    decision: "Moratoire Accordé",
    date: "Séance du 03 Sept 2026",
  },
  {
    id: "crc3",
    ref: "CRC-2026-REC-091",
    client: "SOCIÉTÉ CIVILE IMMOBILIÈRE MVAN",
    ducId: "CFC-2023-DUC-00874",
    outstandingDebt: "88 000 000 FCFA",
    measureType: "Remise partielle pénalités retard",
    expectedRecovery: "85%",
    decision: "Protocole Validé",
    date: "Séance du 01 Sept 2026",
  },
  {
    id: "crc4",
    ref: "CRC-2026-REC-092",
    client: "NGANDO Pierre",
    ducId: "CFC-2024-DUC-02450",
    outstandingDebt: "19 200 000 FCFA",
    measureType: "Insolvabilité constatée / Saisie",
    expectedRecovery: "50%",
    decision: "Action Judiciaire",
    date: "Séance du 28 Août 2026",
  },
  {
    id: "crc5",
    ref: "CRC-2026-REC-093",
    client: "TCHOUPO Joseph",
    ducId: "CFC-2025-DUC-03480",
    outstandingDebt: "9 600 000 FCFA",
    measureType: "Reprise des mensualités + Acompte",
    expectedRecovery: "100%",
    decision: "Protocole Validé",
    date: "Séance du 26 Août 2026",
  },
  {
    id: "crc6",
    ref: "CRC-2026-REC-094",
    client: "ATANGANA Marcelle",
    ducId: "CFC-2024-DUC-01890",
    outstandingDebt: "24 000 000 FCFA",
    measureType: "Cession amiable bien immobilier",
    expectedRecovery: "92%",
    decision: "En Examen",
    date: "Séance du 25 Août 2026",
  },
];

const crcDecisionStyles: Record<string, string> = {
  "Protocole Validé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Moratoire Accordé": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En Examen": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Action Judiciaire": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function CrcPage() {
  const [search, setSearch] = React.useState("");

  const filtered = crcRecords.filter(
    (c) =>
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.ref.toLowerCase().includes(search.toLowerCase()) ||
      c.ducId.toLowerCase().includes(search.toLowerCase()) ||
      c.measureType.toLowerCase().includes(search.toLowerCase())
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
              Règlement des Créances
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Comité de Règlement des Créances (CRC)
          </h1>
          <p className="text-sm text-muted-foreground">
            Supervision des restructurations de créances immobilières, moratoires d&apos;apurement, protocoles transactionnels et remises exceptionnelles de pénalités.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Protocoles CRC
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={crcKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, débiteur, N° DUC ou mesure proposée..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Traitement amiable des dossiers en souffrance &amp; prévention des contentieux</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Dossier CRC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Débiteur / Porteur de Dette</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Encours Exigible</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Mesure de Restructuration</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Taux Recouvrement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Décision CRC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Séance</TableHead>
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
                  <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
                    {item.client}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.outstandingDebt}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[200px]">
                    <span className="truncate block">{item.measureType}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono text-xs font-semibold text-foreground">
                    {item.expectedRecovery}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${crcDecisionStyles[item.decision] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.decision}
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
