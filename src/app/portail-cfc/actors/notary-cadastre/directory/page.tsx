"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";

const notaryDirectoryKpis: ActorKpiItem[] = [
  {
    title: "Notaires Conventionnés",
    value: "36",
    change: "9.1%",
    isPositive: true,
    previous: "33 études",
    period: "au niveau national",
  },
  {
    title: "Actes en Cours de Signature",
    value: "78",
    change: "11.4%",
    isPositive: true,
    previous: "70 actes",
    period: "ce mois",
  },
  {
    title: "Délai Moyen Signature",
    value: "4.2 jours",
    change: "12.5%",
    isPositive: true,
    previous: "4.8 jours",
    period: "cible ≤ 5j",
  },
  {
    title: "Grosses d'Actes Reçues",
    value: "52",
    change: "18.2%",
    isPositive: true,
    previous: "44 grosses",
    period: "archivage CFC",
  },
  {
    title: "Études en Retard de Clôture",
    value: "2",
    change: "50.0%",
    isPositive: true,
    previous: "4 études",
    period: "relances automatiques",
  },
];

const notaryDirectoryRecords = [
  {
    id: "not1",
    notaryOffice: "Étude Me Nkouendjin Yoya",
    notaryName: "Me Emmanuel Nkouendjin",
    city: "Yaoundé (Centre)",
    activeActs: 16,
    avgDelay: "3.8 jours",
    grossesDeposited: 42,
    status: "Conventionné Actif",
    complianceRate: "98.5%",
  },
  {
    id: "not2",
    notaryOffice: "Étude Me Douala Manga Bell",
    notaryName: "Me Mireille Douala Manga",
    city: "Douala (Littoral)",
    activeActs: 19,
    avgDelay: "4.1 jours",
    grossesDeposited: 58,
    status: "Conventionné Actif",
    complianceRate: "97.0%",
  },
  {
    id: "not3",
    notaryOffice: "Étude Me Bisseck & Associés",
    notaryName: "Me Jacques Bisseck",
    city: "Kribi (Sud)",
    activeActs: 8,
    avgDelay: "4.5 jours",
    grossesDeposited: 21,
    status: "Conventionné Actif",
    complianceRate: "95.2%",
  },
  {
    id: "not4",
    notaryOffice: "Étude Me Kamdem Henri",
    notaryName: "Me Henri Kamdem",
    city: "Bafoussam (Ouest)",
    activeActs: 11,
    avgDelay: "5.2 jours",
    grossesDeposited: 34,
    status: "Conventionné Actif",
    complianceRate: "94.0%",
  },
  {
    id: "not5",
    notaryOffice: "Étude Me Bello Ousmanou",
    notaryName: "Me Ousmanou Bello",
    city: "Garoua (Nord)",
    activeActs: 6,
    avgDelay: "4.9 jours",
    grossesDeposited: 15,
    status: "En Revue Triennale",
    complianceRate: "91.8%",
  },
  {
    id: "not6",
    notaryOffice: "Étude Me Fotso Jean",
    notaryName: "Me Jean Fotso",
    city: "Nkongsamba (Moungo)",
    activeActs: 1,
    avgDelay: "7.8 jours",
    grossesDeposited: 9,
    status: "Relance Retard",
    complianceRate: "82.0%",
  },
];

type NotaryDirectoryRecord = (typeof notaryDirectoryRecords)[number];

const notaryStatusStyles: Record<string, string> = {
  "Conventionné Actif": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En Revue Triennale": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Relance Retard": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-notary-cadastre-directory";

/**
 * Les colonnes de l'annuaire des études notariales.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const NOTARY_DIRECTORY_COLUMNS: DataColumn<NotaryDirectoryRecord>[] = [
  {
    key: "notaryOffice",
    label: "Étude Notariale",
    accessor: (row) => row.notaryOffice,
    filterable: false,
    groupable: false,
  },
  {
    key: "notaryName",
    label: "Notaire Titulaire",
    accessor: (row) => row.notaryName,
  },
  {
    key: "city",
    label: "Ville / Région",
    accessor: (row) => row.city,
    filterable: true,
    groupable: true,
  },
  {
    key: "activeActs",
    label: "Actes En Cours",
    accessor: (row) => row.activeActs,
    align: "center",
  },
  {
    key: "avgDelay",
    label: "Délai Moyen",
    // Le délai se compare par sa valeur ; l'affichage garde son « jours ».
    accessor: (row) => Number(row.avgDelay.split(" ")[0]),
    render: (row) => row.avgDelay,
    searchValues: (row) => [row.avgDelay],
    align: "center",
  },
  {
    key: "grossesDeposited",
    label: "Grosses Déposées",
    accessor: (row) => row.grossesDeposited,
    align: "center",
  },
  {
    key: "status",
    label: "Statut Convention",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${notaryStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "complianceRate",
    label: "Conformité",
    // Le taux se compare par sa valeur ; l'affichage garde son « % ».
    accessor: (row) => Number(row.complianceRate.replace("%", "")),
    render: (row) => row.complianceRate,
    searchValues: (row) => [row.complianceRate],
    align: "center",
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

export default function NotaryDirectoryPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: NOTARY_DIRECTORY_COLUMNS,
    rows: notaryDirectoryRecords,
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
      row: NotaryDirectoryRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">
          <span className="font-semibold text-xs text-foreground block max-w-[200px] truncate">
            {cell("notaryOffice")}
          </span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">
          {cell("notaryName")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
          {cell("city")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-foreground">
          {cell("activeActs")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono text-xs text-foreground">
          {cell("avgDelay")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono text-xs text-muted-foreground">
          {cell("grossesDeposited")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
          {cell("complianceRate")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("annuaire-notaires.csv", [
      [
        "Étude Notariale",
        "Notaire Titulaire",
        "Ville / Région",
        "Actes En Cours",
        "Délai Moyen",
        "Grosses Déposées",
        "Statut Convention",
        "Conformité",
      ],
      ...notaryDirectoryRecords.map((record) => [
        record.notaryOffice,
        record.notaryName,
        record.city,
        record.activeActs,
        record.avgDelay,
        record.grossesDeposited,
        record.status,
        record.complianceRate,
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
              Groupe G8
            </Badge>
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-transparent h-5 px-2 text-xs font-medium">
              Réseau Notarial Agréé
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Études Notariales Partenaires &amp; Suivi des Minutes
          </h1>
          <p className="text-sm text-muted-foreground">
            Répertoire des études notariales conventionnées CFC, suivi de la signature des conventions d&apos;ouverture de crédit et conservation des grosses authentiques.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={notaryDirectoryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Chambre Nationale des Notaires du Cameroun (CNNC) · Conventions CFC</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={NOTARY_DIRECTORY_COLUMNS}
          rows={notaryDirectoryRecords}
          unitName="études"
          searchPlaceholder="Rechercher par étude, notaire titulaire ou ville..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={NOTARY_DIRECTORY_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune étude ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
