"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const insuranceKpis: ActorKpiItem[] = [
  {
    title: "Polices d'Assurance Actives",
    value: "1 120",
    change: "12.0%",
    isPositive: true,
    previous: "1 000 polices",
    period: "portefeuille DUC",
  },
  {
    title: "Taux de Couverture ADI",
    value: "98.8%",
    change: "0.6%",
    isPositive: true,
    previous: "98.2%",
    period: "Assurance Décès-Invalidité",
  },
  {
    title: "Capitaux Assurés Cumulés",
    value: "28,4 Mds FCFA",
    change: "16.4%",
    isPositive: true,
    previous: "24,4 Mds FCFA",
    period: "garanties sinistres",
  },
  {
    title: "Sinistres Déclarés (Mois)",
    value: "3",
    change: "0.0%",
    isPositive: true,
    previous: "3 dossiers",
    period: "indemnisation en cours",
  },
  {
    title: "Polices en Renouvellement",
    value: "24",
    change: "20.0%",
    isPositive: true,
    previous: "30",
    period: "primes annuelles",
  },
];

const insuranceRecords = [
  {
    id: "ins1",
    ref: "POL-AXA-2026-0489",
    client: "TCHOUNGUI Alain",
    ducId: "CFC-2026-DUC-04590",
    insurer: "AXA Assurances Cameroun",
    coverageType: "ADI (Décès-Invalidité) + Incendie",
    insuredCapital: "22 000 000 FCFA",
    annualPremium: "115 000 FCFA",
    status: "Attestation Validée",
    expiryDate: "30 Juin 2027",
  },
  {
    id: "ins2",
    ref: "POL-ACT-2026-0120",
    client: "ENOW George",
    ducId: "CFC-2026-DUC-04612",
    insurer: "Activa Assurances",
    coverageType: "Tous Risques Chantier (TRC)",
    insuredCapital: "18 000 000 FCFA",
    annualPremium: "140 000 FCFA",
    status: "Attestation Validée",
    expiryDate: "15 Mars 2027",
  },
  {
    id: "ins3",
    ref: "POL-CHA-2026-0834",
    client: "MANGA Estelle",
    ducId: "CFC-2026-DUC-04678",
    insurer: "Chanas Assurances",
    coverageType: "ADI (Décès-Invalidité)",
    insuredCapital: "14 500 000 FCFA",
    annualPremium: "82 000 FCFA",
    status: "Attestation Validée",
    expiryDate: "10 Sept 2027",
  },
  {
    id: "ins4",
    ref: "POL-SAA-2026-0312",
    client: "KOUAM Roger",
    ducId: "CFC-2026-DUC-04701",
    insurer: "Saar Assurances",
    coverageType: "Multirisque Habitation + Incendie",
    insuredCapital: "26 000 000 FCFA",
    annualPremium: "98 000 FCFA",
    status: "En attente prime",
    expiryDate: "30 Sept 2026",
  },
  {
    id: "ins5",
    ref: "POL-BOC-2026-0195",
    client: "EBODE Joseph",
    ducId: "CFC-2025-DUC-03912",
    insurer: "Beneficial Life Insurance",
    coverageType: "ADI (Décès-Invalidité)",
    insuredCapital: "12 000 000 FCFA",
    annualPremium: "65 000 FCFA",
    status: "Sinistre en Cours",
    expiryDate: "Instruction Recours",
  },
  {
    id: "ins6",
    ref: "POL-AXA-2025-0922",
    client: "TABI Robert",
    ducId: "CFC-2025-DUC-03844",
    insurer: "AXA Assurances Cameroun",
    coverageType: "Incendie & Éléments Naturels",
    insuredCapital: "15 000 000 FCFA",
    annualPremium: "75 000 FCFA",
    status: "Expirée (Relance)",
    expiryDate: "15 Août 2026",
  },
];

const insuranceStatusStyles: Record<string, string> = {
  "Attestation Validée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En attente prime": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Sinistre en Cours": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Expirée (Relance)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function InsurancesPage() {
  const [search, setSearch] = React.useState("");

  const filtered = insuranceRecords.filter(
    (i) =>
      i.client.toLowerCase().includes(search.toLowerCase()) ||
      i.ref.toLowerCase().includes(search.toLowerCase()) ||
      i.ducId.toLowerCase().includes(search.toLowerCase()) ||
      i.insurer.toLowerCase().includes(search.toLowerCase()) ||
      i.coverageType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G8
            </Badge>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Couverture Risques Sinistres
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Assurances Emprunteurs — Décès, Incendie &amp; TRC
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des polices d&apos;assurance déléguées au profit du CFC : Assurance Décès-Invalidité (ADI), Incendie Bâtiment et Tous Risques Chantier (TRC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Portefeuille Assurances
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={insuranceKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par police, emprunteur, N° DUC ou compagnie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Délégation d&apos;indemnité subrogatoire en faveur du Crédit Foncier du Cameroun</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Police</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur Assuré</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Compagnie d&apos;Assurance</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Type de Couverture</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Capital Garanti</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Adhésion</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Échéance</TableHead>
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
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">
                    {item.insurer}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
                    <span className="truncate block">{item.coverageType}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.insuredCapital}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${insuranceStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.expiryDate}
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
