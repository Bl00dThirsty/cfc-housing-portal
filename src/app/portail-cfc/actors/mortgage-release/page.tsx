"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const mainleveeKpis: ActorKpiItem[] = [
  {
    title: "Prêts Éteints à Solde Nul",
    value: "24",
    change: "20.0%",
    isPositive: true,
    previous: "20",
    period: "ce mois",
  },
  {
    title: "Actes de Mainlevée Signés",
    value: "18",
    change: "28.6%",
    isPositive: true,
    previous: "14",
    period: "par la Direction Générale",
  },
  {
    title: "Titres Fonciers Originaux Libérés",
    value: "16",
    change: "33.3%",
    isPositive: true,
    previous: "12",
    period: "restitués aux clients",
  },
  {
    title: "Encours Total Régularisé",
    value: "185 M FCFA",
    change: "15.6%",
    isPositive: true,
    previous: "160 M FCFA",
    period: "ce mois",
  },
  {
    title: "Dossiers Orphelins ou Bloqués",
    value: "0",
    change: "0.0%",
    isPositive: true,
    previous: "0",
    period: "zéro contentieux en suspens",
  },
];

const mainleveeDossiers = [
  {
    id: "m1",
    ducId: "CFC-2026-DUC-03890",
    client: "KAMGA Pascal",
    landTitle: "TF N° 6120/Mfoundi",
    loanTerm: "Terme échu (15 ans)",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Acte Mainlevée Signé & Enregistré",
    originalTitleStatus: "TF Restitué en Mains Propres",
    date: "Aujourd'hui, 11:00",
  },
  {
    id: "m2",
    ducId: "CFC-2026-DUC-03912",
    client: "TCHATCHOUANG Hélène",
    landTitle: "TF N° 9415/Wouri",
    loanTerm: "Remboursement Anticipé",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Radiation Hypothèque MINDCAF",
    originalTitleStatus: "En coffre-fort agence",
    date: "Hier, 15:20",
  },
  {
    id: "m3",
    ducId: "CFC-2026-DUC-03945",
    client: "MVONDO Albert",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    loanTerm: "Terme échu (20 ans)",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Projet d'Acte Notarié en Signature",
    originalTitleStatus: "En cours de désarchivage",
    date: "01 Sept 2026",
  },
  {
    id: "m4",
    ducId: "CFC-2026-DUC-03980",
    client: "FOUDA Bernadette",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    loanTerm: "Terme échu (12 ans)",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Décompte d'Extinction Validé DFBC",
    originalTitleStatus: "En cours de désarchivage",
    date: "29 Août 2026",
  },
];

export default function MainleveeClotureActorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = mainleveeDossiers.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.deedStatus.toLowerCase().includes(search.toLowerCase())
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
              Clôture, Mainlevée & Conservation Foncière
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Conservation Foncière — Clôture & Mainlevée
          </h1>
          <p className="text-sm text-muted-foreground">
            Décompte d&apos;extinction des prêts à solde nul, rédaction des actes de mainlevée d&apos;hypothèque, radiation au Cadastre MINDCAF et restitution sécurisée des Titres Fonciers originaux.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Registre des Mainlevées
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={mainleveeKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur, N° DUC, Titre Foncier ou statut..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase 6 du Circuit CFC · Clôture Définitive & Libération Titre Foncier</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Bénéficiaire / Motif</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier (TF)</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Solde Extinction</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Acte Mainlevée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Restitution TF Original</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.loanTerm}</span>
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
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-emerald-600">
                    {item.closingAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
                    >
                      {item.deedStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
                    {item.originalTitleStatus}
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
