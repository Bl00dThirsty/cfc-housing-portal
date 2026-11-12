"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const scheduleKpis: ActorKpiItem[] = [
  {
    title: "Échéanciers Actifs",
    value: "1 840",
    change: "8.2%",
    isPositive: true,
    previous: "1 700 prêts",
    period: "en amortissement",
  },
  {
    title: "Mensualités Encaissées",
    value: "342 M FCFA",
    change: "9.6%",
    isPositive: true,
    previous: "312 M FCFA",
    period: "ce mois",
  },
  {
    title: "Prêts en Période Différé",
    value: "148",
    change: "10.4%",
    isPositive: true,
    previous: "134 dossiers",
    period: "différé travaux 12-24m",
  },
  {
    title: "Remboursements Anticipés",
    value: "14",
    change: "16.7%",
    isPositive: true,
    previous: "12 dossiers",
    period: "ce trimestre",
  },
  {
    title: "Taux Moyen Portefeuille",
    value: "5.85%",
    change: "0.15%",
    isPositive: true,
    previous: "6.00%",
    period: "mix bonifié / standard",
  },
];

const scheduleRecords = [
  {
    id: "sch1",
    ref: "AMORT-2026-00912",
    client: "EBAH Rodrigue",
    ducId: "CFC-2026-DUC-04410",
    initialPrincipal: "18 000 000 FCFA",
    durationGrace: "20 ans · Différé 12m",
    monthlyPayment: "124 500 FCFA",
    remainingBalance: "18 000 000 FCFA",
    status: "En Période Différé",
    nextDueDate: "05 Octobre 2026",
  },
  {
    id: "sch2",
    ref: "AMORT-2026-00911",
    client: "NDAM Oumarou",
    ducId: "CFC-2026-DUC-04480",
    initialPrincipal: "15 000 000 FCFA",
    durationGrace: "15 ans · Sans différé",
    monthlyPayment: "130 800 FCFA",
    remainingBalance: "14 620 000 FCFA",
    status: "En Cours Normal",
    nextDueDate: "30 Septembre 2026",
  },
  {
    id: "sch3",
    ref: "AMORT-2025-00745",
    client: "BEKONO Suzanne",
    ducId: "CFC-2026-DUC-04515",
    initialPrincipal: "12 800 000 FCFA",
    durationGrace: "25 ans · Sans différé",
    monthlyPayment: "67 500 FCFA",
    remainingBalance: "12 140 000 FCFA",
    status: "En Cours Normal",
    nextDueDate: "05 Octobre 2026",
  },
  {
    id: "sch4",
    ref: "AMORT-2024-00412",
    client: "SONG Emmanuel",
    ducId: "CFC-2026-DUC-04530",
    initialPrincipal: "8 000 000 FCFA",
    durationGrace: "10 ans · Sans différé",
    monthlyPayment: "88 900 FCFA",
    remainingBalance: "6 250 000 FCFA",
    status: "En Cours Normal",
    nextDueDate: "25 Septembre 2026",
  },
  {
    id: "sch5",
    ref: "AMORT-2023-00210",
    client: "TCHOUPO Joseph",
    ducId: "CFC-2023-DUC-00980",
    initialPrincipal: "22 000 000 FCFA",
    durationGrace: "15 ans · Sans différé",
    monthlyPayment: "191 400 FCFA",
    remainingBalance: "0 FCFA",
    status: "Soldé par Anticipation",
    nextDueDate: "Prêt Clôturé",
  },
  {
    id: "sch6",
    ref: "AMORT-2025-00620",
    client: "ATANGANA Marcelle",
    ducId: "CFC-2025-DUC-03210",
    initialPrincipal: "25 000 000 FCFA",
    durationGrace: "20 ans · Différé 24m",
    monthlyPayment: "172 800 FCFA",
    remainingBalance: "25 000 000 FCFA",
    status: "En Période Différé",
    nextDueDate: "05 Novembre 2026",
  },
];

const scheduleStatusStyles: Record<string, string> = {
  "En Cours Normal": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En Période Différé": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Soldé par Anticipation": "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

export default function SchedulesPage() {
  const [search, setSearch] = React.useState("");

  const filtered = scheduleRecords.filter(
    (s) =>
      s.client.toLowerCase().includes(search.toLowerCase()) ||
      s.ref.toLowerCase().includes(search.toLowerCase()) ||
      s.ducId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G7
            </Badge>
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Gestion Actif-Passif
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tableaux d&apos;Amortissement &amp; Échéanciers
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcul actuariel des échéanciers de prêt, suivi des différés d&apos;amortissement en phase travaux, ventilation capital/intérêts et gestion des remboursements anticipés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Échéanciers Actifs
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={scheduleKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence échéancier, emprunteur ou N° DUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Amortissement constant &amp; annuités constantes · Core Banking Carthago</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Échéancier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Capital Prêté</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Durée &amp; Différé</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Mensualité</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Capital Restant Dû</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Prêt</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Prochaine Échéance</TableHead>
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
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-teal-500/15 text-teal-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-medium text-xs text-muted-foreground">
                    {item.initialPrincipal}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">
                    {item.durationGrace}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.monthlyPayment}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.remainingBalance}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${scheduleStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.nextDueDate}
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
