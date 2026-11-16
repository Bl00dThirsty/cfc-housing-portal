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

const directoryKpis: ActorKpiItem[] = [
  {
    title: "Cabinets Agréés Actifs",
    value: "42",
    change: "10.5%",
    isPositive: true,
    previous: "38 cabinets",
    period: "au niveau national",
  },
  {
    title: "Missions Confiées (Mois)",
    value: "184",
    change: "12.8%",
    isPositive: true,
    previous: "163 missions",
    period: "ce mois",
  },
  {
    title: "Note Qualité Moyenne",
    value: "4.7 / 5",
    change: "4.4%",
    isPositive: true,
    previous: "4.5 / 5",
    period: "satisfaction CFC",
  },
  {
    title: "Délai d'Expertise Moyen",
    value: "3.8 jours",
    change: "11.4%",
    isPositive: true,
    previous: "4.3 jours",
    period: "cible ≤ 5j",
  },
  {
    title: "En Audit de Renouvellement",
    value: "3",
    change: "25.0%",
    isPositive: true,
    previous: "4",
    period: "revue triennale",
  },
];

const directoryRecords = [
  {
    id: "dir1",
    name: "BET Epsilon Cameroun",
    lead: "Ing. Lucien Fame (ONIGC)",
    approvalCode: "BET-CFC-2024-019",
    specialty: "Génie Civil & Structure",
    region: "Centre, Sud & Est",
    activeMissions: 18,
    status: "Agréé Actif",
    rating: "4.9 / 5",
  },
  {
    id: "dir2",
    name: "Cabinet Polytech Sarl",
    lead: "Arch. Danielle Mbia (ONAC)",
    approvalCode: "BET-CFC-2023-008",
    specialty: "Architecture & Urbanisme",
    region: "Littoral & Sud-Ouest",
    activeMissions: 14,
    status: "Agréé Actif",
    rating: "4.8 / 5",
  },
  {
    id: "dir3",
    name: "Laboratoire Géotechnique du Cameroun",
    lead: "Dr. Paul Ebanda (Géologue)",
    approvalCode: "BET-CFC-2024-031",
    specialty: "Sols & Fondations Spéciales",
    region: "National (10 Régions)",
    activeMissions: 22,
    status: "Agréé Actif",
    rating: "4.7 / 5",
  },
  {
    id: "dir4",
    name: "BET Ingénierie Littoral",
    lead: "Ing. Charles Talla",
    approvalCode: "BET-CFC-2022-014",
    specialty: "Génie Civil & Voiries",
    region: "Littoral & Ouest",
    activeMissions: 9,
    status: "En Renouvellement",
    rating: "4.4 / 5",
  },
  {
    id: "dir5",
    name: "Sahel Expertises BTP",
    lead: "Ing. Ahmadou Bello",
    approvalCode: "BET-CFC-2024-044",
    specialty: "Bâtiment & Fluides",
    region: "Adamaoua, Nord, Extrême-Nord",
    activeMissions: 7,
    status: "Agréé Actif",
    rating: "4.6 / 5",
  },
  {
    id: "dir6",
    name: "Cabinet Bâtir Sain",
    lead: "Ing. Marcelle Ngo",
    approvalCode: "BET-CFC-2021-003",
    specialty: "Économie de la Construction",
    region: "Centre",
    activeMissions: 0,
    status: "Suspendu (Audit)",
    rating: "3.8 / 5",
  },
];

type DirectoryRecord = (typeof directoryRecords)[number];

const approvalStatusStyles: Record<string, string> = {
  "Agréé Actif": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En Renouvellement": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Suspendu (Audit)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-risk-engineering-directory";

/**
 * Les colonnes de l'annuaire des BET.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const DIRECTORY_COLUMNS: DataColumn<DirectoryRecord>[] = [
  {
    key: "name",
    label: "Cabinet / Expert Agréé",
    accessor: (row) => row.name,
    // L'expert titulaire est affiché **sous le nom** dans la ligne : il n'est
    // pas une colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.lead],
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-xs text-foreground truncate">
          {row.name}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {row.lead}
        </span>
      </div>
    ),
  },
  {
    key: "approvalCode",
    label: "N° Agrément CFC",
    accessor: (row) => row.approvalCode,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.approvalCode}
      </Badge>
    ),
  },
  {
    key: "specialty",
    label: "Domaine de Compétence",
    accessor: (row) => row.specialty,
    filterable: true,
    groupable: true,
  },
  {
    key: "region",
    label: "Zone de Couverture",
    accessor: (row) => row.region,
    filterable: true,
    groupable: true,
  },
  {
    key: "activeMissions",
    label: "Missions En Cours",
    accessor: (row) => row.activeMissions,
    align: "center",
  },
  {
    key: "rating",
    label: "Note Qualité",
    // La note se compare par sa valeur ; l'affichage garde « 4.9 / 5 ».
    accessor: (row) => Number(row.rating.split("/")[0].trim()),
    render: (row) => row.rating,
    searchValues: (row) => [row.rating],
    align: "center",
  },
  {
    key: "status",
    label: "Statut Agrément",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${approvalStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
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

export default function DirectoryPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: DIRECTORY_COLUMNS,
    rows: directoryRecords,
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
      row: DirectoryRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("name")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("approvalCode")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">
          {cell("specialty")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
          {cell("region")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-foreground">
          {cell("activeMissions")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono text-xs font-medium text-foreground">
          {cell("rating")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("annuaire-bet.csv", [
      [
        "Cabinet / Expert Agréé",
        "Expert Titulaire",
        "N° Agrément CFC",
        "Domaine de Compétence",
        "Zone de Couverture",
        "Missions En Cours",
        "Note Qualité",
        "Statut Agrément",
      ],
      ...directoryRecords.map((record) => [
        record.name,
        record.lead,
        record.approvalCode,
        record.specialty,
        record.region,
        record.activeMissions,
        record.rating,
        record.status,
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
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Partenaires Techniques
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Annuaire des BET &amp; Experts Agréés CFC
          </h1>
          <p className="text-sm text-muted-foreground">
            Répertoire national des bureaux d&apos;études techniques, ingénieurs et architectes habilités aux contre-expertises préalables et réceptions de chantier.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={directoryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Ordre National des Ingénieurs de Génie Civil (ONIGC) &amp; ONAC</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={DIRECTORY_COLUMNS}
          rows={directoryRecords}
          unitName="cabinets"
          searchPlaceholder="Rechercher par cabinet, expert, code agrément ou région..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={DIRECTORY_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun cabinet ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
