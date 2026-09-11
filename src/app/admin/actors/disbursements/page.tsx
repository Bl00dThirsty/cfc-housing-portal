"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const dfbcKpis: ActorKpiItem[] = [
  {
    title: "Volume Décaissements (Mois)",
    value: "620 M FCFA",
    change: "16.5%",
    isPositive: true,
    previous: "532 M FCFA",
    period: "ce mois",
  },
  {
    title: "Tranches VD Débloquées",
    value: "38",
    change: "8.6%",
    isPositive: true,
    previous: "35",
    period: "après attachement BET",
  },
  {
    title: "Taux de Recouvrement Amortissement",
    value: "98.2%",
    change: "0.8%",
    isPositive: true,
    previous: "97.4%",
    period: "échéances échues",
  },
  {
    title: "Prélèvements SYSTAC Automatiques",
    value: "1 180",
    change: "14.0%",
    isPositive: true,
    previous: "1 035",
    period: "virements domiciliés",
  },
  {
    title: "Taux d'Impayés / Pré-contentieux",
    value: "1.8%",
    change: "0.4%",
    isPositive: true,
    previous: "2.2%",
    period: "seuil COBAC ≤ 5%",
  },
];

const dfbcDossiers = [
  {
    id: "f1",
    ducId: "CFC-2026-DUC-04410",
    client: "EBAH Rodrigue",
    purpose: "Construction Villa (Yaoundé)",
    trancheNumber: "Tranche 2/3 (Gros Œuvre)",
    trancheAmount: "6 400 000 FCFA",
    beneficiaryBank: "UBA Cameroun (SYSTAC)",
    vdStatus: "Attachement BET 65% Validé",
    date: "Aujourd'hui, 08:30",
  },
  {
    id: "f2",
    ducId: "CFC-2026-DUC-04480",
    client: "NDAM Oumarou",
    purpose: "Immeuble R+1 (Foumban)",
    trancheNumber: "Tranche 1/3 (Fondations)",
    trancheAmount: "5 000 000 FCFA",
    beneficiaryBank: "Afriland First Bank",
    vdStatus: "Virement Exécuté Carthago",
    date: "Hier, 14:10",
  },
  {
    id: "f3",
    ducId: "CFC-2026-DUC-04515",
    client: "BEKONO Suzanne",
    purpose: "Habitat Social SIC",
    trancheNumber: "Tranche Unique (Acquisition)",
    trancheAmount: "12 800 000 FCFA",
    beneficiaryBank: "Compte Séquestre Notaire",
    vdStatus: "Déblocage Notarié Ordonnancé",
    date: "01 Sept 2026",
  },
  {
    id: "f4",
    ducId: "CFC-2026-DUC-04530",
    client: "SONG Emmanuel",
    purpose: "Travaux Second Œuvre (Douala)",
    trancheNumber: "Tranche 3/3 (Finitions)",
    trancheAmount: "4 200 000 FCFA",
    beneficiaryBank: "Société Générale Cameroun",
    vdStatus: "En Attente Visa Contrôle Financier",
    date: "30 Août 2026",
  },
];

export default function DfbcDecaissementsActorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = dfbcDossiers.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.purpose.toLowerCase().includes(search.toLowerCase()) ||
      d.beneficiaryBank.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G7
            </Badge>
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Finances, Budget & Comptabilité (DFBC)
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            DFBC — Décaissements & Vie des Prêts
          </h1>
          <p className="text-sm text-muted-foreground">
            Comptabilité clientèle, déblocages échelonnés par tranche selon la Valeur Disponible (VD), suivi des décomptes BET et recouvrement des échéances SYSTAC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Journal des Règlements
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={dfbcKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur, N° DUC, banque ou tranche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase 5 du Circuit CFC · Déblocages Échelonnés & Amortissement</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Bénéficiaire / Projet</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Tranche / Phase Travaux</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Tranche</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Banque / Canal</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Décaissement</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-teal-500/15 text-teal-800">
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
                  <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">{item.trancheNumber}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.trancheAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.beneficiaryBank}</TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        item.vdStatus.includes("Exécuté") || item.vdStatus.includes("Validé")
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
                          : "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 h-5 px-2 text-xs font-medium"
                      }
                    >
                      {item.vdStatus}
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
