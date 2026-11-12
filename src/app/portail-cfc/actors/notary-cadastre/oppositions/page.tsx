"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const oppositionKpis: ActorKpiItem[] = [
  {
    title: "Titres Fonciers Audités (Mois)",
    value: "108",
    change: "14.9%",
    isPositive: true,
    previous: "94 titres",
    period: "ce mois",
  },
  {
    title: "Taux Titres Sains & Francs",
    value: "92.6%",
    change: "1.8%",
    isPositive: true,
    previous: "90.8%",
    period: "sans charge ni litige",
  },
  {
    title: "Oppositions Bloquées",
    value: "8",
    change: "11.1%",
    isPositive: true,
    previous: "9 dossiers",
    period: "litiges / saisies",
  },
  {
    title: "Levées d'Opposition Obtenues",
    value: "5",
    change: "25.0%",
    isPositive: true,
    previous: "4 dossiers",
    period: "régularisations notariées",
  },
  {
    title: "Délai Moyen d'Audit Juridique",
    value: "2.4 jours",
    change: "20.0%",
    isPositive: true,
    previous: "3.0 jours",
    period: "cible ≤ 3j",
  },
];

const oppositionRecords = [
  {
    id: "opp1",
    ref: "AUD-FONC-2026-00318",
    landTitle: "TF N° 4892/Mfoundi",
    location: "Olembé (Yaoundé)",
    client: "TCHOUNGUI Alain",
    legalStatus: "Titre Libre & Franc",
    identifiedRisk: "Néant",
    legalOpinion: "Favorable",
    date: "Aujourd'hui, 08:45",
  },
  {
    id: "opp2",
    ref: "AUD-FONC-2026-00317",
    landTitle: "TF N° 12450/Wouri",
    location: "Bonapriso (Douala)",
    client: "ENOW George",
    legalStatus: "Hypothèque Antérieure en cours de radiation",
    identifiedRisk: "Condition suspensive de radiation",
    legalOpinion: "Favorable sous réserve",
    date: "Hier, 16:10",
  },
  {
    id: "opp3",
    ref: "AUD-FONC-2026-00316",
    landTitle: "TF N° 3120/Océan",
    location: "Kribi Urbain",
    client: "MANGA Estelle",
    legalStatus: "Titre Libre & Franc",
    identifiedRisk: "Néant",
    legalOpinion: "Favorable",
    date: "01 Sept 2026",
  },
  {
    id: "opp4",
    ref: "AUD-FONC-2026-00315",
    landTitle: "TF N° 7820/Nyong-et-Mfoumou",
    location: "Akonolinga",
    client: "ATANGANA Basile",
    legalStatus: "Opposition Successorale (Tribunal)",
    identifiedRisk: "Litige entre cohéritiers",
    legalOpinion: "Bloqué (Refus Juridique)",
    date: "31 Août 2026",
  },
  {
    id: "opp5",
    ref: "AUD-FONC-2026-00314",
    landTitle: "TF N° 9140/Mifi",
    location: "Bafoussam Centre",
    client: "FOTSO David",
    legalStatus: "Pré-notation Judiciaire conservatoire",
    identifiedRisk: "Créance tierce non purgée",
    legalOpinion: "Bloqué (Refus Juridique)",
    date: "29 Août 2026",
  },
  {
    id: "opp6",
    ref: "AUD-FONC-2026-00313",
    landTitle: "TF N° 6200/Fako",
    location: "Buea Town",
    client: "NDIP Samuel",
    legalStatus: "Servitude de Passage Public",
    identifiedRisk: "Servitude non restrictive sur emprise",
    legalOpinion: "Favorable",
    date: "28 Août 2026",
  },
];

const legalOpinionStyles: Record<string, string> = {
  "Favorable": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Favorable sous réserve": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Bloqué (Refus Juridique)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function OppositionsPage() {
  const [search, setSearch] = React.useState("");

  const filtered = oppositionRecords.filter(
    (o) =>
      o.client.toLowerCase().includes(search.toLowerCase()) ||
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      o.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      o.location.toLowerCase().includes(search.toLowerCase()) ||
      o.legalStatus.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-transparent h-5 px-2 text-xs font-medium">
              Contrôle Juridique &amp; Sûretés
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Contrôle des Pré-notations, Saisies &amp; Oppositions Foncières
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit de conformité des titres fonciers proposés en garantie : vérification de l&apos;absence d&apos;oppositions judiciaires, litiges successoraux ou charges antérieures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Registre Oppositions
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={oppositionKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, Titre Foncier, emprunteur ou statut..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sécurisation de l&apos;hypothèque conventionnelle de 1er rang du Crédit Foncier</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Audit</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier (TF)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Localisation Parcelle</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Porteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">État Juridique du Titre</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Risque Identifié</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Avis Juridique</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Audit</TableHead>
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
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                    {item.location}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
                    {item.client}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[190px]">
                    <span className="truncate block">{item.legalStatus}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
                    <span className="truncate block">{item.identifiedRisk}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${legalOpinionStyles[item.legalOpinion] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
                    >
                      {item.legalOpinion}
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
