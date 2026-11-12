"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const loanOffersKpis: ActorKpiItem[] = [
  {
    title: "Offres Éditées (Mois)",
    value: "74",
    change: "17.5%",
    isPositive: true,
    previous: "63 offres",
    period: "ce mois",
  },
  {
    title: "Taux d'Acceptation Client",
    value: "96.2%",
    change: "1.4%",
    isPositive: true,
    previous: "94.8%",
    period: "délai légal 30 jours",
  },
  {
    title: "Délai Moyen d'Émission",
    value: "1.4 jour",
    change: "22.2%",
    isPositive: true,
    previous: "1.8 jour",
    period: "cible ≤ 2j post-comité",
  },
  {
    title: "En Réflexion Emprunteur",
    value: "12",
    change: "14.3%",
    isPositive: true,
    previous: "14 dossiers",
    period: "délai de rétractation",
  },
  {
    title: "Offres Expirées / Caduques",
    value: "2",
    change: "50.0%",
    isPositive: true,
    previous: "4",
    period: "non signées sous 30j",
  },
];

const loanOffersRecords = [
  {
    id: "opp1",
    ref: "OPP-2026-CFC-00412",
    ducId: "CFC-2026-DUC-04655",
    client: "NGO NSOA Marie",
    amountDuration: "14 400 000 FCFA · 20 ans",
    interestRate: "Taux bonifié 4.5%",
    monthlyPayment: "91 240 FCFA",
    status: "Acceptée & Signée",
    date: "Émise le 02/09 · Signée",
  },
  {
    id: "opp2",
    ref: "OPP-2026-CFC-00411",
    ducId: "CFC-2026-DUC-04712",
    client: "FOTSO Michel",
    amountDuration: "25 000 000 FCFA · 15 ans",
    interestRate: "Taux standard 6.5%",
    monthlyPayment: "217 800 FCFA",
    status: "Transmis au Notaire",
    date: "Émise le 01/09 · En étude",
  },
  {
    id: "opp3",
    ref: "OPP-2026-CFC-00410",
    ducId: "CFC-2026-DUC-04780",
    client: "BILOA Jean-Baptiste",
    amountDuration: "8 500 000 FCFA · 25 ans",
    interestRate: "Taux bonifié 4.0%",
    monthlyPayment: "44 850 FCFA",
    status: "En attente signature",
    date: "Émise le 03/09 · Expire 03/10",
  },
  {
    id: "opp4",
    ref: "OPP-2026-CFC-00409",
    ducId: "CFC-2026-DUC-04795",
    client: "ASSOMO Claire",
    amountDuration: "6 200 000 FCFA · 10 ans",
    interestRate: "Taux standard 6.0%",
    monthlyPayment: "68 830 FCFA",
    status: "Acceptée & Signée",
    date: "Émise le 29/08 · Signée",
  },
  {
    id: "opp5",
    ref: "OPP-2026-CFC-00408",
    ducId: "CFC-2026-DUC-04820",
    client: "TCHINDA Raoul",
    amountDuration: "32 000 000 FCFA · 20 ans",
    interestRate: "Taux diaspora 5.5%",
    monthlyPayment: "220 120 FCFA",
    status: "Transmis au Notaire",
    date: "Émise le 27/08 · En étude",
  },
  {
    id: "opp6",
    ref: "OPP-2026-CFC-00407",
    ducId: "CFC-2026-DUC-04835",
    client: "MEKA David",
    amountDuration: "12 000 000 FCFA · 15 ans",
    interestRate: "Taux standard 6.5%",
    monthlyPayment: "104 500 FCFA",
    status: "Expirée",
    date: "Émise le 25/07 · Caducité",
  },
];

const offerStatusStyles: Record<string, string> = {
  "Acceptée & Signée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Transmis au Notaire": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente signature": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Expirée": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function LoanOffersPage() {
  const [search, setSearch] = React.useState("");

  const filtered = loanOffersRecords.filter(
    (o) =>
      o.client.toLowerCase().includes(search.toLowerCase()) ||
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      o.ducId.toLowerCase().includes(search.toLowerCase()) ||
      o.interestRate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G6
            </Badge>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Formalisation Contractuelle
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Génération Accords &amp; Offres Préalables de Prêt (OPP)
          </h1>
          <p className="text-sm text-muted-foreground">
            Édition automatisée des offres de prêt conformes aux exigences OHADA/COBAC, tableaux d&apos;amortissement prévisionnels et suivi des signatures emprunteurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Registre OPP
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={loanOffersKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par N° OPP, emprunteur, N° DUC ou barème..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Délai légal de rétractation et validité de l&apos;offre : 30 jours calendrier</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Offre (OPP)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant &amp; Durée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Barème / Taux</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Mensualité Estimée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Signature</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Dates Clés</TableHead>
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
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.amountDuration}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">
                    {item.interestRate}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.monthlyPayment}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${offerStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
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
