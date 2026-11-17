"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, AlertTriangle, RefreshCw, FileText, Download } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/csv";

const canauxKpis: ActorKpiItem[] = [
  {
    title: "Collecte Globale Mensuelle",
    value: "845,2 M FCFA",
    change: "18.4%",
    isPositive: true,
    previous: "713,8 M FCFA",
    period: "ce mois",
  },
  {
    title: "Part Mobile Money (MoMo/OM)",
    value: "68.2%",
    change: "4.5%",
    isPositive: true,
    previous: "63.7%",
    period: "576,4 M FCFA",
  },
  {
    title: "Taux Réconciliation J+0",
    value: "97.4%",
    change: "0.8%",
    isPositive: true,
    previous: "96.6%",
    period: "rapproché Carthago",
  },
  {
    title: "Transactions Exécutées",
    value: "5 480",
    change: "21.6%",
    isPositive: true,
    previous: "4 505",
    period: "ce mois",
  },
  {
    title: "Rejets & Anomalies à Régler",
    value: "23",
    change: "30.3%",
    isPositive: true,
    previous: "33",
    period: "en cours de traitement",
  },
];

interface ChannelTransaction {
  id: string;
  txRef: string;
  channel: "MTN MoMo" | "Orange Money" | "Virement SYSTAC" | "Dépôt Guichet";
  payer: string;
  phoneOrAccount: string;
  ducOrSaverId: string;
  amount: string;
  carthagoStatus: "Rapproché J+0" | "En attente J+1" | "Anomalie Rapprochement";
  timestamp: string;
  gatewayFee: string;
  beacTraceId: string;
  journalEntry: string;
}

const transactionsData: ChannelTransaction[] = [
  {
    id: "tx1",
    txRef: "TX-MOMO-2026-09-0891",
    channel: "MTN MoMo",
    payer: "ABANDA Eric",
    phoneOrAccount: "+237 677 45 12 80",
    ducOrSaverId: "CFC-2026-DUC-04829",
    amount: "250 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "Aujourd'hui, 11:42",
    gatewayFee: "1 250 FCFA",
    beacTraceId: "MTN-CM-9948102384",
    journalEntry: "JRN-CARTHAGO-2026-08812",
  },
  {
    id: "tx2",
    txRef: "TX-OM-2026-09-0442",
    channel: "Orange Money",
    payer: "NKOULOU Sandrine",
    phoneOrAccount: "+237 699 12 84 90",
    ducOrSaverId: "CFC-2026-DUC-04830",
    amount: "150 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "Aujourd'hui, 10:15",
    gatewayFee: "750 FCFA",
    beacTraceId: "OM-CM-8812049102",
    journalEntry: "JRN-CARTHAGO-2026-08811",
  },
  {
    id: "tx3",
    txRef: "TX-SYS-2026-09-0120",
    channel: "Virement SYSTAC",
    payer: "MINFI / DGB (Virement Salaire)",
    phoneOrAccount: "RIB UBA 10033-05200-0192",
    ducOrSaverId: "CFC-2026-DUC-04840",
    amount: "1 200 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "Hier, 16:30",
    gatewayFee: "0 FCFA (Convention)",
    beacTraceId: "SYSTAC-BEAC-2026-77192",
    journalEntry: "JRN-CARTHAGO-2026-08805",
  },
  {
    id: "tx4",
    txRef: "TX-MOMO-2026-09-0870",
    channel: "MTN MoMo",
    payer: "FOKAM Emmanuel",
    phoneOrAccount: "+237 674 19 88 02",
    ducOrSaverId: "CFC-2026-DUC-04850",
    amount: "300 000 FCFA",
    carthagoStatus: "En attente J+1",
    timestamp: "Hier, 14:05",
    gatewayFee: "1 500 FCFA",
    beacTraceId: "MTN-CM-9948101900",
    journalEntry: "En attente confirmation IPN",
  },
  {
    id: "tx5",
    txRef: "TX-GUI-2026-09-0094",
    channel: "Dépôt Guichet",
    payer: "EBALE Marthe",
    phoneOrAccount: "Bordereau Agence Bafoussam",
    ducOrSaverId: "CFC-2026-DUC-04860",
    amount: "500 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "02 Sept 2026",
    gatewayFee: "0 FCFA",
    beacTraceId: "CAISSE-BAF-2026-0412",
    journalEntry: "JRN-CARTHAGO-2026-08792",
  },
  {
    id: "tx6",
    txRef: "TX-OM-2026-09-0410",
    channel: "Orange Money",
    payer: "MBASSI Paul",
    phoneOrAccount: "+237 694 00 12 34",
    ducOrSaverId: "CFC-2026-DUC-04875",
    amount: "75 000 FCFA",
    carthagoStatus: "Anomalie Rapprochement",
    timestamp: "01 Sept 2026",
    gatewayFee: "375 FCFA",
    beacTraceId: "OM-CM-8812048991",
    journalEntry: "Échec réconciliation : Compte erroné",
  },
];

const channelStyles: Record<string, string> = {
  "MTN MoMo": "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  "Orange Money": "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Virement SYSTAC": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Dépôt Guichet": "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

const carthagoStatusStyles: Record<string, string> = {
  "Rapproché J+0": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En attente J+1": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Anomalie Rapprochement": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "analytics-canaux";

/**
 * Les colonnes du tableau des flux de collecte.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const TRANSACTION_COLUMNS: DataColumn<ChannelTransaction>[] = [
  {
    key: "txRef",
    label: "Réf. Flux",
    accessor: (row) => row.txRef,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.txRef}
      </Badge>
    ),
  },
  {
    key: "channel",
    label: "Canal de Collecte",
    accessor: (row) => row.channel,
    // La facette remplace les anciens boutons « Tous / MoMo / OM / SYSTAC ».
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${channelStyles[row.channel] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.channel}
      </Badge>
    ),
  },
  {
    key: "payer",
    label: "Payeur / Émetteur",
    accessor: (row) => row.payer,
    // Le téléphone ou le RIB est affiché **sous le payeur** dans la ligne :
    // il n'est pas une colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.phoneOrAccount],
    render: (row) => (
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-xs text-foreground truncate">
          {row.payer}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {row.phoneOrAccount}
        </span>
      </div>
    ),
  },
  {
    key: "ducOrSaverId",
    label: "Affectation DUC",
    accessor: (row) => row.ducOrSaverId,
  },
  {
    key: "amount",
    label: "Montant Encaissé",
    // Le tri porte sur la **valeur** : « 1 200 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.amount.replace(/\D/g, "")),
    render: (row) => row.amount,
    align: "right",
  },
  {
    key: "carthagoStatus",
    label: "Statut Carthago",
    accessor: (row) => row.carthagoStatus,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${carthagoStatusStyles[row.carthagoStatus] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.carthagoStatus}
      </Badge>
    ),
  },
  {
    key: "timestamp",
    label: "Horodatage",
    // La source mêle des dates relatives (« Aujourd'hui, 11:42 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.timestamp,
    sortable: false,
  },
  {
    // La colonne d'actions porte un menu, pas une valeur : elle n'est ni
    // triable ni filtrable.
    key: "action",
    label: "Actions",
    sortable: false,
    align: "right",
  },
];

export function CanauxCollecteTab() {
  const router = useRouter();

  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: TRANSACTION_COLUMNS,
    rows: transactionsData,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   */
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
      row,
      cell,
    }: {
      row: ChannelTransaction;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openTransaction = () =>
        router.push(`/portail-cfc/analytics/transactions/${row.id}`);

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
          aria-label={`Ouvrir la transaction ${row.txRef}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">{cell("txRef")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("channel")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("payer")}</TableCell>
          <TableCell className="px-3 py-2.5">
            <span className="font-mono text-[11px] text-muted-foreground">
              {cell("ducOrSaverId")}
            </span>
          </TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
            {cell("amount")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("carthagoStatus")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
            {cell("timestamp")}
          </TableCell>
          <TableCell
            className="text-right pr-4 py-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
                <DropdownMenuLabel className="text-xs font-semibold">
                  Actions Transaction
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openTransaction}
                  className="cursor-pointer text-xs"
                >
                  <FileText className="size-3.5 mr-2 text-muted-foreground" />
                  Voir la preuve de règlement
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openTransaction}
                  className="cursor-pointer text-xs"
                >
                  <RefreshCw className="size-3.5 mr-2 text-muted-foreground" />
                  Forcer le rapprochement Carthago
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openTransaction}
                  className="cursor-pointer text-xs"
                >
                  <Download className="size-3.5 mr-2 text-muted-foreground" />
                  Télécharger le reçu fiscal (PDF)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openTransaction}
                  className="cursor-pointer text-xs text-rose-600 dark:text-rose-400"
                >
                  <AlertTriangle className="size-3.5 mr-2" />
                  Signaler un litige / anomalie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  const handleExport = () => {
    downloadCsv("transactions-collecte-cfc.csv", [
      [
        "Réf. Flux",
        "Canal de Collecte",
        "Payeur",
        "Téléphone / Compte",
        "Affectation DUC",
        "Montant Encaissé",
        "Statut Carthago",
        "Horodatage",
      ],
      ...transactionsData.map((row) => [
        row.txRef,
        row.channel,
        row.payer,
        row.phoneOrAccount,
        row.ducOrSaverId,
        row.amount,
        row.carthagoStatus,
        row.timestamp,
      ]),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 5 KPIs Strip without icons */}
      <ActorKpiStrip items={canauxKpis} />

      {/* Channel Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            name: "MTN Mobile Money",
            volume: "382,4 M FCFA",
            share: "45.2% du total",
            successRate: "99.4%",
            status: "Passerelle Opérationnelle",
            badgeColor: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
          },
          {
            name: "Orange Money",
            volume: "194,0 M FCFA",
            share: "23.0% du total",
            successRate: "98.8%",
            status: "Passerelle Opérationnelle",
            badgeColor: "bg-orange-500/10 text-orange-700 border-orange-500/30",
          },
          {
            name: "Virements SYSTAC BEAC",
            volume: "184,8 M FCFA",
            share: "21.8% du total",
            successRate: "100.0%",
            status: "Liaison RTGS Active",
            badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/30",
          },
          {
            name: "Caisses Agences CFC",
            volume: "84,0 M FCFA",
            share: "10.0% du total",
            successRate: "100.0%",
            status: "10 Agences Connectées",
            badgeColor: "bg-teal-500/10 text-teal-700 border-teal-500/30",
          },
        ].map((chan) => (
          <div key={chan.name} className="rounded-xl border bg-card p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{chan.name}</span>
              <span className="size-2 rounded-full bg-emerald-500" title="En ligne" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-foreground">{chan.volume}</span>
              <span className="text-[11px] font-medium text-muted-foreground">{chan.share}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
              <span>Succès : <strong>{chan.successRate}</strong></span>
              <span className="text-emerald-600 font-medium">{chan.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={TRANSACTION_COLUMNS}
          rows={transactionsData}
          unitName="transactions"
          searchPlaceholder="Rechercher par référence, payeur, N° DUC ou téléphone..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={TRANSACTION_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune transaction ne correspond aux filtres appliqués."
          headClassName="bg-muted/40"
        />
      </div>
    </div>
  );
}
