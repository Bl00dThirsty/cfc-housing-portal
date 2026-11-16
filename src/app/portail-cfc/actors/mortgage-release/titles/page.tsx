"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
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

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-mortgage-release-titles";

const titlesKpis: ActorKpiItem[] = [
  {
    title: "Titres Déconsignés (Mois)",
    value: "19",
    change: "26.7%",
    isPositive: true,
    previous: "15 titres",
    period: "ce mois",
  },
  {
    title: "Remis en Mains Propres",
    value: "16",
    change: "33.3%",
    isPositive: true,
    previous: "12 décharges",
    period: "procès-verbaux signés",
  },
  {
    title: "Titres Restants en Coffre",
    value: "2 450",
    change: "0.8%",
    isPositive: true,
    previous: "2 469 titres",
    period: "portefeuille sous sûreté",
  },
  {
    title: "RDV Restitution Fixés",
    value: "3",
    change: "0.0%",
    isPositive: true,
    previous: "3 rendez-vous",
    period: "cette semaine",
  },
  {
    title: "Conformité Protocole Coffre",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "double signature requise",
  },
];

export interface TitleRestitutionItem {
  id: string;
  ref: string;
  landTitle: string;
  client: string;
  ducId: string;
  vaultLocation: string;
  status: string;
  date: string;
}

const titlesRecords: TitleRestitutionItem[] = [
  {
    id: "rst1",
    ref: "REST-TF-2026-00088",
    landTitle: "TF N° 6120/Mfoundi",
    client: "KAMGA Pascal",
    ducId: "CFC-2026-DUC-03890",
    vaultLocation: "Baie A1 / Alvéole 04",
    status: "Remis en mains propres",
    date: "Aujourd'hui, 11:30",
  },
  {
    id: "rst2",
    ref: "REST-TF-2026-00087",
    landTitle: "TF N° 9415/Wouri",
    client: "TCHATCHOUANG Hélène",
    ducId: "CFC-2026-DUC-03912",
    vaultLocation: "Baie B2 / Alvéole 18",
    status: "Prêt pour remise agence",
    date: "Hier, 15:45",
  },
  {
    id: "rst3",
    ref: "REST-TF-2026-00086",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    client: "MVONDO Albert",
    ducId: "CFC-2026-DUC-03945",
    vaultLocation: "Baie A3 / Alvéole 12",
    status: "RDV fixé au 10/09",
    date: "02 Septembre 2026",
  },
  {
    id: "rst4",
    ref: "REST-TF-2026-00085",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    client: "FOUDA Bernadette",
    ducId: "CFC-2026-DUC-03980",
    vaultLocation: "Baie C1 / Alvéole 09",
    status: "En cours de désarchivage",
    date: "01 Septembre 2026",
  },
  {
    id: "rst5",
    ref: "REST-TF-2026-00084",
    landTitle: "TF N° 4118/Sanaga-Maritime",
    client: "BASSOMGBEN Jean",
    ducId: "CFC-2025-DUC-03410",
    vaultLocation: "Baie B1 / Alvéole 22",
    status: "Remis en mains propres",
    date: "28 Août 2026",
  },
  {
    id: "rst6",
    ref: "REST-TF-2026-00083",
    landTitle: "TF N° 8210/Menoua",
    client: "NGUEMO Paul",
    ducId: "CFC-2025-DUC-03150",
    vaultLocation: "Baie A2 / Alvéole 15",
    status: "Remis en mains propres",
    date: "25 Août 2026",
  },
];

const titleStatusStyles: Record<string, string> = {
  "Remis en mains propres": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Prêt pour remise agence": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "RDV fixé au 10/09": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "En cours de désarchivage": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

/**
 * Les colonnes du registre des restitutions de titres fonciers.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const TITLE_COLUMNS: DataColumn<TitleRestitutionItem>[] = [
  {
    key: "ref",
    label: "Réf. Décharge",
    accessor: (row) => row.ref,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.ref}
      </Badge>
    ),
  },
  {
    key: "landTitle",
    label: "Titre Foncier Original",
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
    key: "client",
    label: "Propriétaire Bénéficiaire",
    accessor: (row) => row.client,
    // Un bénéficiaire par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-xs text-foreground truncate">{row.client}</span>
      </div>
    ),
  },
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
    render: (row) => (
      <span className="font-mono text-[11px] text-muted-foreground">{row.ducId}</span>
    ),
  },
  {
    key: "vaultLocation",
    label: "Emplacement Coffre",
    accessor: (row) => row.vaultLocation,
    // Un emplacement par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "status",
    label: "Statut Restitution",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${titleStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date Remise",
    // La source mêle des dates relatives (« Aujourd'hui, 11:30 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.date,
    sortable: false,
  },
  {
    // La colonne d'actions ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "actions",
    label: "Actions",
    sortable: false,
  },
];

export default function OriginalTitlesPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: TITLE_COLUMNS,
    rows: titlesRecords,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * Le moteur a appliqué la recherche, les facettes et le tri ; le tableau
   * reçoit donc ses lignes déjà ordonnées.
   */
  const visibleRecords = React.useMemo(
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
      row: TitleRestitutionItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
          {cell("vaultLocation")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("date")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-4" />
          </Button>
        </TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("bordereau-decharges-tf.csv", [
      [
        "Réf. Décharge",
        "Titre Foncier Original",
        "Propriétaire Bénéficiaire",
        "Identifiant DUC",
        "Emplacement Coffre",
        "Statut Restitution",
        "Date Remise",
      ],
      ...titlesRecords.map((item) => [
        item.ref,
        item.landTitle,
        item.client,
        item.ducId,
        item.vaultLocation,
        item.status,
        item.date,
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
              Groupe G4
            </Badge>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Sécurité &amp; Coffre-Fort
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Restitution des Titres Fonciers Originaux
          </h1>
          <p className="text-sm text-muted-foreground">
            Procédure de déconsignation des Titres Fonciers originaux conservés dans le coffre-fort central du CFC et remise solennelle au propriétaire contre décharge légale.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={titlesKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Restitution physique sous protocole de double contrôle (Gestionnaire + Responsable Coffre)
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={TITLE_COLUMNS}
          rows={titlesRecords}
          unitName="restitutions"
          searchPlaceholder="Rechercher par décharge, Titre Foncier, propriétaire ou N° DUC..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={TITLE_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune restitution ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
