"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  momoTransactions as transactions,
  type MomoTransactionItem,
} from "@/domain/entities/mobile-money";

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-agency-mobile-money";

const momoKpis: ActorKpiItem[] = [
  {
    title: "Versements Reçus (Mois)",
    value: "3 842",
    change: "22.6%",
    isPositive: true,
    previous: "3 134",
    period: "ce mois",
  },
  {
    title: "Collecte MTN MoMo",
    value: "412,5 M FCFA",
    change: "19.3%",
    isPositive: true,
    previous: "345,8 M FCFA",
    period: "ce mois",
  },
  {
    title: "Collecte Orange Money",
    value: "278,1 M FCFA",
    change: "15.7%",
    isPositive: true,
    previous: "240,3 M FCFA",
    period: "ce mois",
  },
  {
    title: "Tx Rapprochement SYSTAC",
    value: "97.4%",
    change: "0.8%",
    isPositive: true,
    previous: "96.6%",
    period: "ce mois",
  },
  {
    title: "Transactions Échouées",
    value: "47",
    change: "12.5%",
    isPositive: false,
    previous: "54",
    period: "ce mois",
  },
];

const statusStyles: Record<string, string> = {
  "Rapproché": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En attente": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Échoué": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/**
 * Les colonnes du tableau des versements Mobile Money.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const TRANSACTION_COLUMNS: DataColumn<MomoTransactionItem>[] = [
  {
    key: "ref",
    label: "Réf. Transaction",
    accessor: (row) => row.ref,
  },
  {
    key: "client",
    label: "Emprunteur",
    accessor: (row) => row.client,
  },
  {
    key: "canal",
    label: "Canal",
    accessor: (row) => row.canal,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.canal === "MTN MoMo"
            ? "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300 h-5 px-2 text-xs font-medium border-transparent"
            : "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 h-5 px-2 text-xs font-medium border-transparent"
        }
      >
        {row.canal}
      </Badge>
    ),
  },
  {
    key: "amount",
    label: "Montant",
    // Le tri porte sur la **valeur** : « 250 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.amount.replace(/\D/g, "")),
    render: (row) => row.amount,
    align: "right",
  },
  {
    key: "status",
    label: "Statut",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${statusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date & Heure",
    // La source mêle des dates relatives (« Aujourd'hui, 16:42 ») et des dates
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

export default function MobileMoneyPage() {
  const router = useRouter();

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
      row: MomoTransactionItem;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openTransaction = () =>
        router.push(`/portail-cfc/actors/agency/mobile-money/${row.id}`);

      return (
        <TableRow
          onClick={openTransaction}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openTransaction();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Ouvrir la transaction ${row.ref}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openTransaction();
              }}
              aria-label={`Ouvrir la transaction ${row.ref}`}
              className="text-left font-medium hover:underline inline-flex h-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30 px-2 font-mono text-[11px] text-foreground"
            >
              {cell("ref")}
            </button>
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
            {cell("client")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("canal")}</TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
            {cell("amount")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
            {cell("date")}
          </TableCell>
          <TableCell
            className="text-right pr-4 py-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={openTransaction}
              aria-label={`Ouvrir la transaction ${row.ref}`}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Eye className="size-4" />
            </Button>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G1
            </Badge>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent h-5 px-2 text-xs font-medium">
              Collecte Digitale
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Collecte Mobile Money (MoMo / OM)
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi temps réel des versements Épargne Habitat par Mobile Money (MTN MoMo, Orange Money) et rapprochement SYSTAC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Transactions
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <ActorKpiStrip items={momoKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={TRANSACTION_COLUMNS}
          rows={transactions}
          unitName="transactions"
          searchPlaceholder="Rechercher par emprunteur, réf. ou canal..."
        />

        <DataTable
          tableId={TABLE_ID}
          columns={TRANSACTION_COLUMNS}
          rows={transactions}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune transaction ne correspond aux critères de filtre."
        />
      </div>
    </div>
  );
}
