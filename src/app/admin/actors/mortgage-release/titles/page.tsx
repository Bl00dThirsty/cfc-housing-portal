"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const titlesKpis: ActorKpiItem[] = [
  {
    title: "Titres Déconsignés (Mois)",
    value: "19",
    change: "26.7%",
    isPositive: true,
    previous: "15 titres",
    period: "ce mois",
  },
  {
    title: "Remis en Mains Propres",
    value: "16",
    change: "33.3%",
    isPositive: true,
    previous: "12 décharges",
    period: "procès-verbaux signés",
  },
  {
    title: "Titres Restants en Coffre",
    value: "2 450",
    change: "0.8%",
    isPositive: true,
    previous: "2 469 titres",
    period: "portefeuille sous sûreté",
  },
  {
    title: "RDV Restitution Fixés",
    value: "3",
    change: "0.0%",
    isPositive: true,
    previous: "3 rendez-vous",
    period: "cette semaine",
  },
  {
    title: "Conformité Protocole Coffre",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "double signature requise",
  },
];

const titlesRecords = [
  {
    id: "rst1",
    ref: "REST-TF-2026-00088",
    landTitle: "TF N° 6120/Mfoundi",
    client: "KAMGA Pascal",
    ducId: "CFC-2026-DUC-03890",
    vaultLocation: "Baie A1 / Alvéole 04",
    status: "Remis en mains propres",
    date: "Aujourd'hui, 11:30",
  },
  {
    id: "rst2",
    ref: "REST-TF-2026-00087",
    landTitle: "TF N° 9415/Wouri",
    client: "TCHATCHOUANG Hélène",
    ducId: "CFC-2026-DUC-03912",
    vaultLocation: "Baie B2 / Alvéole 18",
    status: "Prêt pour remise agence",
    date: "Hier, 15:45",
  },
  {
    id: "rst3",
    ref: "REST-TF-2026-00086",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    client: "MVONDO Albert",
    ducId: "CFC-2026-DUC-03945",
    vaultLocation: "Baie A3 / Alvéole 12",
    status: "RDV fixé au 10/09",
    date: "02 Septembre 2026",
  },
  {
    id: "rst4",
    ref: "REST-TF-2026-00085",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    client: "FOUDA Bernadette",
    ducId: "CFC-2026-DUC-03980",
    vaultLocation: "Baie C1 / Alvéole 09",
    status: "En cours de désarchivage",
    date: "01 Septembre 2026",
  },
  {
    id: "rst5",
    ref: "REST-TF-2026-00084",
    landTitle: "TF N° 4118/Sanaga-Maritime",
    client: "BASSOMGBEN Jean",
    ducId: "CFC-2025-DUC-03410",
    vaultLocation: "Baie B1 / Alvéole 22",
    status: "Remis en mains propres",
    date: "28 Août 2026",
  },
  {
    id: "rst6",
    ref: "REST-TF-2026-00083",
    landTitle: "TF N° 8210/Menoua",
    client: "NGUEMO Paul",
    ducId: "CFC-2025-DUC-03150",
    vaultLocation: "Baie A2 / Alvéole 15",
    status: "Remis en mains propres",
    date: "25 Août 2026",
  },
];

const titleStatusStyles: Record<string, string> = {
  "Remis en mains propres": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Prêt pour remise agence": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "RDV fixé au 10/09": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "En cours de désarchivage": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function OriginalTitlesPage() {
  const [search, setSearch] = React.useState("");

  const filtered = titlesRecords.filter(
    (t) =>
      t.client.toLowerCase().includes(search.toLowerCase()) ||
      t.ref.toLowerCase().includes(search.toLowerCase()) ||
      t.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.ducId.toLowerCase().includes(search.toLowerCase())
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
              Sécurité &amp; Coffre-Fort
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Restitution des Titres Fonciers Originaux
          </h1>
          <p className="text-sm text-muted-foreground">
            Procédure de déconsignation des Titres Fonciers originaux conservés dans le coffre-fort central du CFC et remise solennelle au propriétaire contre décharge légale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Bordereau Décharges TF
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={titlesKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par décharge, Titre Foncier, propriétaire ou N° DUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Restitution physique sous protocole de double contrôle (Gestionnaire + Responsable Coffre)</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Décharge</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier Original</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Propriétaire Bénéficiaire</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emplacement Coffre</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Restitution</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Remise</TableHead>
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
                  <TableCell className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
                    {item.vaultLocation}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${titleStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
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
