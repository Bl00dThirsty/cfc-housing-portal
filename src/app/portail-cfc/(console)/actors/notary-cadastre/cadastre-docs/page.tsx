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

const cadastreKpis: ActorKpiItem[] = [
  {
    title: "Certificats Réceptionnés (Mois)",
    value: "86",
    change: "14.7%",
    isPositive: true,
    previous: "75 certificats",
    period: "ce mois",
  },
  {
    title: "Hypothèques 1er Rang Inscrites",
    value: "58",
    change: "16.0%",
    isPositive: true,
    previous: "50 actes",
    period: "au Cadastre MINDCAF",
  },
  {
    title: "Conservations Raccordées",
    value: "18",
    change: "12.5%",
    isPositive: true,
    previous: "16 services",
    period: "Mfoundi, Wouri, etc.",
  },
  {
    title: "Délai Délivrance Acte",
    value: "5.4 jours",
    change: "18.2%",
    isPositive: true,
    previous: "6.6 jours",
    period: "cible ≤ 7j",
  },
  {
    title: "Dossiers en Rectification",
    value: "3",
    change: "40.0%",
    isPositive: true,
    previous: "5 dossiers",
    period: "anomalies de bornage",
  },
];

const cadastreRecords = [
  {
    id: "cad1",
    ref: "REQ-MIN-2026-00892",
    client: "TCHOUNGUI Alain",
    landTitle: "TF N° 4892/Mfoundi",
    conservationOffice: "Conservation Foncière Yaoundé Centre",
    validityDate: "15 Nov 2026",
    status: "Inscrit au Livre Foncier",
    date: "Aujourd'hui, 09:30",
  },
  {
    id: "cad2",
    ref: "REQ-MIN-2026-00891",
    client: "ENOW George",
    landTitle: "TF N° 12450/Wouri",
    conservationOffice: "Conservation Foncière Douala Bonanjo",
    validityDate: "02 Déc 2026",
    status: "En cours de publication",
    date: "Hier, 14:20",
  },
  {
    id: "cad3",
    ref: "REQ-MIN-2026-00890",
    client: "MANGA Estelle",
    landTitle: "TF N° 3120/Océan",
    conservationOffice: "Conservation Foncière Kribi",
    validityDate: "28 Oct 2026",
    status: "Inscrit au Livre Foncier",
    date: "02 Sept 2026",
  },
  {
    id: "cad4",
    ref: "REQ-MIN-2026-00889",
    client: "KOUAM Roger",
    landTitle: "TF N° 8904/Mifi",
    conservationOffice: "Conservation Foncière Bafoussam",
    validityDate: "10 Janv 2027",
    status: "En attente bordereau",
    date: "01 Sept 2026",
  },
  {
    id: "cad5",
    ref: "REQ-MIN-2026-00888",
    client: "MUKETE Henry",
    landTitle: "TF N° 16210/Fako",
    conservationOffice: "Conservation Foncière Limbe",
    validityDate: "18 Nov 2026",
    status: "Inscrit au Livre Foncier",
    date: "29 Août 2026",
  },
  {
    id: "cad6",
    ref: "REQ-MIN-2026-00887",
    client: "NDZANA Philippe",
    landTitle: "TF N° 5110/Méfou-et-Afamba",
    conservationOffice: "Conservation Foncière Mfou",
    validityDate: "Expiré",
    status: "Rectification demandée",
    date: "27 Août 2026",
  },
];

type CadastreRecord = (typeof cadastreRecords)[number];

const cadastreStatusStyles: Record<string, string> = {
  "Inscrit au Livre Foncier": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En cours de publication": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente bordereau": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Rectification demandée": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-notary-cadastre-cadastre-docs";

/**
 * Les colonnes des réquisitions de certificats MINDCAF.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const CADASTRE_COLUMNS: DataColumn<CadastreRecord>[] = [
  {
    key: "ref",
    label: "Réf. Réquisition",
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
    key: "client",
    label: "Emprunteur / Bénéficiaire",
    accessor: (row) => row.client,
    filterable: false,
    groupable: false,
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
    key: "conservationOffice",
    label: "Conservation Foncière",
    accessor: (row) => row.conservationOffice,
    filterable: true,
    groupable: true,
  },
  {
    key: "validityDate",
    label: "Validité Certificat",
    // La source mêle des dates écrites (« 15 Nov 2026 ») et un état métier
    // (« Expiré ») : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.validityDate,
    sortable: false,
  },
  {
    key: "status",
    label: "Statut Inscription",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${cadastreStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date Dépôt",
    // La source mêle des dates relatives (« Aujourd'hui, 09:30 ») et des dates
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

export default function CadastreDocsPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: CADASTRE_COLUMNS,
    rows: cadastreRecords,
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
      row: CadastreRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
          {cell("client")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px]">
          <span className="truncate block">{cell("conservationOffice")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
          {cell("validityDate")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("date")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("requisions-mindcaf.csv", [
      [
        "Réf. Réquisition",
        "Emprunteur / Bénéficiaire",
        "Titre Foncier (TF)",
        "Conservation Foncière",
        "Validité Certificat",
        "Statut Inscription",
        "Date Dépôt",
      ],
      ...cadastreRecords.map((record) => [
        record.ref,
        record.client,
        record.landTitle,
        record.conservationOffice,
        record.validityDate,
        record.status,
        record.date,
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
              Liaison Cadastre MINDCAF
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Liaison Cadastre &amp; Certificats MINDCAF
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des réquisitions de certificats de propriété récents, inscriptions des hypothèques au livre foncier départemental et délivrance des bordereaux.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={cadastreKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Conservation Foncière Départementale · Ministère des Domaines (MINDCAF)</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={CADASTRE_COLUMNS}
          rows={cadastreRecords}
          unitName="réquisitions"
          searchPlaceholder="Rechercher par référence, emprunteur, Titre Foncier ou conservation..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={CADASTRE_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune réquisition ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
