"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { getInitials } from "@/lib/utils";

const betDossiers = [
  {
    id: "b1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    project: "Construction Villa R+1 (Olembé)",
    expertBET: "Lucien Fame (BET Epsilon)",
    estimatedCost: "18 500 000 FCFA",
    debtRatio: "27.5%",
    status: "Rapport Visite Validé",
    date: "Aujourd'hui, 09:45",
  },
  {
    id: "b2",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    expertBET: "Cabinet BET Ingénierie",
    estimatedCost: "35 000 000 FCFA",
    debtRatio: "28.4%",
    status: "Devis sous réserve plan béton",
    date: "Hier, 16:20",
  },
  {
    id: "b3",
    ducId: "CFC-2026-DUC-04840",
    client: "ATANGANA Thérèse",
    project: "Acquisition & Extension (Mbankolo)",
    expertBET: "Direction des Risques CFC",
    estimatedCost: "12 000 000 FCFA",
    debtRatio: "31.2%",
    status: "Contrôle Solvabilité Conforme",
    date: "01 Sept 2026",
  },
  {
    id: "b4",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    project: "Construction Logement Social (Kribi)",
    expertBET: "BET Littoral Sud",
    estimatedCost: "15 000 000 FCFA",
    debtRatio: "24.8%",
    status: "Visite Terrain Programmée",
    date: "31 Août 2026",
  },
];

type BetDossier = (typeof betDossiers)[number];

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-risk-engineering";

/**
 * Les colonnes du tableau des dossiers en expertise.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const RISK_COLUMNS: DataColumn<BetDossier>[] = [
  {
    key: "client",
    label: "Emprunteur / Projet",
    accessor: (row) => row.client,
    // Le projet est affiché **sous le nom** dans la ligne : il n'est pas une
    // colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.project],
    // Ni facette ni regroupement : une facette « Emprunteur » listerait une
    // option par dossier.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-800">
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
    key: "expertBET",
    label: "Expertise / BET Agréé",
    accessor: (row) => row.expertBET,
    filterable: true,
    groupable: true,
  },
  {
    key: "estimatedCost",
    label: "Montant Travaux",
    // Le tri porte sur la **valeur** : « 18 500 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.estimatedCost.replace(/\D/g, "")),
    render: (row) => row.estimatedCost,
    align: "right",
  },
  {
    key: "debtRatio",
    label: "Ratio Endettement",
    // Le ratio se compare par sa valeur ; l'affichage garde son « % ».
    accessor: (row) => Number(row.debtRatio.replace("%", "")),
    render: (row) => row.debtRatio,
    searchValues: (row) => [row.debtRatio],
    align: "center",
  },
  {
    key: "status",
    label: "Avis Technique",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.status.includes("Validé") || row.status.includes("Conforme")
            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
            : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 h-5 px-2 text-xs font-medium"
        }
      >
        {row.status}
      </Badge>
    ),
  },
  {
    // La colonne d'actions ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "actions",
    label: "Actions",
    sortable: false,
    render: () => (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
      >
        <Eye className="size-4" />
      </Button>
    ),
  },
];

export function BetRisquesActorPage({ kpi }: { kpi: React.ReactNode }) {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: RISK_COLUMNS,
    rows: betDossiers,
  });

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
      cell,
    }: {
      row: BetDossier;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">
          {cell("expertBET")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("estimatedCost")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center">{cell("debtRatio")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("rapport-risques.csv", [
      [
        "Emprunteur",
        "Projet",
        "Identifiant DUC",
        "Expertise / BET Agréé",
        "Montant Travaux",
        "Ratio Endettement",
        "Avis Technique",
      ],
      ...betDossiers.map((dossier) => [
        dossier.client,
        dossier.project,
        dossier.ducId,
        dossier.expertBET,
        dossier.estimatedCost,
        dossier.debtRatio,
        dossier.status,
      ]),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G3
            </Badge>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent h-5 px-2 text-xs font-medium">
              Risques &amp; Expertise BET
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Direction des Risques &amp; Expertise BET
          </h1>
          <p className="text-sm text-muted-foreground">
            Évaluation de la solvabilité ménage, calcul du ratio d&apos;endettement COBAC, contre-expertise des devis et rapports de visite contradictoire.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      {kpi}

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Phase 2 du Circuit CFC · Analyse Technique &amp; Prudentielle</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={RISK_COLUMNS}
          rows={betDossiers}
          unitName="dossiers"
          searchPlaceholder="Rechercher par demandeur, N° DUC, BET ou projet..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={RISK_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
