"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const directoryKpis: ActorKpiItem[] = [
  {
    title: "Cabinets Agréés Actifs",
    value: "42",
    change: "10.5%",
    isPositive: true,
    previous: "38 cabinets",
    period: "au niveau national",
  },
  {
    title: "Missions Confiées (Mois)",
    value: "184",
    change: "12.8%",
    isPositive: true,
    previous: "163 missions",
    period: "ce mois",
  },
  {
    title: "Note Qualité Moyenne",
    value: "4.7 / 5",
    change: "4.4%",
    isPositive: true,
    previous: "4.5 / 5",
    period: "satisfaction CFC",
  },
  {
    title: "Délai d'Expertise Moyen",
    value: "3.8 jours",
    change: "11.4%",
    isPositive: true,
    previous: "4.3 jours",
    period: "cible ≤ 5j",
  },
  {
    title: "En Audit de Renouvellement",
    value: "3",
    change: "25.0%",
    isPositive: true,
    previous: "4",
    period: "revue triennale",
  },
];

const directoryRecords = [
  {
    id: "dir1",
    name: "BET Epsilon Cameroun",
    lead: "Ing. Lucien Fame (ONIGC)",
    approvalCode: "BET-CFC-2024-019",
    specialty: "Génie Civil & Structure",
    region: "Centre, Sud & Est",
    activeMissions: 18,
    status: "Agréé Actif",
    rating: "4.9 / 5",
  },
  {
    id: "dir2",
    name: "Cabinet Polytech Sarl",
    lead: "Arch. Danielle Mbia (ONAC)",
    approvalCode: "BET-CFC-2023-008",
    specialty: "Architecture & Urbanisme",
    region: "Littoral & Sud-Ouest",
    activeMissions: 14,
    status: "Agréé Actif",
    rating: "4.8 / 5",
  },
  {
    id: "dir3",
    name: "Laboratoire Géotechnique du Cameroun",
    lead: "Dr. Paul Ebanda (Géologue)",
    approvalCode: "BET-CFC-2024-031",
    specialty: "Sols & Fondations Spéciales",
    region: "National (10 Régions)",
    activeMissions: 22,
    status: "Agréé Actif",
    rating: "4.7 / 5",
  },
  {
    id: "dir4",
    name: "BET Ingénierie Littoral",
    lead: "Ing. Charles Talla",
    approvalCode: "BET-CFC-2022-014",
    specialty: "Génie Civil & Voiries",
    region: "Littoral & Ouest",
    activeMissions: 9,
    status: "En Renouvellement",
    rating: "4.4 / 5",
  },
  {
    id: "dir5",
    name: "Sahel Expertises BTP",
    lead: "Ing. Ahmadou Bello",
    approvalCode: "BET-CFC-2024-044",
    specialty: "Bâtiment & Fluides",
    region: "Adamaoua, Nord, Extrême-Nord",
    activeMissions: 7,
    status: "Agréé Actif",
    rating: "4.6 / 5",
  },
  {
    id: "dir6",
    name: "Cabinet Bâtir Sain",
    lead: "Ing. Marcelle Ngo",
    approvalCode: "BET-CFC-2021-003",
    specialty: "Économie de la Construction",
    region: "Centre",
    activeMissions: 0,
    status: "Suspendu (Audit)",
    rating: "3.8 / 5",
  },
];

const approvalStatusStyles: Record<string, string> = {
  "Agréé Actif": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En Renouvellement": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Suspendu (Audit)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function DirectoryPage() {
  const [search, setSearch] = React.useState("");

  const filtered = directoryRecords.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.lead.toLowerCase().includes(search.toLowerCase()) ||
      d.approvalCode.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G3
            </Badge>
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Partenaires Techniques
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Annuaire des BET &amp; Experts Agréés CFC
          </h1>
          <p className="text-sm text-muted-foreground">
            Répertoire national des bureaux d&apos;études techniques, ingénieurs et architectes habilités aux contre-expertises préalables et réceptions de chantier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Annuaire BET
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={directoryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par cabinet, expert, code agrément ou région..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ordre National des Ingénieurs de Génie Civil (ONIGC) &amp; ONAC</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Cabinet / Expert Agréé</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">N° Agrément CFC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Domaine de Compétence</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Zone de Couverture</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Missions En Cours</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Note Qualité</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Agrément</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{item.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.lead}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.approvalCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">
                    {item.specialty}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                    {item.region}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-foreground">
                    {item.activeMissions}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono text-xs font-medium text-foreground">
                    {item.rating}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${approvalStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.status}
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
