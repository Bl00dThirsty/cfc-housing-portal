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

const notaireDossiers = [
  {
    id: "n1",
    ducId: "CFC-2026-DUC-04590",
    client: "TCHOUNGUI Alain",
    landTitle: "TF N° 4892/Mfoundi",
    notaryOffice: "Étude Me Nkouendjin (Yaoundé)",
    cadastreOffice: "Conservation Foncière Mfoundi",
    guaranteeValue: "22 000 000 FCFA",
    status: "Hypothèque Inscrite 1er Rang",
    date: "Aujourd'hui, 10:15",
  },
  {
    id: "n2",
    ducId: "CFC-2026-DUC-04612",
    client: "ENOW George",
    landTitle: "TF N° 12450/Wouri",
    notaryOffice: "Étude Me Douala Manga (Douala)",
    cadastreOffice: "Conservation Foncière Wouri",
    guaranteeValue: "18 000 000 FCFA",
    status: "En Attente Signature Convention",
    date: "Hier, 15:40",
  },
  {
    id: "n3",
    ducId: "CFC-2026-DUC-04678",
    client: "MANGA Estelle",
    landTitle: "TF N° 3120/Océan",
    notaryOffice: "Étude Me Bisseck (Kribi)",
    cadastreOffice: "Conservation Foncière Océan",
    guaranteeValue: "14 500 000 FCFA",
    status: "Certificat Propriété Vérifié",
    date: "01 Sept 2026",
  },
  {
    id: "n4",
    ducId: "CFC-2026-DUC-04701",
    client: "KOUAM Roger",
    landTitle: "TF N° 8904/Mifi",
    notaryOffice: "Étude Me Kamdem (Bafoussam)",
    cadastreOffice: "Conservation Foncière Mifi",
    guaranteeValue: "26 000 000 FCFA",
    status: "Publication Journal Cadastre",
    date: "29 Août 2026",
  },
];

type NotaireDossier = (typeof notaireDossiers)[number];

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-notary-cadastre";

/**
 * Les colonnes des dossiers de formalisation notariée.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const NOTARY_COLUMNS: DataColumn<NotaireDossier>[] = [
  {
    key: "client",
    label: "Bénéficiaire / Garant",
    accessor: (row) => row.client,
    // La conservation foncière est affichée **sous le nom** dans la ligne :
    // elle n'est pas une colonne, mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.cadastreOffice],
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">
            {row.client}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {row.cadastreOffice}
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
    key: "landTitle",
    label: "Titre Foncier (TF)",
    accessor: (row) => row.landTitle,
    render: (row) => (
      <Badge
        variant="secondary"
        className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200"
      >
        {row.landTitle}
      </Badge>
    ),
  },
  {
    key: "notaryOffice",
    label: "Étude Notariale",
    accessor: (row) => row.notaryOffice,
    filterable: true,
    groupable: true,
  },
  {
    key: "guaranteeValue",
    label: "Valeur Garantie",
    // Le tri porte sur la **valeur** : « 22 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.guaranteeValue.replace(/\D/g, "")),
    render: (row) => row.guaranteeValue,
    align: "right",
  },
  {
    key: "status",
    label: "Statut Hypothèque",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.status.includes("Inscrite") || row.status.includes("Vérifié")
            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
            : "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 h-5 px-2 text-xs font-medium"
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

export function NotaireCadastreActorPage({ kpi }: { kpi: React.ReactNode }) {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: NOTARY_COLUMNS,
    rows: notaireDossiers,
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
      row: NotaireDossier;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">
          {cell("notaryOffice")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("guaranteeValue")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("bordereau-hypothèques.csv", [
      [
        "Bénéficiaire / Garant",
        "Identifiant DUC",
        "Titre Foncier (TF)",
        "Étude Notariale",
        "Conservation Foncière",
        "Valeur Garantie",
        "Statut Hypothèque",
      ],
      ...notaireDossiers.map((dossier) => [
        dossier.client,
        dossier.ducId,
        dossier.landTitle,
        dossier.notaryOffice,
        dossier.cadastreOffice,
        dossier.guaranteeValue,
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
              Groupe G8
            </Badge>
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-transparent h-5 px-2 text-xs font-medium">
              Notariat & Affaires Juridiques
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Formalisation Notariée & Cadastre (MINDCAF)
          </h1>
          <p className="text-sm text-muted-foreground">
            Rédaction des conventions notariées d&apos;affectation hypothécaire de 1er rang, inscription au Cadastre MINDCAF et délivrance des certificats de propriété récents.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      {kpi}

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Phase 4 du Circuit CFC · Formalisation &amp; Garanties Réelles</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={NOTARY_COLUMNS}
          rows={notaireDossiers}
          unitName="dossiers"
          searchPlaceholder="Rechercher par emprunteur, N° DUC, Titre Foncier, Notaire..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={NOTARY_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
