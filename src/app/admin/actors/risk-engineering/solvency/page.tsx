"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const solvencyKpis: ActorKpiItem[] = [
  {
    title: "Consultations Fichier (Mois)",
    value: "312",
    change: "21.4%",
    isPositive: true,
    previous: "257",
    period: "ce mois",
  },
  {
    title: "Score Solvabilité Moyen",
    value: "748 / 1000",
    change: "2.5%",
    isPositive: true,
    previous: "730 pts",
    period: "seuil min. ≥ 650",
  },
  {
    title: "Taux d'Incidents Détectés",
    value: "4.8%",
    change: "1.2%",
    isPositive: true,
    previous: "6.0%",
    period: "incidents BEAC/COBAC",
  },
  {
    title: "Reste à Vivre Moyen",
    value: "340 000 FCFA",
    change: "5.6%",
    isPositive: true,
    previous: "322 000 FCFA",
    period: "norme CFC ≥ 150k",
  },
  {
    title: "Dossiers en Alerte Rouge",
    value: "9",
    change: "25.0%",
    isPositive: true,
    previous: "12",
    period: "interdictions bancaires",
  },
];

const solvencyRecords = [
  {
    id: "sr1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    profession: "Cadre Supérieur Privé",
    netIncome: "1 450 000 FCFA",
    existingDebts: "180 000 FCFA",
    solvencyScore: 820,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "Aujourd'hui, 08:30",
  },
  {
    id: "sr2",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    profession: "Commerçant Import/Export",
    netIncome: "2 800 000 FCFA",
    existingDebts: "620 000 FCFA",
    solvencyScore: 710,
    beacStatus: "Régularisé",
    opinion: "Vigilance",
    date: "Hier, 14:15",
  },
  {
    id: "sr3",
    ducId: "CFC-2026-DUC-04840",
    client: "ATANGANA Thérèse",
    profession: "Inspectrice des Impôts",
    netIncome: "950 000 FCFA",
    existingDebts: "110 000 FCFA",
    solvencyScore: 790,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "02 Sept 2026",
  },
  {
    id: "sr4",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    profession: "Ingénieur Port Autonome",
    netIncome: "1 200 000 FCFA",
    existingDebts: "250 000 FCFA",
    solvencyScore: 760,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "01 Sept 2026",
  },
  {
    id: "sr5",
    ducId: "CFC-2026-DUC-04890",
    client: "MVOGO Bernard",
    profession: "Prestataire Indépendant",
    netIncome: "480 000 FCFA",
    existingDebts: "210 000 FCFA",
    solvencyScore: 540,
    beacStatus: "Contentieux Actif",
    opinion: "Défavorable",
    date: "31 Août 2026",
  },
  {
    id: "sr6",
    ducId: "CFC-2026-DUC-04905",
    client: "BILOUNGA Esther",
    profession: "Médecin Généraliste",
    netIncome: "1 650 000 FCFA",
    existingDebts: "190 000 FCFA",
    solvencyScore: 845,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "29 Août 2026",
  },
];

const opinionStyles: Record<string, string> = {
  "Favorable": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Vigilance": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Défavorable": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

const beacStyles: Record<string, string> = {
  "Néant (Vierge)": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Régularisé": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Contentieux Actif": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function SolvencyPage() {
  const [search, setSearch] = React.useState("");

  const filtered = solvencyRecords.filter(
    (s) =>
      s.client.toLowerCase().includes(search.toLowerCase()) ||
      s.ducId.toLowerCase().includes(search.toLowerCase()) ||
      s.profession.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent h-5 px-2 text-xs font-medium">
              Analyse Prudentielle
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Centrale des Risques &amp; Solvabilité Ménage
          </h1>
          <p className="text-sm text-muted-foreground">
            Interrogation du fichier national des incidents de paiement BEAC, centrale des risques bancaires et calcul de la capacité d&apos;endettement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Fiche Prudentielle
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={solvencyKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur, N° DUC ou profession..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Interrogation Centrale des Risques BEAC &amp; Fichier National des Incidents</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Revenus Mensuels</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Charges Crédits</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Score BEAC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Fichier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Avis Prudentiel</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date MAJ</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-700">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.profession}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.netIncome}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {item.existingDebts}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-foreground">
                    {item.solvencyScore} pts
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${beacStyles[item.beacStatus] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.beacStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${opinionStyles[item.opinion] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.opinion}
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
