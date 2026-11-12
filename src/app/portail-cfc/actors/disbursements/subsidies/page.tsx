"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const subsidiesKpis: ActorKpiItem[] = [
  {
    title: "Prêts Bonifiés Gérés",
    value: "580",
    change: "13.7%",
    isPositive: true,
    previous: "510 prêts",
    period: "fonctionnaires & modestes",
  },
  {
    title: "Subvention Reçue MINFI",
    value: "485 M FCFA",
    change: "18.3%",
    isPositive: true,
    previous: "410 M FCFA",
    period: "dotation budgétaire",
  },
  {
    title: "Bonification Moyenne",
    value: "2.5%",
    change: "0.0%",
    isPositive: true,
    previous: "2.5% l'an",
    period: "prise en charge État",
  },
  {
    title: "Économie par Emprunteur",
    value: "38 500 FCFA",
    change: "4.1%",
    isPositive: true,
    previous: "37 000 FCFA",
    period: "gain mensuel moyen",
  },
  {
    title: "Conformité Déclaratifs MINFI",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "audit budgétaire",
  },
];

const subsidyRecords = [
  {
    id: "sub1",
    ref: "BONIF-MINFI-2026-0182",
    client: "EBAH Rodrigue",
    category: "Enseignant Enseignement Supérieur (A2)",
    ducId: "CFC-2026-DUC-04410",
    loanAmount: "18 000 000 FCFA",
    rateStructure: "Nominal 7.0% → Client 4.5%",
    stateShareMonthly: "37 500 FCFA",
    status: "Bonification Validée",
    startDate: "01 Sept 2026",
  },
  {
    id: "sub2",
    ref: "BONIF-MINFI-2026-0181",
    client: "NDAM Oumarou",
    category: "Fonctionnaire Cadre B1 (Santé)",
    ducId: "CFC-2026-DUC-04480",
    loanAmount: "15 000 000 FCFA",
    rateStructure: "Nominal 6.8% → Client 4.3%",
    stateShareMonthly: "31 250 FCFA",
    status: "Bonification Validée",
    startDate: "15 Août 2026",
  },
  {
    id: "sub3",
    ref: "BONIF-MINFI-2026-0180",
    client: "BEKONO Suzanne",
    category: "Institutrice Enseignement Primaire",
    ducId: "CFC-2026-DUC-04515",
    loanAmount: "12 800 000 FCFA",
    rateStructure: "Nominal 6.5% → Client 4.0%",
    stateShareMonthly: "26 670 FCFA",
    status: "Bonification Validée",
    startDate: "01 Août 2026",
  },
  {
    id: "sub4",
    ref: "BONIF-MINFI-2026-0179",
    client: "SONG Emmanuel",
    category: "Agent Contractuel d'Administration",
    ducId: "CFC-2026-DUC-04530",
    loanAmount: "8 000 000 FCFA",
    rateStructure: "Nominal 7.0% → Client 4.5%",
    stateShareMonthly: "16 670 FCFA",
    status: "En attente dotation",
    startDate: "01 Octobre 2026",
  },
  {
    id: "sub5",
    ref: "BONIF-MINFI-2026-0178",
    client: "ASSOMO Claire",
    category: "Personnel Paramédical",
    ducId: "CFC-2026-DUC-04795",
    loanAmount: "6 200 000 FCFA",
    rateStructure: "Nominal 6.5% → Client 4.0%",
    stateShareMonthly: "12 920 FCFA",
    status: "Bonification Validée",
    startDate: "15 Juillet 2026",
  },
  {
    id: "sub6",
    ref: "BONIF-MINFI-2025-0142",
    client: "TCHOUPO Joseph",
    category: "Cadre Retraité Fonction Publique",
    ducId: "CFC-2023-DUC-00980",
    loanAmount: "22 000 000 FCFA",
    rateStructure: "Nominal 7.0% → Client 4.5%",
    stateShareMonthly: "0 FCFA",
    status: "Clôturé (Prêt Soldé)",
    startDate: "Prêt Terminé",
  },
];

const subsidyStatusStyles: Record<string, string> = {
  "Bonification Validée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En attente dotation": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Clôturé (Prêt Soldé)": "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

export default function SubsidiesPage() {
  const [search, setSearch] = React.useState("");

  const filtered = subsidyRecords.filter(
    (s) =>
      s.client.toLowerCase().includes(search.toLowerCase()) ||
      s.ref.toLowerCase().includes(search.toLowerCase()) ||
      s.ducId.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Bonification État &amp; MINFI
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Comptabilité des Prêts Bonifiés &amp; Subventions État
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion des différentiels de taux pris en charge par le Ministère des Finances (MINFI) en faveur de l&apos;habitat social et reporting déclaratif trimestriel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Déclaratif MINFI
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={subsidiesKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, bénéficiaire, corps ou N° DUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Subvention de l&apos;État du Cameroun au titre de l&apos;accès au logement décent</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Bonification</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Corps de Métier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Prêt</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Structure Taux (Nominal → Client)</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Prise en Charge État</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut MINFI</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Effet</TableHead>
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
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.category}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.loanAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
                    {item.rateStructure}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {item.stateShareMonthly}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${subsidyStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.startDate}
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
