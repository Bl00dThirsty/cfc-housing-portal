"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const comitesKpis: ActorKpiItem[] = [
  {
    title: "Dossiers Soumis en Comité",
    value: "88",
    change: "10.0%",
    isPositive: true,
    previous: "80",
    period: "ce mois",
  },
  {
    title: "Taux d'Accord Favorable",
    value: "94.3%",
    change: "2.1%",
    isPositive: true,
    previous: "92.2%",
    period: "ce mois",
  },
  {
    title: "Volume Financements Accordés",
    value: "2,45 Mds FCFA",
    change: "22.5%",
    isPositive: true,
    previous: "2,00 Mds FCFA",
    period: "ce mois",
  },
  {
    title: "En Attente d'Arbitrage CGR",
    value: "14",
    change: "30.0%",
    isPositive: true,
    previous: "20",
    period: "séance du 04/09",
  },
  {
    title: "Prêts Bonifiés Habitat Social",
    value: "52",
    change: "15.5%",
    isPositive: true,
    previous: "45",
    period: "programmes SIC / MAETUR",
  },
];

const comiteDossiers = [
  {
    id: "c1",
    ducId: "CFC-2026-DUC-04655",
    client: "NGO NSOA Marie",
    purpose: "Acquisition Appartement SIC (Mbankolo)",
    requestedLoan: "14 400 000 FCFA",
    approvedLoan: "14 400 000 FCFA",
    committeeType: "Comité CRC (Crédit)",
    decision: "Accordé à l'unanimité",
    decisionDate: "Séance du 02 Sept 2026",
  },
  {
    id: "c2",
    ducId: "CFC-2026-DUC-04712",
    client: "FOTSO Michel",
    purpose: "Construction Logements Locatifs (Douala)",
    requestedLoan: "28 000 000 FCFA",
    approvedLoan: "25 000 000 FCFA",
    committeeType: "Comité CGR (Risques)",
    decision: "Accord avec Réduction Montant",
    decisionDate: "Séance du 01 Sept 2026",
  },
  {
    id: "c3",
    ducId: "CFC-2026-DUC-04780",
    client: "BILOA Jean-Baptiste",
    purpose: "Autoconstruction Sociale (Olembé)",
    requestedLoan: "8 500 000 FCFA",
    approvedLoan: "En arbitrage",
    committeeType: "Comité CGR",
    decision: "En Attente Séance 04/09",
    decisionDate: "Programmé 04 Sept 2026",
  },
  {
    id: "c4",
    ducId: "CFC-2026-DUC-04795",
    client: "ASSOMO Claire",
    purpose: "Achat Terrain Lotissement MAETUR",
    requestedLoan: "6 200 000 FCFA",
    approvedLoan: "6 200 000 FCFA",
    committeeType: "Comité CRC",
    decision: "Accordé sous réserve Hypothèque",
    decisionDate: "Séance du 28 Août 2026",
  },
];

export default function ComitesActorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = comiteDossiers.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.purpose.toLowerCase().includes(search.toLowerCase()) ||
      d.committeeType.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-transparent h-5 px-2 text-xs font-medium">
              Comités Décisionnels & Gouvernance
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Comités Décisionnels — CGR & CRC
          </h1>
          <p className="text-sm text-muted-foreground">
            Arbitrage des demandes de financement, délibérations du Comité de Gestion des Risques (CGR), validation du Comité de Règlement des Créances (CRC) et notifications d&apos;accord.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Procès-Verbal Séance
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={comitesKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par bénéficiaire, N° DUC, comité ou objet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase 3 du Circuit CFC · Arbitrage & Octroi</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Bénéficiaire / Objet</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Instance Décisionnelle</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Prêt Sollicité</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Accordé</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Décision Comité</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.purpose}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">{item.committeeType}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-medium text-xs text-muted-foreground">
                    {item.requestedLoan}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.approvedLoan}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        item.decision.includes("Accord")
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
                          : "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 h-5 px-2 text-xs font-medium"
                      }
                    >
                      {item.decision}
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
