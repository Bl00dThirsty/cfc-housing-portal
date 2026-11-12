"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const notaireKpis: ActorKpiItem[] = [
  {
    title: "Actes en Signature Notaire",
    value: "64",
    change: "8.5%",
    isPositive: true,
    previous: "59",
    period: "ce mois",
  },
  {
    title: "Hypothèques 1er Rang Inscrites",
    value: "48",
    change: "14.3%",
    isPositive: true,
    previous: "42",
    period: "au Cadastre MINDCAF",
  },
  {
    title: "Certificats de Propriété Réceptionnés",
    value: "72",
    change: "12.5%",
    isPositive: true,
    previous: "64",
    period: "validité < 3 mois",
  },
  {
    title: "Valeur Garanties Foncier",
    value: "3,80 Mds FCFA",
    change: "18.7%",
    isPositive: true,
    previous: "3,20 Mds FCFA",
    period: "couverture 120%",
  },
  {
    title: "Délai Moyen MINDCAF",
    value: "6.8 jours",
    change: "15.0%",
    isPositive: true,
    previous: "8.0 jours",
    period: "délivrance acte",
  },
];

const notaireDossiers = [
  {
    id: "n1",
    ducId: "CFC-2026-DUC-04590",
    client: "TCHOUNGUI Alain",
    landTitle: "TF N° 4892/Mfoundi",
    notaryOffice: "Étude Me Nkouendjin (Yaoundé)",
    cadastreOffice: "Conservation Foncière Mfoundi",
    guaranteeValue: "22 000 000 FCFA",
    status: "Hypothèque Inscrite 1er Rang",
    date: "Aujourd'hui, 10:15",
  },
  {
    id: "n2",
    ducId: "CFC-2026-DUC-04612",
    client: "ENOW George",
    landTitle: "TF N° 12450/Wouri",
    notaryOffice: "Étude Me Douala Manga (Douala)",
    cadastreOffice: "Conservation Foncière Wouri",
    guaranteeValue: "18 000 000 FCFA",
    status: "En Attente Signature Convention",
    date: "Hier, 15:40",
  },
  {
    id: "n3",
    ducId: "CFC-2026-DUC-04678",
    client: "MANGA Estelle",
    landTitle: "TF N° 3120/Océan",
    notaryOffice: "Étude Me Bisseck (Kribi)",
    cadastreOffice: "Conservation Foncière Océan",
    guaranteeValue: "14 500 000 FCFA",
    status: "Certificat Propriété Vérifié",
    date: "01 Sept 2026",
  },
  {
    id: "n4",
    ducId: "CFC-2026-DUC-04701",
    client: "KOUAM Roger",
    landTitle: "TF N° 8904/Mifi",
    notaryOffice: "Étude Me Kamdem (Bafoussam)",
    cadastreOffice: "Conservation Foncière Mifi",
    guaranteeValue: "26 000 000 FCFA",
    status: "Publication Journal Cadastre",
    date: "29 Août 2026",
  },
];

export default function NotaireCadastreActorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = notaireDossiers.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.notaryOffice.toLowerCase().includes(search.toLowerCase())
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
              Notariat & Affaires Juridiques
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Formalisation Notariée & Cadastre (MINDCAF)
          </h1>
          <p className="text-sm text-muted-foreground">
            Rédaction des conventions notariées d&apos;affectation hypothécaire de 1er rang, inscription au Cadastre MINDCAF et délivrance des certificats de propriété récents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Bordereau Hypothèques
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={notaireKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur, N° DUC, Titre Foncier, Notaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase 4 du Circuit CFC · Formalisation & Garanties Réelles</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Bénéficiaire / Garant</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier (TF)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Étude Notariale</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Valeur Garantie</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Hypothèque</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.cadastreOffice}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="secondary" className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200">
                      {item.landTitle}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">{item.notaryOffice}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.guaranteeValue}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        item.status.includes("Inscrite") || item.status.includes("Vérifié")
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
                          : "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 h-5 px-2 text-xs font-medium"
                      }
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
