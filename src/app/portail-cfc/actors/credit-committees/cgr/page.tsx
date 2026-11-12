"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const cgrKpis: ActorKpiItem[] = [
  {
    title: "Dossiers Examinés CGR (Mois)",
    value: "34",
    change: "13.3%",
    isPositive: true,
    previous: "30 dossiers",
    period: "ce mois",
  },
  {
    title: "Taux d'Approbation CGR",
    value: "79.4%",
    change: "3.1%",
    isPositive: true,
    previous: "76.3%",
    period: "avec conditions",
  },
  {
    title: "Montant Total Débattu",
    value: "980 M FCFA",
    change: "18.5%",
    isPositive: true,
    previous: "827 M FCFA",
    period: "ce mois",
  },
  {
    title: "Dérogations Autorisées",
    value: "6",
    change: "25.0%",
    isPositive: true,
    previous: "8 dérogations",
    period: "encadrement strict",
  },
  {
    title: "Délai Moyen Décision",
    value: "3.2 jours",
    change: "15.8%",
    isPositive: true,
    previous: "3.8 jours",
    period: "cible ≤ 4j",
  },
];

const cgrRecords = [
  {
    id: "cgr1",
    ref: "CGR-2026-S09-01",
    ducId: "CFC-2026-DUC-04712",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Douala)",
    reason: "Montant > 25M FCFA & Ratio 31.8%",
    requestedAmount: "28 000 000 FCFA",
    approvedAmount: "25 000 000 FCFA",
    quorum: "Unanimité (5/5)",
    decision: "Accordé avec réserve",
    sessionDate: "Séance du 02 Sept 2026",
  },
  {
    id: "cgr2",
    ref: "CGR-2026-S09-02",
    ducId: "CFC-2026-DUC-04780",
    client: "BILOA Jean-Baptiste",
    project: "Autoconstruction Sociale (Olembé)",
    reason: "Apport personnel atypique (15%)",
    requestedAmount: "8 500 000 FCFA",
    approvedAmount: "8 500 000 FCFA",
    quorum: "Majorité (4/5)",
    decision: "Accordé",
    sessionDate: "Séance du 02 Sept 2026",
  },
  {
    id: "cgr3",
    ref: "CGR-2026-S09-03",
    ducId: "CFC-2026-DUC-04815",
    client: "KOUAM Jeanne",
    project: "Résidence Pavillonnaire (Bafoussam)",
    reason: "Hypothèque second rang proposée",
    requestedAmount: "16 000 000 FCFA",
    approvedAmount: "En attente",
    quorum: "Ajourné (3/5)",
    decision: "Complément Requis",
    sessionDate: "Séance du 02 Sept 2026",
  },
  {
    id: "cgr4",
    ref: "CGR-2026-S08-14",
    ducId: "CFC-2026-DUC-04822",
    client: "TANYI George",
    project: "Complexe Commercial (Limbe)",
    reason: "Dépassement ratio COBAC (> 35%)",
    requestedAmount: "38 000 000 FCFA",
    approvedAmount: "0 FCFA",
    quorum: "Unanimité (5/5)",
    decision: "Refusé",
    sessionDate: "Séance du 28 Août 2026",
  },
  {
    id: "cgr5",
    ref: "CGR-2026-S08-15",
    ducId: "CFC-2026-DUC-04845",
    client: "EBENGA Roger",
    project: "Villa Individuelle (Kribi)",
    reason: "Emprunteur Diaspora sans garant local",
    requestedAmount: "19 500 000 FCFA",
    approvedAmount: "19 500 000 FCFA",
    quorum: "Unanimité (5/5)",
    decision: "Accordé avec réserve",
    sessionDate: "Séance du 28 Août 2026",
  },
  {
    id: "cgr6",
    ref: "CGR-2026-S08-16",
    ducId: "CFC-2026-DUC-04860",
    client: "NGUEMA Patrick",
    project: "Habitat Écologique (Ebolowa)",
    reason: "Technologie bois non standard",
    requestedAmount: "11 000 000 FCFA",
    approvedAmount: "11 000 000 FCFA",
    quorum: "Majorité (4/5)",
    decision: "Accordé",
    sessionDate: "Séance du 26 Août 2026",
  },
];

const cgrDecisionStyles: Record<string, string> = {
  "Accordé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Accordé avec réserve": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Complément Requis": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Refusé": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function CgrPage() {
  const [search, setSearch] = React.useState("");

  const filtered = cgrRecords.filter(
    (c) =>
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.ref.toLowerCase().includes(search.toLowerCase()) ||
      c.ducId.toLowerCase().includes(search.toLowerCase()) ||
      c.project.toLowerCase().includes(search.toLowerCase()) ||
      c.reason.toLowerCase().includes(search.toLowerCase())
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
              Comité Gestion des Risques
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Comité de Gestion des Risques (CGR)
          </h1>
          <p className="text-sm text-muted-foreground">
            Examen collégial des demandes de financement présentant des dépassements de ratios d&apos;endettement COBAC, montants supérieurs à 25 millions FCFA ou garanties particulières.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export PV Séances CGR
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={cgrKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par séance, emprunteur, N° DUC ou motif CGR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Délibérations sous présidence de la Direction Générale &amp; Risques</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Séance</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Projet</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Motif Examen CGR</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Demandé</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Accordé</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Quorum</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Décision CGR</TableHead>
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
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.project}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px]">
                    <span className="truncate block">{item.reason}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {item.requestedAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.approvedAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                    {item.quorum}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${cgrDecisionStyles[item.decision] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.decision}
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
