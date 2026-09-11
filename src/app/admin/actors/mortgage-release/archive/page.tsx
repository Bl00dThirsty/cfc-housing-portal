"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const archiveKpis: ActorKpiItem[] = [
  {
    title: "Dossiers DUC Clôturés (Mois)",
    value: "24",
    change: "20.0%",
    isPositive: true,
    previous: "20 dossiers",
    period: "cycle de vie achevé",
  },
  {
    title: "Taux Numérisation Complète",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "GED intègre & scellée",
  },
  {
    title: "Volume d'Archives GED",
    value: "45 Go",
    change: "8.5%",
    isPositive: true,
    previous: "41.5 Go",
    period: "coffre numérique",
  },
  {
    title: "Audits de Clôture Validés",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "conformité COBAC",
  },
  {
    title: "Prescription Légale OHADA",
    value: "30 ans",
    change: "0.0%",
    isPositive: true,
    previous: "30 ans",
    period: "durée d'archivage",
  },
];

const archiveRecords = [
  {
    id: "arc1",
    ducId: "CFC-2026-DUC-03890",
    client: "KAMGA Pascal",
    profession: "Commerçant Import-Export",
    totalLoan: "15 000 000 FCFA",
    loanDuration: "15 ans (2011 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0812 / Rayon E-14",
    status: "Dossier Scellé & Archivé",
    closureDate: "02 Septembre 2026",
  },
  {
    id: "arc2",
    ducId: "CFC-2026-DUC-03912",
    client: "TCHATCHOUANG Hélène",
    profession: "Cadre Paramédical",
    totalLoan: "28 000 000 FCFA",
    loanDuration: "10 ans (2016 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0811 / Rayon B-08",
    status: "Dossier Scellé & Archivé",
    closureDate: "01 Septembre 2026",
  },
  {
    id: "arc3",
    ducId: "CFC-2026-DUC-03945",
    client: "MVONDO Albert",
    profession: "Enseignant Retraité",
    totalLoan: "12 000 000 FCFA",
    loanDuration: "20 ans (2006 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0810 / Rayon D-02",
    status: "En cours de numérisation finale",
    closureDate: "28 Août 2026",
  },
  {
    id: "arc4",
    ducId: "CFC-2026-DUC-03980",
    client: "FOUDA Bernadette",
    profession: "Fonctionnaire MINFI",
    totalLoan: "9 500 000 FCFA",
    loanDuration: "12 ans (2014 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0809 / Rayon A-19",
    status: "Visa Audit Final",
    closureDate: "26 Août 2026",
  },
  {
    id: "arc5",
    ducId: "CFC-2025-DUC-03410",
    client: "BASSOMGBEN Jean",
    profession: "Ingénieur Télécoms",
    totalLoan: "18 000 000 FCFA",
    loanDuration: "15 ans (2010 - 2025)",
    gedArchiveCode: "GED-ARCH-2025-0640 / Rayon C-11",
    status: "Dossier Scellé & Archivé",
    closureDate: "15 Août 2026",
  },
  {
    id: "arc6",
    ducId: "CFC-2025-DUC-03150",
    client: "NGUEMO Paul",
    profession: "Agriculteur Exploitant",
    totalLoan: "14 000 000 FCFA",
    loanDuration: "18 ans (2007 - 2025)",
    gedArchiveCode: "GED-ARCH-2025-0588 / Rayon F-05",
    status: "Dossier Scellé & Archivé",
    closureDate: "10 Août 2026",
  },
];

const archiveStatusStyles: Record<string, string> = {
  "Dossier Scellé & Archivé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Visa Audit Final": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En cours de numérisation finale": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function ReleaseArchivePage() {
  const [search, setSearch] = React.useState("");

  const filtered = archiveRecords.filter(
    (a) =>
      a.client.toLowerCase().includes(search.toLowerCase()) ||
      a.ducId.toLowerCase().includes(search.toLowerCase()) ||
      a.profession.toLowerCase().includes(search.toLowerCase()) ||
      a.gedArchiveCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G4
            </Badge>
            <Badge variant="secondary" className="bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-transparent h-5 px-2 text-xs font-medium">
              Archivage Légal &amp; Audit
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Clôture Définitive &amp; Archivage DUC (GED)
          </h1>
          <p className="text-sm text-muted-foreground">
            Clôture comptable dans Carthago, scellement numérique du Dossier Unique Client (DUC) et archivage patrimonial sécurisé conforme aux normes OHADA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Répertoire Clôtures
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={archiveKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par N° DUC, emprunteur, cote GED ou profession..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Conservation patrimoniale trentenaire · Intégrité et traçabilité certifiées</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Prêt Historique</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Cycle de Vie du Prêt</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Cote GED &amp; Rayonnage</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Scellement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Clôture</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-slate-500/15 text-slate-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.profession}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.totalLoan}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.loanDuration}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-mono text-foreground max-w-[200px]">
                    <span className="truncate block">{item.gedArchiveCode}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${archiveStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.closureDate}
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
