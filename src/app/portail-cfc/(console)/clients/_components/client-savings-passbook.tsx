"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  Download,
  Globe,
  Landmark,
  Percent,
  Printer,
  Smartphone,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { Progress } from "@/components/ui/progress";
import { cn, formatFCFA } from "@/lib/utils";

import type {
  ClientItem,
  SavingsChannel,
  SavingsPassbook,
  SavingsTransaction,
} from "@/domain/entities/client";
import { parseCfcDate } from "@/domain/entities/dates";
import {
  buildSavingsCsv,
  buildSavingsStatementHtml,
  SAVINGS_CSV_BOM,
  savingsStatementFilename,
} from "./savings-statement";
import {
  SavingsNewTransactionDialog,
  type NewTransactionPayload,
} from "./savings-new-transaction-dialog";

/* ── Helpers ────────────────────────────────────────────────────── */

const channelConfig: Record<
  SavingsChannel,
  { icon: React.ReactNode; color: string }
> = {
  "Guichet CFC": {
    icon: <Landmark className="size-3" />,
    color: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  "Mobile Money MTN": {
    icon: <Smartphone className="size-3" />,
    color: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  "Mobile Money Orange": {
    icon: <Smartphone className="size-3" />,
    color: "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  "Virement Bancaire": {
    icon: <Building2 className="size-3" />,
    color: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  SYSTAC: {
    icon: <CreditCard className="size-3" />,
    color: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  "Prélèvement Employeur": {
    icon: <Briefcase className="size-3" />,
    color: "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  "Virement SWIFT (Diaspora)": {
    icon: <Globe className="size-3" />,
    color: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  },
};

const statusBadge: Record<
  SavingsPassbook["status"],
  { label: string; color: string }
> = {
  Actif: {
    label: "Actif",
    color: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent",
  },
  "Objectif Atteint": {
    label: "Objectif Atteint",
    color: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent",
  },
  Suspendu: {
    label: "Suspendu",
    color: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent",
  },
  Clôturé: {
    label: "Clôturé",
    color: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-transparent",
  },
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "client-savings-passbook";

/**
 * Les colonnes du carnet d'épargne.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SAVINGS_COLUMNS: DataColumn<SavingsTransaction>[] = [
  {
    key: "date",
    label: "Date",
    // La date est **lue par le domaine** (`JJ/MM/AAAA`) : triée
    // alphabétiquement, « 15/01/2026 » viendrait après « 02/09/2026 ».
    accessor: (row) => parseCfcDate(row.date),
    render: (row) => row.date,
    headerClassName: "w-[85px]",
    cellClassName: "font-mono text-[10.5px]",
  },
  {
    key: "type",
    label: "Type",
    accessor: (row) => row.type,
    filterable: true,
    groupable: true,
    headerClassName: "w-[70px]",
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.type === "Dépôt" || row.type === "Intérêts"
            ? "text-[9px] bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent rounded-md px-1.5 gap-0.5"
            : "text-[9px] bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-transparent rounded-md px-1.5 gap-0.5"
        }
      >
        {row.type === "Dépôt" || row.type === "Intérêts" ? (
          <ArrowDownLeft className="size-2.5" />
        ) : (
          <ArrowUpRight className="size-2.5" />
        )}
        {row.type}
      </Badge>
    ),
  },
  {
    key: "description",
    label: "Libellé",
    accessor: (row) => row.description,
    cellClassName: "max-w-[200px] truncate",
  },
  {
    key: "channel",
    label: "Canal",
    accessor: (row) => row.channel,
    filterable: true,
    groupable: true,
    headerClassName: "w-[160px]",
    // La donnée porte le nom complet ; la facette et l'en-tête de groupe
    // portent le nom court — comme la cellule.
    groupLabel: (value) => value.replace("Virement SWIFT (Diaspora)", "SWIFT"),
    facetLabel: (value) => value.replace("Virement SWIFT (Diaspora)", "SWIFT"),
    render: (row) => {
      const chCfg = channelConfig[row.channel];
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] rounded-md px-1.5 gap-1 border-transparent font-medium",
            chCfg.color
          )}
        >
          {chCfg.icon}
          {row.channel.replace("Virement SWIFT (Diaspora)", "SWIFT")}
        </Badge>
      );
    },
  },
  {
    key: "reference",
    label: "Référence",
    accessor: (row) => row.reference,
    headerClassName: "w-[120px]",
    cellClassName: "font-mono text-[10px] text-muted-foreground",
  },
  {
    key: "debit",
    label: "Débit",
    accessor: (row) => row.debit,
    render: (row) =>
      row.debit != null ? (
        <span className="text-rose-600 dark:text-rose-400 font-semibold">
          -{row.debit.toLocaleString("fr-FR")}
        </span>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      ),
    align: "right",
    headerClassName: "w-[110px]",
    cellClassName: "font-mono text-[10.5px]",
  },
  {
    key: "credit",
    label: "Crédit",
    accessor: (row) => row.credit,
    render: (row) =>
      row.credit != null ? (
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          +{row.credit.toLocaleString("fr-FR")}
        </span>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      ),
    align: "right",
    headerClassName: "w-[110px]",
    cellClassName: "font-mono text-[10.5px]",
  },
  {
    key: "balance",
    label: "Solde",
    accessor: (row) => row.balance,
    render: (row) => row.balance.toLocaleString("fr-FR"),
    align: "right",
    headerClassName: "w-[120px]",
    cellClassName: "font-mono text-[10.5px] font-bold",
  },
];

/* ── Main Component ─────────────────────────────────────────────── */

interface ClientSavingsPassbookProps {
  client: ClientItem;
}

export function ClientSavingsPassbook({ client }: ClientSavingsPassbookProps) {
  const passbook = client.savingsPassbook;

  // Local copy of transactions for live updates (no backend)
  const [localTransactions, setLocalTransactions] = React.useState<SavingsTransaction[]>(
    passbook?.transactions ?? []
  );
  const [localBalance, setLocalBalance] = React.useState(passbook?.currentBalance ?? 0);

  // New transaction dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * La recherche, les facettes (type, canal) et le tri sont ceux du moteur
   * partagé : l'écran n'a plus de barre de filtres sur mesure.
   */
  const { groups, reset } = useDataTable({
    tableId: TABLE_ID,
    columns: SAVINGS_COLUMNS,
    rows: localTransactions,
  });

  const visibleTransactions = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups]
  );

  // Reset when client changes
  React.useEffect(() => {
    setLocalTransactions(client.savingsPassbook?.transactions ?? []);
    setLocalBalance(client.savingsPassbook?.currentBalance ?? 0);
    // Le filtre du moteur est lui aussi remis à zéro : un carnet ne
    // s'ouvre pas sur la recherche du carnet précédent.
    reset();
  }, [client.id, client.savingsPassbook?.transactions, client.savingsPassbook?.currentBalance, reset]);

  if (!passbook) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Wallet className="size-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-sm font-semibold text-foreground">Aucun carnet d&apos;épargne</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Ce client n&apos;a pas encore de compte épargne logement ouvert au CFC.
        </p>
      </div>
    );
  }

  const savingsPercent = Math.min(
    100,
    Math.round((localBalance / passbook.savingsTarget) * 100)
  );

  // Handle new transaction
  const handleNewTransaction = (payload: NewTransactionPayload) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const isDeposit = payload.type === "Dépôt";
    const newBalance = isDeposit
      ? localBalance + payload.amount
      : localBalance - payload.amount;

    const newTx: SavingsTransaction = {
      id: `txn-new-${Date.now()}`,
      date: dateStr,
      type: payload.type,
      description: payload.description,
      channel: payload.channel,
      reference: payload.reference,
      credit: isDeposit ? payload.amount : null,
      debit: isDeposit ? null : payload.amount,
      balance: newBalance,
      validatedBy: client.officer,
    };

    setLocalTransactions((prev) => [newTx, ...prev]);
    setLocalBalance(newBalance);

    toast.success(
      isDeposit ? "Versement enregistré." : "Retrait enregistré.",
      { description: `${formatFCFA(payload.amount)} — ${payload.channel}.` },
    );
  };

  /**
   * Exporte les opérations **affichées** — celles que l'agent voit.
   *
   * Le fichier porte les mêmes lignes que le tableau, jamais le carnet
   * complet : un export qui ne correspond pas à l'écran trompte l'agent.
   */
  const handleExportCsv = () => {
    if (visibleTransactions.length === 0) {
      toast.error("Aucune opération à exporter.");
      return;
    }

    const csv = buildSavingsCsv(visibleTransactions);
    const blob = new Blob([SAVINGS_CSV_BOM, csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = savingsStatementFilename(passbook.accountNumber);
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Relevé exporté.", {
      description: `${visibleTransactions.length} opération${visibleTransactions.length > 1 ? "s" : ""} au format CSV.`,
    });
  };

  /** Ouvre le relevé imprimable dans une fenêtre dédiée. */
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=960,height=720");
    if (!printWindow) {
      toast.error("La fenêtre d'impression a été bloquée par le navigateur.");
      return;
    }

    printWindow.document.write(
      buildSavingsStatementHtml({
        accountNumber: passbook.accountNumber,
        clientName: client.name,
        balance: localBalance,
        transactions: visibleTransactions,
      }),
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    toast.success("Relevé prêt pour l'impression.");
  };

  /* ── KPI cards data ──────────────────────────────── */
  const kpis = [
    {
      label: "Solde Actuel",
      value: formatFCFA(localBalance),
      icon: <Wallet className="size-4 text-emerald-600" />,
      accent: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Objectif Épargne",
      value: formatFCFA(passbook.savingsTarget),
      icon: <Target className="size-4 text-blue-600" />,
      accent: "text-foreground",
    },
    {
      label: "Taux d'Intérêt",
      value: passbook.interestRate,
      icon: <Percent className="size-4 text-amber-600" />,
      accent: "text-foreground",
    },
    {
      label: passbook.nextDueDate ? "Prochaine Échéance" : "Versement Mensuel",
      value: passbook.nextDueDate ?? (passbook.monthlyTarget ? formatFCFA(passbook.monthlyTarget) : "—"),
      icon: passbook.nextDueDate ? (
        <Calendar className="size-4 text-indigo-600" />
      ) : (
        <TrendingUp className="size-4 text-indigo-600" />
      ),
      accent: "text-foreground",
    },
  ];

  const st = statusBadge[passbook.status];

  return (
    <div className="space-y-5">
      {/* ── Section A: Summary Banner ──────────────────── */}
      <div className="rounded-lg border bg-card p-4 shadow-xs space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Banknote className="size-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Carnet d&apos;Épargne Logement
              </span>
              <Badge variant="outline" className="font-mono text-[10.5px] h-4.5 px-1.5 rounded-md">
                {passbook.accountNumber}
              </Badge>
              <Badge className={cn("text-[10px] rounded-md font-medium border", st.color)}>
                {st.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ouvert le {passbook.openDate} · {localTransactions.length} opérations enregistrées
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 rounded-md"
              onClick={handlePrint}
            >
              <Printer className="size-3" />
              Imprimer relevé
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 rounded-md"
              onClick={handleExportCsv}
            >
              <Download className="size-3" />
              Exporter CSV
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <ArrowDownLeft className="size-3" />
              Enregistrer un versement
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Progression de l&apos;épargne
            </span>
            <span className="font-bold text-foreground">
              {savingsPercent}%{" "}
              <span className="font-normal text-muted-foreground">
                ({formatFCFA(localBalance)} / {formatFCFA(passbook.savingsTarget)})
              </span>
            </span>
          </div>
          <Progress
            value={savingsPercent}
            className="h-2.5"
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="p-1.5 rounded-md bg-background border shrink-0">
                {kpi.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10.5px] text-muted-foreground font-medium truncate">
                  {kpi.label}
                </p>
                <p className={cn("text-xs font-bold truncate", kpi.accent)}>
                  {kpi.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section B: Transaction History ──────────────── */}
      <div className="rounded-lg border bg-card shadow-xs">
        {/* Barre d'outils — la recherche, les facettes (type, canal) et le
            tri sont ceux du moteur partagé. */}
        <div className="border-b p-3">
          <DataTableToolbar
            tableId={TABLE_ID}
            columns={SAVINGS_COLUMNS}
            rows={localTransactions}
            unitName="opérations"
            searchPlaceholder="Rechercher (libellé, réf, date)…"
          />
        </div>

        {/* Table */}
        <DataTable
          tableId={TABLE_ID}
          columns={SAVINGS_COLUMNS}
          rows={visibleTransactions}
          getRowId={(transaction) => transaction.id}
          emptyLabel="Aucune opération trouvée."
          className="rounded-none border-0 shadow-none"
          headClassName="text-[10.5px]"
          rowClassName="text-xs"
        />
      </div>

      {/* ── New Transaction Dialog ──────────────────────── */}
      <SavingsNewTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleNewTransaction}
        clientName={client.name}
      />
    </div>
  );
}
