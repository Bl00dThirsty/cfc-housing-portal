"use client";

import * as React from "react";
import Link from "next/link";

import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";

/**
 * Catalogue des modèles d'e-mail.
 *
 * Une ligne par code : l'intitulé, le public visé, l'état, la version
 * courante et le nombre d'envois constatés. L'édition passe par la page du
 * modèle, qui publie une **version nouvelle**.
 */

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "email-template-catalogue";

const AUDIENCE_LABELS: Record<string, string> = {
  citizen: "Citoyen",
  staff: "Agent",
  both: "Citoyen & Agent",
};

/** Formate une date ISO en français. */
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/** Une ligne du catalogue, telle que l'écran la consomme. */
export interface EmailTemplateCatalogueRow {
  code: string;
  label: string;
  audience: string;
  isActive: boolean;
  version: number;
  effectiveFrom: string;
  sentCount: number;
}

/**
 * Les colonnes du catalogue.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const EMAIL_TEMPLATE_COLUMNS: DataColumn<EmailTemplateCatalogueRow>[] = [
  {
    key: "code",
    label: "Code",
    accessor: (row) => row.code,
    render: (row) => (
      <Link
        href={`/portail-cfc/settings/email/${row.code}`}
        className="font-mono text-[12px] font-medium text-primary underline-offset-2 hover:underline"
      >
        {row.code}
      </Link>
    ),
  },
  {
    key: "label",
    label: "Intitulé",
    accessor: (row) => row.label,
    cellClassName: "text-[13px] text-foreground",
  },
  {
    key: "audience",
    label: "Public",
    accessor: (row) => row.audience,
    filterable: true,
    groupable: true,
    // Le public est un **code** dans la donnée : la facette et l'en-tête de
    // groupe portent le libellé français, jamais « citizen ».
    facetLabel: (value) => AUDIENCE_LABELS[value] ?? value,
    groupLabel: (value) => AUDIENCE_LABELS[value] ?? value,
    render: (row) => (
      <Badge variant="secondary" className="text-[11px]">
        {AUDIENCE_LABELS[row.audience] ?? row.audience}
      </Badge>
    ),
  },
  {
    key: "isActive",
    label: "État",
    accessor: (row) => row.isActive,
    filterable: true,
    groupable: true,
    // L'état est un **booléen** : sans cette couture, la facette afficherait
    // « true » et « false ».
    facetLabel: (value) => (value === "true" ? "Actif" : "Désactivé"),
    groupLabel: (value) => (value === "true" ? "Actif" : "Désactivé"),
    render: (row) =>
      row.isActive ? (
        <Badge variant="success" className="text-[11px]">
          Actif
        </Badge>
      ) : (
        <Badge variant="destructive" className="text-[11px]">
          Désactivé
        </Badge>
      ),
  },
  {
    key: "version",
    label: "Version",
    accessor: (row) => row.version,
    render: (row) => `v${row.version}`,
    align: "right",
    cellClassName: "font-mono text-[12px] text-muted-foreground",
  },
  {
    key: "sentCount",
    label: "Envois",
    accessor: (row) => row.sentCount,
    align: "right",
    cellClassName: "text-[12px] text-muted-foreground",
  },
  {
    key: "effectiveFrom",
    label: "En vigueur depuis",
    // La valeur est une **date** : le moteur la trie chronologiquement. La
    // cellule, elle, s'affiche en français.
    accessor: (row) => new Date(row.effectiveFrom),
    render: (row) => formatDate(row.effectiveFrom),
    align: "right",
    cellClassName: "text-[12px] text-muted-foreground",
  },
];

export function EmailTemplatesTable({
  rows,
}: {
  rows: EmailTemplateCatalogueRow[];
}) {
  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * La recherche et les facettes (public, état) remplacent l'absence de
   * filtres : l'écran n'a plus de barre de filtres sur mesure.
   */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: EMAIL_TEMPLATE_COLUMNS,
    rows,
  });

  const visible = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups]
  );

  return (
    <div className="space-y-3">
      <DataTableToolbar
        tableId={TABLE_ID}
        columns={EMAIL_TEMPLATE_COLUMNS}
        rows={rows}
        unitName="modèles"
        searchPlaceholder="Rechercher un code, un intitulé ou un public..."
      />

      <Card size="sm">
        <DataTable
          tableId={TABLE_ID}
          columns={EMAIL_TEMPLATE_COLUMNS}
          rows={visible}
          getRowId={(row) => row.code}
          emptyLabel="Aucun modèle ne correspond aux filtres appliqués."
          className="rounded-none border-0 shadow-none"
        />
      </Card>
    </div>
  );
}
