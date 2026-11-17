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

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-mortgage-release-registry";

const registryKpis: ActorKpiItem[] = [
  {
    title: "Radiations Effectuées (Mois)",
    value: "21",
    change: "31.2%",
    isPositive: true,
    previous: "16 radiations",
    period: "ce mois",
  },
  {
    title: "Certificats Libres Reçus",
    value: "18",
    change: "28.6%",
    isPositive: true,
    previous: "14 certificats",
    period: "sans aucune charge",
  },
  {
    title: "Conservations Traitées",
    value: "12",
    change: "20.0%",
    isPositive: true,
    previous: "10 services",
    period: "Yaoundé, Douala, etc.",
  },
  {
    title: "Délai Moyen Radiation",
    value: "6.2 jours",
    change: "17.3%",
    isPositive: true,
    previous: "7.5 jours",
    period: "cible ≤ 8j",
  },
  {
    title: "En Attente Quittance Fiscale",
    value: "3",
    change: "40.0%",
    isPositive: true,
    previous: "5 dossiers",
    period: "régularisation timbre",
  },
];

export interface RadiationRecordItem {
  id: string;
  ref: string;
  landTitle: string;
  location: string;
  client: string;
  initialEntry: string;
  status: string;
  date: string;
}

const registryRecords: RadiationRecordItem[] = [
  {
    id: "rad1",
    ref: "RAD-MINDCAF-2026-0094",
    landTitle: "TF N° 6120/Mfoundi",
    location: "Mfoundi (Yaoundé Centre)",
    client: "KAMGA Pascal",
    initialEntry: "Vol. 142, Folio 89, Inscription N° 12",
    status: "Radiation Portée au Livre Foncier",
    date: "02 Septembre 2026",
  },
  {
    id: "rad2",
    ref: "RAD-MINDCAF-2026-0093",
    landTitle: "TF N° 9415/Wouri",
    location: "Wouri (Douala Bonanjo)",
    client: "TCHATCHOUANG Hélène",
    initialEntry: "Vol. 208, Folio 34, Inscription N° 05",
    status: "Radiation Portée au Livre Foncier",
    date: "01 Septembre 2026",
  },
  {
    id: "rad3",
    ref: "RAD-MINDCAF-2026-0092",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    location: "Méfou-et-Afamba (Mfou)",
    client: "MVONDO Albert",
    initialEntry: "Vol. 88, Folio 12, Inscription N° 03",
    status: "En cours d'instruction",
    date: "28 Août 2026",
  },
  {
    id: "rad4",
    ref: "RAD-MINDCAF-2026-0091",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    location: "Nyong-et-So'o (Mbalmayo)",
    client: "FOUDA Bernadette",
    initialEntry: "Vol. 62, Folio 45, Inscription N° 08",
    status: "Quittance Fiscale Validée",
    date: "26 Août 2026",
  },
  {
    id: "rad5",
    ref: "RAD-MINDCAF-2026-0090",
    landTitle: "TF N° 4118/Sanaga-Maritime",
    location: "Sanaga-Maritime (Edéa)",
    client: "BASSOMGBEN Jean",
    initialEntry: "Vol. 75, Folio 19, Inscription N° 04",
    status: "Radiation Portée au Livre Foncier",
    date: "24 Août 2026",
  },
  {
    id: "rad6",
    ref: "RAD-MINDCAF-2026-0089",
    landTitle: "TF N° 8210/Menoua",
    location: "Menoua (Dschang)",
    client: "NGUEMO Paul",
    initialEntry: "Vol. 94, Folio 50, Inscription N° 09",
    status: "En attente quittance",
    date: "20 Août 2026",
  },
];

const registryStatusStyles: Record<string, string> = {
  "Radiation Portée au Livre Foncier": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Quittance Fiscale Validée": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En cours d'instruction": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "En attente quittance": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

/**
 * Les colonnes du registre des radiations.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const RADIATION_COLUMNS: DataColumn<RadiationRecordItem>[] = [
  {
    key: "ref",
    label: "Réf. Radiation",
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
    label: "Titre Foncier (TF)",
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
    key: "location",
    label: "Conservation Foncière",
    accessor: (row) => row.location,
    // Une conservation par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "client",
    label: "Propriétaire Foncier",
    accessor: (row) => row.client,
    // Un propriétaire par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "initialEntry",
    label: "Inscription Initiale",
    accessor: (row) => row.initialEntry,
  },
  {
    key: "status",
    label: "Statut Radiation",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${registryStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date Effet",
    // La date est écrite en long (« 02 Septembre 2026 ») : elle n'est pas
    // lisible par `parseCfcDate`, donc pas triable — elle s'affiche telle
    // quelle.
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

export default function MortgageRegistryPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: RADIATION_COLUMNS,
    rows: registryRecords,
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
      row: RadiationRecordItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
          <span className="truncate block">{cell("location")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
          {cell("client")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
          {cell("initialEntry")}
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
    downloadCsv("requisitions-radiation.csv", [
      [
        "Réf. Radiation",
        "Titre Foncier",
        "Conservation Foncière",
        "Propriétaire Foncier",
        "Inscription Initiale",
        "Statut Radiation",
        "Date Effet",
      ],
      ...registryRecords.map((item) => [
        item.ref,
        item.landTitle,
        item.location,
        item.client,
        item.initialEntry,
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
              Radiation Cadastre MINDCAF
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Radiation des Hypothèques au Cadastre (MINDCAF)
          </h1>
          <p className="text-sm text-muted-foreground">
            Dépôt des actes de mainlevée auprès des Conservations Foncières, radiation définitive des inscriptions au Livre Foncier et obtention des certificats de propriété vierges.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={registryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Purge définitive des sûretés réelles au Livre Foncier Départemental
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={RADIATION_COLUMNS}
          rows={registryRecords}
          unitName="radiations"
          searchPlaceholder="Rechercher par référence, Titre Foncier, propriétaire ou conservation..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={RADIATION_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune radiation ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
