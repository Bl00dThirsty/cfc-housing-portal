"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const cadastreKpis: ActorKpiItem[] = [
  {
    title: "Certificats Réceptionnés (Mois)",
    value: "86",
    change: "14.7%",
    isPositive: true,
    previous: "75 certificats",
    period: "ce mois",
  },
  {
    title: "Hypothèques 1er Rang Inscrites",
    value: "58",
    change: "16.0%",
    isPositive: true,
    previous: "50 actes",
    period: "au Cadastre MINDCAF",
  },
  {
    title: "Conservations Raccordées",
    value: "18",
    change: "12.5%",
    isPositive: true,
    previous: "16 services",
    period: "Mfoundi, Wouri, etc.",
  },
  {
    title: "Délai Délivrance Acte",
    value: "5.4 jours",
    change: "18.2%",
    isPositive: true,
    previous: "6.6 jours",
    period: "cible ≤ 7j",
  },
  {
    title: "Dossiers en Rectification",
    value: "3",
    change: "40.0%",
    isPositive: true,
    previous: "5 dossiers",
    period: "anomalies de bornage",
  },
];

const cadastreRecords = [
  {
    id: "cad1",
    ref: "REQ-MIN-2026-00892",
    client: "TCHOUNGUI Alain",
    landTitle: "TF N° 4892/Mfoundi",
    conservationOffice: "Conservation Foncière Yaoundé Centre",
    validityDate: "15 Nov 2026",
    status: "Inscrit au Livre Foncier",
    date: "Aujourd'hui, 09:30",
  },
  {
    id: "cad2",
    ref: "REQ-MIN-2026-00891",
    client: "ENOW George",
    landTitle: "TF N° 12450/Wouri",
    conservationOffice: "Conservation Foncière Douala Bonanjo",
    validityDate: "02 Déc 2026",
    status: "En cours de publication",
    date: "Hier, 14:20",
  },
  {
    id: "cad3",
    ref: "REQ-MIN-2026-00890",
    client: "MANGA Estelle",
    landTitle: "TF N° 3120/Océan",
    conservationOffice: "Conservation Foncière Kribi",
    validityDate: "28 Oct 2026",
    status: "Inscrit au Livre Foncier",
    date: "02 Sept 2026",
  },
  {
    id: "cad4",
    ref: "REQ-MIN-2026-00889",
    client: "KOUAM Roger",
    landTitle: "TF N° 8904/Mifi",
    conservationOffice: "Conservation Foncière Bafoussam",
    validityDate: "10 Janv 2027",
    status: "En attente bordereau",
    date: "01 Sept 2026",
  },
  {
    id: "cad5",
    ref: "REQ-MIN-2026-00888",
    client: "MUKETE Henry",
    landTitle: "TF N° 16210/Fako",
    conservationOffice: "Conservation Foncière Limbe",
    validityDate: "18 Nov 2026",
    status: "Inscrit au Livre Foncier",
    date: "29 Août 2026",
  },
  {
    id: "cad6",
    ref: "REQ-MIN-2026-00887",
    client: "NDZANA Philippe",
    landTitle: "TF N° 5110/Méfou-et-Afamba",
    conservationOffice: "Conservation Foncière Mfou",
    validityDate: "Expiré",
    status: "Rectification demandée",
    date: "27 Août 2026",
  },
];

const cadastreStatusStyles: Record<string, string> = {
  "Inscrit au Livre Foncier": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En cours de publication": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente bordereau": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Rectification demandée": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function CadastreDocsPage() {
  const [search, setSearch] = React.useState("");

  const filtered = cadastreRecords.filter(
    (c) =>
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.ref.toLowerCase().includes(search.toLowerCase()) ||
      c.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.conservationOffice.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-transparent h-5 px-2 text-xs font-medium">
              Liaison Cadastre MINDCAF
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Liaison Cadastre &amp; Certificats MINDCAF
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des réquisitions de certificats de propriété récents, inscriptions des hypothèques au livre foncier départemental et délivrance des bordereaux.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Réquisitions MINDCAF
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={cadastreKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, emprunteur, Titre Foncier ou conservation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Conservation Foncière Départementale · Ministère des Domaines (MINDCAF)</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Réquisition</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Bénéficiaire</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier (TF)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Conservation Foncière</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Validité Certificat</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Inscription</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Dépôt</TableHead>
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
                    <Badge variant="secondary" className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200 border-transparent">
                      {item.landTitle}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px]">
                    <span className="truncate block">{item.conservationOffice}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
                    {item.validityDate}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${cadastreStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
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
