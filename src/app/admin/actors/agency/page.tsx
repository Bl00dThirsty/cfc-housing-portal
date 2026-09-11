"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const agenceKpis: ActorKpiItem[] = [
  {
    title: "Dossiers Enrôlés (Mois)",
    value: "1 240",
    change: "14.8%",
    isPositive: true,
    previous: "1 080",
    period: "ce mois",
  },
  {
    title: "Collecte Épargne Habitat",
    value: "845,2 M FCFA",
    change: "18.4%",
    isPositive: true,
    previous: "713,8 M FCFA",
    period: "ce mois",
  },
  {
    title: "Comptes KYC Conformes",
    value: "842",
    change: "8.2%",
    isPositive: true,
    previous: "778",
    period: "ce mois",
  },
  {
    title: "Taux d'Apport Moyen",
    value: "21.8%",
    change: "1.5%",
    isPositive: true,
    previous: "20.3%",
    period: "ce mois",
  },
  {
    title: "Transmis BET / Risques",
    value: "314",
    change: "12.0%",
    isPositive: true,
    previous: "280",
    period: "ce mois",
  },
];

const agenceDossiers = [
  {
    id: "d1",
    ducId: "CFC-2026-DUC-04829",
    client: "ABANDA Eric",
    profession: "Cadre Bancaire (Salarié)",
    agency: "Agence Yaoundé Centre",
    savingsAmount: "4 800 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "Aujourd'hui, 14:30",
  },
  {
    id: "d2",
    ducId: "CFC-2026-DUC-04910",
    client: "FOKAM Emmanuel",
    profession: "Commerçant (Indépendant)",
    agency: "Agence Douala Bonanjo",
    savingsAmount: "2 400 000 FCFA",
    savingsProgress: "65%",
    status: "Épargne en cours",
    date: "Hier, 11:15",
  },
  {
    id: "d3",
    ducId: "CFC-2026-DUC-04922",
    client: "EBALE Marthe",
    profession: "Enseignante (Fonction Publique)",
    agency: "Agence Bafoussam",
    savingsAmount: "3 200 000 FCFA",
    savingsProgress: "80%",
    status: "Pièces KYC en validation",
    date: "01 Sept 2026",
  },
  {
    id: "d4",
    ducId: "CFC-2026-DUC-04935",
    client: "TCHINDA Raoul",
    profession: "Ingénieur Télécom (Diaspora)",
    agency: "Guichet Diaspora / Centre",
    savingsAmount: "6 000 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "31 Août 2026",
  },
];

export default function AgenceActorPage() {
  const [search, setSearch] = React.useState("");

  const filtered = agenceDossiers.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.agency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G1
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent h-5 px-2 text-xs font-medium">
              Production des Crédits
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agence & Réseau Commercial (CFC)
          </h1>
          <p className="text-sm text-muted-foreground">
            Enrôlement citoyen, suivi des versements Épargne Habitat (MoMo/SYSTAC) et complétude du Dossier Unique Client (DUC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Portefeuille
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={agenceKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par emprunteur, N° DUC ou agence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase 1 du Circuit CFC · Enrôlement & Épargne</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Agence de Rattachement</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Épargne Constituée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Instruction</TableHead>
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
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">{item.agency}</TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                    {item.savingsAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        item.status === "Prêt pour BET"
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
                          : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 h-5 px-2 text-xs font-medium"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.date}</TableCell>
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
