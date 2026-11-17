"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, CheckCircle2, Clock, FileText, ArrowRight } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/csv";
import { getInitials } from "@/lib/utils";

const ducKpis: ActorKpiItem[] = [
  {
    title: "Dossier Unique Client (DUC) en Pipeline",
    value: "1 240",
    change: "15.8%",
    isPositive: true,
    previous: "1 071",
    period: "ce mois",
  },
  {
    title: "Complétude Moyenne Pièces",
    value: "84.2%",
    change: "6.4%",
    isPositive: true,
    previous: "77.8%",
    period: "GED numérique",
  },
  {
    title: "Délai Enrôlement → Décision",
    value: "14,5 jours",
    change: "18.5%",
    isPositive: true,
    previous: "17,8 jours",
    period: "cible ≤ 15j",
  },
  {
    title: "Taux Accord Comités CGR/CRC",
    value: "92.4%",
    change: "2.1%",
    isPositive: true,
    previous: "90.3%",
    period: "décisions favorables",
  },
  {
    title: "Financements Décaissés",
    value: "4,85 Mds FCFA",
    change: "24.0%",
    isPositive: true,
    previous: "3,91 Mds FCFA",
    period: "cumul exercice",
  },
];

interface DucDossier {
  id: string;
  ducId: string;
  client: string;
  project: string;
  currentPhase: "G1 · Enrôlement & Épargne" | "G3 · Risques & BET" | "G6 · Comités CGR/CRC" | "G8 · Notaires & Cadastre" | "G7 · Décaissements DFBC" | "G4 · Clôture";
  phaseCode: "G1" | "G3" | "G6" | "G8" | "G7" | "G4";
  completionPercent: number;
  loanAmount: string;
  landTitle: string;
  officer: string;
  lastUpdate: string;
  createdDate: string;
  riskStatus: "Faible" | "Modéré" | "Attention";
}

const ducList: DucDossier[] = [
  {
    id: "duc1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    project: "Construction Villa R+1 (Olembé)",
    currentPhase: "G3 · Risques & BET",
    phaseCode: "G3",
    completionPercent: 85,
    loanAmount: "18 500 000 FCFA",
    landTitle: "TF N° 4892/Mfoundi",
    officer: "Mme Belinga (Agence Centre)",
    lastUpdate: "Aujourd'hui, 11:10",
    createdDate: "12 Août 2026",
    riskStatus: "Faible",
  },
  {
    id: "duc2",
    ducId: "CFC-2026-DUC-04712",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    currentPhase: "G6 · Comités CGR/CRC",
    phaseCode: "G6",
    completionPercent: 95,
    loanAmount: "25 000 000 FCFA",
    landTitle: "TF N° 12450/Wouri",
    officer: "M. Talla (Agence Bonanjo)",
    lastUpdate: "Hier, 16:45",
    createdDate: "05 Juillet 2026",
    riskStatus: "Modéré",
  },
  {
    id: "duc3",
    ducId: "CFC-2026-DUC-04655",
    client: "NGO NSOA Marie",
    project: "Acquisition Appartement SIC (Mbankolo)",
    currentPhase: "G8 · Notaires & Cadastre",
    phaseCode: "G8",
    completionPercent: 90,
    loanAmount: "14 400 000 FCFA",
    landTitle: "TF N° 3110/Mfoundi",
    officer: "M. Etoa (Guichet Siège)",
    lastUpdate: "02 Sept 2026",
    createdDate: "20 Juin 2026",
    riskStatus: "Faible",
  },
  {
    id: "duc4",
    ducId: "CFC-2026-DUC-04410",
    client: "EBAH Rodrigue",
    project: "Construction Pavillon (Yaoundé)",
    currentPhase: "G7 · Décaissements DFBC",
    phaseCode: "G7",
    completionPercent: 100,
    loanAmount: "18 000 000 FCFA",
    landTitle: "TF N° 7812/Mfoundi",
    officer: "DFBC Trésorerie",
    lastUpdate: "01 Sept 2026",
    createdDate: "15 Avril 2026",
    riskStatus: "Faible",
  },
  {
    id: "duc5",
    ducId: "CFC-2026-DUC-04880",
    client: "ATANGANA Thérèse",
    project: "Acquisition & Extension (Mbankolo)",
    currentPhase: "G1 · Enrôlement & Épargne",
    phaseCode: "G1",
    completionPercent: 60,
    loanAmount: "12 000 000 FCFA",
    landTitle: "TF N° 9042/Mfoundi",
    officer: "M. Onana (Agence Bastos)",
    lastUpdate: "30 Août 2026",
    createdDate: "24 Août 2026",
    riskStatus: "Attention",
  },
];

const phaseStyles: Record<string, string> = {
  G1: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  G3: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  G6: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  G8: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  G7: "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  G4: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "analytics-dossiers";

/**
 * Les colonnes du tableau des dossiers DUC.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const DUC_COLUMNS: DataColumn<DucDossier>[] = [
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.ducId}
      </Badge>
    ),
  },
  {
    key: "client",
    label: "Emprunteur / Projet",
    accessor: (row) => row.client,
    // Le projet est affiché **sous le nom** dans la ligne : il n'est pas une
    // colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.project],
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">
            {row.client}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {row.project}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "phase",
    label: "Étape Actuelle (Acteur)",
    accessor: (row) => row.currentPhase,
    // La phase est la facette qui remplace les anciens boutons « Tous / G3
    // Risques / G6 Comités » : l'agent y choisit ses étapes.
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${phaseStyles[row.phaseCode] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.currentPhase}
      </Badge>
    ),
  },
  {
    key: "completion",
    label: "Complétude GED",
    // Le tri porte sur le **nombre** de complétude, pas sur son libellé.
    accessor: (row) => row.completionPercent,
    render: (row) => (
      <div className="flex flex-col gap-1 min-w-[90px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground">
            {row.completionPercent}%
          </span>
        </div>
        <Progress value={row.completionPercent} className="h-1.5" />
      </div>
    ),
  },
  {
    key: "loanAmount",
    label: "Montant Crédit",
    // Le tri porte sur la **valeur** : « 18 500 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.loanAmount.replace(/\D/g, "")),
    render: (row) => row.loanAmount,
    align: "right",
  },
  {
    key: "landTitle",
    label: "Garantie Foncier",
    accessor: (row) => row.landTitle,
    render: (row) => (
      <Badge
        variant="secondary"
        className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200 border-transparent"
      >
        {row.landTitle}
      </Badge>
    ),
  },
  {
    key: "lastUpdate",
    label: "Dernière MAJ",
    // La source mêle des dates relatives (« Aujourd'hui, 11:10 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.lastUpdate,
    sortable: false,
  },
  {
    // La colonne d'actions porte un menu, pas une valeur : elle n'est ni
    // triable ni filtrable.
    key: "action",
    label: "Actions",
    sortable: false,
    align: "right",
  },
];

export function DossiersDucTab() {
  const router = useRouter();

  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: DUC_COLUMNS,
    rows: ducList,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   */
  const visible = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups],
  );

  /**
   * La ligne du tableau.
   *
   * L'écran garde la main sur sa mise en page ; le moteur lui fournit les
   * **valeurs** des cellules.
   */
  const renderRow = React.useCallback(
    ({
      row,
      cell,
    }: {
      row: DucDossier;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openDossier = () =>
        router.push(`/portail-cfc/analytics/dossiers/${row.id}`);

      return (
        <TableRow
          onClick={openDossier}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDossier();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Ouvrir le dossier DUC de ${row.client}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("phase")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("completion")}</TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
            {cell("loanAmount")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
            {cell("lastUpdate")}
          </TableCell>
          <TableCell
            className="text-right pr-4 py-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-xl">
                <DropdownMenuLabel className="text-xs font-semibold">
                  Actions Dossier Unique Client (DUC)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openDossier}
                  className="cursor-pointer text-xs"
                >
                  <FileText className="size-3.5 mr-2 text-muted-foreground" />
                  Consulter la fiche DUC détaillée
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openDossier}
                  className="cursor-pointer text-xs"
                >
                  <CheckCircle2 className="size-3.5 mr-2 text-muted-foreground" />
                  Contrôler la checklist des pièces
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openDossier}
                  className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 font-medium"
                >
                  <ArrowRight className="size-3.5 mr-2" />
                  Transmettre au service suivant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openDossier}
                  className="cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                >
                  <Clock className="size-3.5 mr-2" />
                  Relancer pièces manquantes (SMS)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  const handleExport = () => {
    downloadCsv("dossiers-duc-cfc.csv", [
      [
        "DUC",
        "Emprunteur",
        "Projet",
        "Phase",
        "Complétude GED",
        "Montant Crédit",
        "Titre Foncier",
        "Dernière MAJ",
      ],
      ...ducList.map((row) => [
        row.ducId,
        row.client,
        row.project,
        row.currentPhase,
        `${row.completionPercent}%`,
        row.loanAmount,
        row.landTitle,
        row.lastUpdate,
      ]),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 5 KPIs Strip without icons */}
      <ActorKpiStrip items={ducKpis} />

      {/* Funnel Pipeline Visual */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {[
          { phase: "G1 · Enrôlement", count: "480", share: "100%", color: "bg-blue-500" },
          { phase: "G3 · Risques BET", count: "312", share: "65%", color: "bg-amber-500" },
          { phase: "G6 · Comités", count: "198", share: "41%", color: "bg-purple-500" },
          { phase: "G8 · Notariat", count: "142", share: "30%", color: "bg-indigo-500" },
          { phase: "G7 · Décaissements", count: "84", share: "18%", color: "bg-teal-500" },
          { phase: "G4 · Clôture", count: "24", share: "5%", color: "bg-emerald-500" },
        ].map((step) => (
          <div key={step.phase} className="rounded-xl border bg-card p-3 flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] text-muted-foreground truncate">{step.phase}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-foreground">{step.count}</span>
              <span className="text-xs font-mono font-medium text-muted-foreground">{step.share}</span>
            </div>
            <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden mt-1">
              <div className={`h-full ${step.color}`} style={{ width: step.share }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={DUC_COLUMNS}
          rows={ducList}
          unitName="dossiers"
          searchPlaceholder="Rechercher par N° DUC, emprunteur, Titre Foncier..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={DUC_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres appliqués."
          headClassName="bg-muted/40"
        />
      </div>
    </div>
  );
}
