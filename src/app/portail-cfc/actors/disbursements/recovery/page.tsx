"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const recoveryKpis: ActorKpiItem[] = [
  {
    title: "Taux PAR 30 (Impayés > 30j)",
    value: "2.4%",
    change: "0.3%",
    isPositive: true,
    previous: "2.7%",
    period: "seuil COBAC ≤ 5%",
  },
  {
    title: "Encours en Souffrance",
    value: "86 M FCFA",
    change: "12.2%",
    isPositive: true,
    previous: "98 M FCFA",
    period: "portefeuille total",
  },
  {
    title: "Promesses de Paiement Tenues",
    value: "82.5%",
    change: "5.0%",
    isPositive: true,
    previous: "77.5%",
    period: "relances amiables",
  },
  {
    title: "Dossiers Régularisés (Mois)",
    value: "41",
    change: "17.1%",
    isPositive: true,
    previous: "35 dossiers",
    period: "ce mois",
  },
  {
    title: "Transmis au Pré-Contentieux",
    value: "6",
    change: "25.0%",
    isPositive: true,
    previous: "8 dossiers",
    period: "impayés > 90 jours",
  },
];

const recoveryRecords = [
  {
    id: "rec1",
    ref: "REC-2026-00145",
    client: "MVONDO Daniel",
    profession: "Commerçant Indépendant",
    ducId: "CFC-2024-DUC-01980",
    agingCategory: "PAR 30 (1 échéance)",
    overdueAmount: "185 000 FCFA",
    lastAction: "SMS de relance automatique",
    status: "Promesse au 15/09",
    dueDate: "Échue le 05 Août 2026",
  },
  {
    id: "rec2",
    ref: "REC-2026-00144",
    client: "FOTSING Pascal",
    profession: "Transporteur Urbain",
    ducId: "CFC-2025-DUC-03120",
    agingCategory: "PAR 60 (2 échéances)",
    overdueAmount: "412 000 FCFA",
    lastAction: "Entretien téléphonique gestionnaire",
    status: "Protocole en cours",
    dueDate: "Échue le 05 Juillet 2026",
  },
  {
    id: "rec3",
    ref: "REC-2026-00143",
    client: "BISSOHONG Christine",
    profession: "Employée Secteur Privé",
    ducId: "CFC-2024-DUC-02315",
    agingCategory: "PAR 90 (3 échéances)",
    overdueAmount: "645 000 FCFA",
    lastAction: "Mise en demeure avec AR",
    status: "Pré-contentieux",
    dueDate: "Échue le 05 Juin 2026",
  },
  {
    id: "rec4",
    ref: "REC-2026-00142",
    client: "EBOLO Vincent",
    profession: "Prestataire Événementiel",
    ducId: "CFC-2025-DUC-03890",
    agingCategory: "PAR 30 (1 échéance)",
    overdueAmount: "140 000 FCFA",
    lastAction: "Appel de courtoisie",
    status: "Promesse au 12/09",
    dueDate: "Échue le 05 Août 2026",
  },
  {
    id: "rec5",
    ref: "REC-2026-00141",
    client: "NGUIMBOUS Thomas",
    profession: "Entrepreneur BTP",
    ducId: "CFC-2023-DUC-01120",
    agingCategory: "PAR 90+ (Contentieux)",
    overdueAmount: "1 850 000 FCFA",
    lastAction: "Sommation de payer par Huissier",
    status: "Transmission CRC",
    dueDate: "Échue le 05 Avril 2026",
  },
  {
    id: "rec6",
    ref: "REC-2026-00140",
    client: "KENGNE Monique",
    profession: "Agent Commercial",
    ducId: "CFC-2025-DUC-03650",
    agingCategory: "Régularisé",
    overdueAmount: "0 FCFA",
    lastAction: "Règlement intégral constaté",
    status: "Régularisé",
    dueDate: "Apurement validé",
  },
];

const recoveryStatusStyles: Record<string, string> = {
  "Régularisé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Promesse au 15/09": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Promesse au 12/09": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Protocole en cours": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Pré-contentieux": "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Transmission CRC": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function RecoveryPage() {
  const [search, setSearch] = React.useState("");

  const filtered = recoveryRecords.filter(
    (r) =>
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.ref.toLowerCase().includes(search.toLowerCase()) ||
      r.ducId.toLowerCase().includes(search.toLowerCase()) ||
      r.agingCategory.toLowerCase().includes(search.toLowerCase())
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
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent h-5 px-2 text-xs font-medium">
              Recouvrement &amp; Contentieux
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Recouvrement Amiable &amp; Pré-Contentieux
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion graduée des impayés (PAR 30, 60, 90 jours), suivi des promesses de règlement, protocoles de rattrapage et déclenchement des procédures pré-contentieuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Portefeuille Impayés
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={recoveryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, débiteur, N° DUC ou catégorie d'impayé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Procédure graduée de recouvrement amiable préalable à la déchéance du terme</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Recouvrement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Débiteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Catégorie Retard</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Impayé</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Dernière Action Relance</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Dossier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Échéance</TableHead>
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
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-800">
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
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-medium h-5 px-2 bg-muted/50"
                    >
                      {item.agingCategory}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.overdueAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[190px]">
                    <span className="truncate block">{item.lastAction}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${recoveryStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.dueDate}
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
