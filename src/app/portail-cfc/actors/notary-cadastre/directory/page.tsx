"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const notaryDirectoryKpis: ActorKpiItem[] = [
  {
    title: "Notaires Conventionnés",
    value: "36",
    change: "9.1%",
    isPositive: true,
    previous: "33 études",
    period: "au niveau national",
  },
  {
    title: "Actes en Cours de Signature",
    value: "78",
    change: "11.4%",
    isPositive: true,
    previous: "70 actes",
    period: "ce mois",
  },
  {
    title: "Délai Moyen Signature",
    value: "4.2 jours",
    change: "12.5%",
    isPositive: true,
    previous: "4.8 jours",
    period: "cible ≤ 5j",
  },
  {
    title: "Grosses d'Actes Reçues",
    value: "52",
    change: "18.2%",
    isPositive: true,
    previous: "44 grosses",
    period: "archivage CFC",
  },
  {
    title: "Études en Retard de Clôture",
    value: "2",
    change: "50.0%",
    isPositive: true,
    previous: "4 études",
    period: "relances automatiques",
  },
];

const notaryDirectoryRecords = [
  {
    id: "not1",
    notaryOffice: "Étude Me Nkouendjin Yoya",
    notaryName: "Me Emmanuel Nkouendjin",
    city: "Yaoundé (Centre)",
    activeActs: 16,
    avgDelay: "3.8 jours",
    grossesDeposited: 42,
    status: "Conventionné Actif",
    complianceRate: "98.5%",
  },
  {
    id: "not2",
    notaryOffice: "Étude Me Douala Manga Bell",
    notaryName: "Me Mireille Douala Manga",
    city: "Douala (Littoral)",
    activeActs: 19,
    avgDelay: "4.1 jours",
    grossesDeposited: 58,
    status: "Conventionné Actif",
    complianceRate: "97.0%",
  },
  {
    id: "not3",
    notaryOffice: "Étude Me Bisseck & Associés",
    notaryName: "Me Jacques Bisseck",
    city: "Kribi (Sud)",
    activeActs: 8,
    avgDelay: "4.5 jours",
    grossesDeposited: 21,
    status: "Conventionné Actif",
    complianceRate: "95.2%",
  },
  {
    id: "not4",
    notaryOffice: "Étude Me Kamdem Henri",
    notaryName: "Me Henri Kamdem",
    city: "Bafoussam (Ouest)",
    activeActs: 11,
    avgDelay: "5.2 jours",
    grossesDeposited: 34,
    status: "Conventionné Actif",
    complianceRate: "94.0%",
  },
  {
    id: "not5",
    notaryOffice: "Étude Me Bello Ousmanou",
    notaryName: "Me Ousmanou Bello",
    city: "Garoua (Nord)",
    activeActs: 6,
    avgDelay: "4.9 jours",
    grossesDeposited: 15,
    status: "En Revue Triennale",
    complianceRate: "91.8%",
  },
  {
    id: "not6",
    notaryOffice: "Étude Me Fotso Jean",
    notaryName: "Me Jean Fotso",
    city: "Nkongsamba (Moungo)",
    activeActs: 1,
    avgDelay: "7.8 jours",
    grossesDeposited: 9,
    status: "Relance Retard",
    complianceRate: "82.0%",
  },
];

const notaryStatusStyles: Record<string, string> = {
  "Conventionné Actif": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En Revue Triennale": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Relance Retard": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function NotaryDirectoryPage() {
  const [search, setSearch] = React.useState("");

  const filtered = notaryDirectoryRecords.filter(
    (n) =>
      n.notaryOffice.toLowerCase().includes(search.toLowerCase()) ||
      n.notaryName.toLowerCase().includes(search.toLowerCase()) ||
      n.city.toLowerCase().includes(search.toLowerCase())
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
              Réseau Notarial Agréé
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Études Notariales Partenaires &amp; Suivi des Minutes
          </h1>
          <p className="text-sm text-muted-foreground">
            Répertoire des études notariales conventionnées CFC, suivi de la signature des conventions d&apos;ouverture de crédit et conservation des grosses authentiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Annuaire Notaires
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={notaryDirectoryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par étude, notaire titulaire ou ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Chambre Nationale des Notaires du Cameroun (CNNC) · Conventions CFC</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Étude Notariale</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Notaire Titulaire</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Ville / Région</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Actes En Cours</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Délai Moyen</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Grosses Déposées</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Convention</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Conformité</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <span className="font-semibold text-xs text-foreground block max-w-[200px] truncate">
                      {item.notaryOffice}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">
                    {item.notaryName}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                    {item.city}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-foreground">
                    {item.activeActs}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono text-xs text-foreground">
                    {item.avgDelay}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono text-xs text-muted-foreground">
                    {item.grossesDeposited}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${notaryStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                    {item.complianceRate}
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
