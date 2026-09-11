"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const registryKpis: ActorKpiItem[] = [
  {
    title: "Radiations Effectuées (Mois)",
    value: "21",
    change: "31.2%",
    isPositive: true,
    previous: "16 radiations",
    period: "ce mois",
  },
  {
    title: "Certificats Libres Reçus",
    value: "18",
    change: "28.6%",
    isPositive: true,
    previous: "14 certificats",
    period: "sans aucune charge",
  },
  {
    title: "Conservations Traitées",
    value: "12",
    change: "20.0%",
    isPositive: true,
    previous: "10 services",
    period: "Yaoundé, Douala, etc.",
  },
  {
    title: "Délai Moyen Radiation",
    value: "6.2 jours",
    change: "17.3%",
    isPositive: true,
    previous: "7.5 jours",
    period: "cible ≤ 8j",
  },
  {
    title: "En Attente Quittance Fiscale",
    value: "3",
    change: "40.0%",
    isPositive: true,
    previous: "5 dossiers",
    period: "régularisation timbre",
  },
];

const registryRecords = [
  {
    id: "rad1",
    ref: "RAD-MINDCAF-2026-0094",
    landTitle: "TF N° 6120/Mfoundi",
    location: "Mfoundi (Yaoundé Centre)",
    client: "KAMGA Pascal",
    initialEntry: "Vol. 142, Folio 89, Inscription N° 12",
    status: "Radiation Portée au Livre Foncier",
    date: "02 Septembre 2026",
  },
  {
    id: "rad2",
    ref: "RAD-MINDCAF-2026-0093",
    landTitle: "TF N° 9415/Wouri",
    location: "Wouri (Douala Bonanjo)",
    client: "TCHATCHOUANG Hélène",
    initialEntry: "Vol. 208, Folio 34, Inscription N° 05",
    status: "Radiation Portée au Livre Foncier",
    date: "01 Septembre 2026",
  },
  {
    id: "rad3",
    ref: "RAD-MINDCAF-2026-0092",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    location: "Méfou-et-Afamba (Mfou)",
    client: "MVONDO Albert",
    initialEntry: "Vol. 88, Folio 12, Inscription N° 03",
    status: "En cours d'instruction",
    date: "28 Août 2026",
  },
  {
    id: "rad4",
    ref: "RAD-MINDCAF-2026-0091",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    location: "Nyong-et-So'o (Mbalmayo)",
    client: "FOUDA Bernadette",
    initialEntry: "Vol. 62, Folio 45, Inscription N° 08",
    status: "Quittance Fiscale Validée",
    date: "26 Août 2026",
  },
  {
    id: "rad5",
    ref: "RAD-MINDCAF-2026-0090",
    landTitle: "TF N° 4118/Sanaga-Maritime",
    location: "Sanaga-Maritime (Edéa)",
    client: "BASSOMGBEN Jean",
    initialEntry: "Vol. 75, Folio 19, Inscription N° 04",
    status: "Radiation Portée au Livre Foncier",
    date: "24 Août 2026",
  },
  {
    id: "rad6",
    ref: "RAD-MINDCAF-2026-0089",
    landTitle: "TF N° 8210/Menoua",
    location: "Menoua (Dschang)",
    client: "NGUEMO Paul",
    initialEntry: "Vol. 94, Folio 50, Inscription N° 09",
    status: "En attente quittance",
    date: "20 Août 2026",
  },
];

const registryStatusStyles: Record<string, string> = {
  "Radiation Portée au Livre Foncier": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Quittance Fiscale Validée": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En cours d'instruction": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "En attente quittance": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

export default function MortgageRegistryPage() {
  const [search, setSearch] = React.useState("");

  const filtered = registryRecords.filter(
    (r) =>
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.ref.toLowerCase().includes(search.toLowerCase()) ||
      r.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Radiation Cadastre MINDCAF
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Radiation des Hypothèques au Cadastre (MINDCAF)
          </h1>
          <p className="text-sm text-muted-foreground">
            Dépôt des actes de mainlevée auprès des Conservations Foncières, radiation définitive des inscriptions au Livre Foncier et obtention des certificats de propriété vierges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Réquisitions Radiation
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={registryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, Titre Foncier, propriétaire ou conservation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Purge définitive des sûretés réelles au Livre Foncier Départemental</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Radiation</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier (TF)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Conservation Foncière</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Propriétaire Foncier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Inscription Initiale</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Radiation</TableHead>
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
                    <Badge variant="secondary" className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200 border-transparent">
                      {item.landTitle}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
                    <span className="truncate block">{item.location}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
                    {item.client}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
                    {item.initialEntry}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${registryStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
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
