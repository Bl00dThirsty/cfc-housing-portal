"use client";

import * as React from "react";
import { Ellipsis } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import type { SortRule } from "@/lib/data-table";

type TopPage = {
  bounce: string;
  path: string;
  time: string;
  views: string;
};

const pages: TopPage[] = [
  { bounce: "18%", path: "/ (Vitrine Campagne Épargne)", time: "3m 45s", views: "148.2k" },
  { bounce: "22%", path: "/simulator (Simulateur d'Emprunt)", time: "4m 12s", views: "84.6k" },
  { bounce: "15%", path: "/onboarding (Création Compte DUC)", time: "5m 30s", views: "34.8k" },
  { bounce: "12%", path: "/portail-client (Guichet Unique Citoyen)", time: "6m 18s", views: "28.4k" },
  { bounce: "35%", path: "/portail-client/depot-pieces (Téléversement)", time: "2m 50s", views: "14.2k" },
];

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "analytics-top-pages";

/**
 * La durée affichée (« 3m 45s ») en secondes.
 *
 * C'est la **valeur** que le moteur trie ; l'affichage garde sa forme.
 */
function durationSeconds(value: string): number {
  const minutes = Number(/(\d+)\s*m/.exec(value)?.[1] ?? 0);
  const seconds = Number(/(\d+)\s*s/.exec(value)?.[1] ?? 0);
  return minutes * 60 + seconds;
}

/**
 * Les colonnes du tableau des pages clés.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const TOP_PAGES_COLUMNS: DataColumn<TopPage>[] = [
  {
    key: "path",
    label: "Route / Page",
    accessor: (row) => row.path,
    cellClassName: "max-w-0 truncate py-3.5 font-medium text-xs",
  },
  {
    key: "views",
    label: "Visites",
    // « 148.2k » se compare par sa valeur, pas alphabétiquement.
    accessor: (row) => Number(row.views.replace(/[^\d.]/g, "")),
    render: (row) => row.views,
    align: "right",
    cellClassName: "tabular-nums text-xs font-semibold",
    headerClassName: "w-24",
  },
  {
    key: "time",
    label: "Temps Moyen",
    accessor: (row) => durationSeconds(row.time),
    render: (row) => row.time,
    align: "right",
    cellClassName: "text-muted-foreground tabular-nums text-xs",
    headerClassName: "w-28",
  },
  {
    key: "bounce",
    label: "Rebond",
    // « 18% » se compare par sa valeur, pas alphabétiquement.
    accessor: (row) => Number(row.bounce.replace("%", "")),
    render: (row) => row.bounce,
    align: "right",
    cellClassName: "text-muted-foreground tabular-nums text-xs",
    headerClassName: "w-20",
  },
];

/**
 * Le tri d'ouverture : la page la plus visitée d'abord.
 *
 * C'est un tri **initial**, pas un état : il s'applique tant qu'aucun tri
 * n'a été choisi, et un clic sur un en-tête le remplace.
 */
const TOP_PAGES_INITIAL_SORT: readonly SortRule[] = [
  { key: "views", dir: "desc" },
];

export function TopPages() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: TOP_PAGES_COLUMNS,
    rows: pages,
    initialSort: TOP_PAGES_INITIAL_SORT,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   */
  const visible = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups],
  );

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal text-base">Performance des Pages Clés (Vitrine & Portail)</CardTitle>
        <CardAction>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Options"
          >
            <Ellipsis className="size-4" />
          </button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0 flex flex-col gap-3">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={TOP_PAGES_COLUMNS}
          rows={pages}
          unitName="pages"
          searchPlaceholder="Rechercher une page..."
          className="px-4"
        />

        <DataTable
          tableId={TABLE_ID}
          columns={TOP_PAGES_COLUMNS}
          rows={visible}
          getRowId={(row) => row.path}
          emptyLabel="Aucune page ne correspond aux filtres appliqués."
          className="rounded-none border-0 bg-transparent shadow-none"
          tableClassName="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_tr]:border-border/50"
          rowClassName="hover:bg-muted/40 transition-colors"
          headClassName="h-8"
        />
      </CardContent>
    </Card>
  );
}
