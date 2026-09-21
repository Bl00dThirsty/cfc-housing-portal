"use client";

import * as React from "react";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import {
  AgencyDossierDetailsSheet,
  type AgencyDossierItem,
} from "@/components/admin/agency-dossier-details-sheet";

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

const agenceDossiers: AgencyDossierItem[] = [
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
  {
    id: "d5",
    ducId: "CFC-2026-DUC-04940",
    client: "NGO NSOA Marie",
    profession: "Médecin Généraliste",
    agency: "Agence Yaoundé Centre",
    savingsAmount: "2 880 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "30 Août 2026",
  },
  {
    id: "d6",
    ducId: "CFC-2026-DUC-04948",
    client: "TCHOUNGUI Alain",
    profession: "Pharmacien Titulaire",
    agency: "Agence Douala Bonanjo",
    savingsAmount: "4 200 000 FCFA",
    savingsProgress: "75%",
    status: "Épargne en cours",
    date: "29 Août 2026",
  },
  {
    id: "d7",
    ducId: "CFC-2026-DUC-04952",
    client: "EBAH Rodrigue",
    profession: "Architecte DPLG",
    agency: "Agence Yaoundé Centre",
    savingsAmount: "5 100 000 FCFA",
    savingsProgress: "80%",
    status: "Pièces KYC en validation",
    date: "28 Août 2026",
  },
  {
    id: "d8",
    ducId: "CFC-2026-DUC-04959",
    client: "NDONGO Valérie",
    profession: "Directrice Financière (Diaspora)",
    agency: "Guichet Diaspora / Centre",
    savingsAmount: "9 000 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "27 Août 2026",
  },
];

export default function AgenceActorPage() {
  const [search, setSearch] = React.useState("");
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = React.useState<string[]>([]);
  const [selectedDossier, setSelectedDossier] = React.useState<AgencyDossierItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const statusOptions = React.useMemo(() => [
    {
      label: "Prêt pour BET",
      value: "Prêt pour BET",
      count: agenceDossiers.filter((d) => d.status === "Prêt pour BET").length,
    },
    {
      label: "Épargne en cours",
      value: "Épargne en cours",
      count: agenceDossiers.filter((d) => d.status === "Épargne en cours").length,
    },
    {
      label: "Pièces KYC en validation",
      value: "Pièces KYC en validation",
      count: agenceDossiers.filter((d) => d.status === "Pièces KYC en validation").length,
    },
  ], []);

  const agencyOptions = React.useMemo(() => [
    {
      label: "Yaoundé Centre",
      value: "Agence Yaoundé Centre",
      count: agenceDossiers.filter((d) => d.agency === "Agence Yaoundé Centre").length,
    },
    {
      label: "Douala Bonanjo",
      value: "Agence Douala Bonanjo",
      count: agenceDossiers.filter((d) => d.agency === "Agence Douala Bonanjo").length,
    },
    {
      label: "Bafoussam",
      value: "Agence Bafoussam",
      count: agenceDossiers.filter((d) => d.agency === "Agence Bafoussam").length,
    },
    {
      label: "Guichet Diaspora",
      value: "Guichet Diaspora / Centre",
      count: agenceDossiers.filter((d) => d.agency === "Guichet Diaspora / Centre").length,
    },
  ], []);

  const filtered = agenceDossiers.filter((d) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.client.toLowerCase().includes(q) ||
      d.ducId.toLowerCase().includes(q) ||
      d.profession.toLowerCase().includes(q) ||
      d.agency.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(d.status);
    const matchesAgency =
      selectedAgencies.length === 0 || selectedAgencies.includes(d.agency);

    return matchesSearch && matchesStatus && matchesAgency;
  });

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
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <DataTableToolbar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par emprunteur, N° DUC ou agence..."
          totalCount={agenceDossiers.length}
          filteredCount={filtered.length}
          unitName="dossiers"
          filters={[
            {
              id: "status",
              title: "Statut",
              options: statusOptions,
              selectedValues: selectedStatuses,
              onSelect: setSelectedStatuses,
            },
            {
              id: "agency",
              title: "Agence",
              options: agencyOptions,
              selectedValues: selectedAgencies,
              onSelect: setSelectedAgencies,
            },
          ]}
          onResetAll={() => {
            setSelectedStatuses([]);
            setSelectedAgencies([]);
          }}
        />

        {/* Table */}
        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                    Aucun dossier ne correspond aux filtres sélectionnés.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => {
                      setSelectedDossier(item);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
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
                    <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDossier(item);
                          setIsDetailsOpen(true);
                        }}
                        className="size-8 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dedicated Details Sheet */}
      <AgencyDossierDetailsSheet
        dossier={selectedDossier}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
