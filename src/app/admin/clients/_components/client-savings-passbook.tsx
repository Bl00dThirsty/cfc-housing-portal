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
  Search,
  Smartphone,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type {
  ClientItem,
  SavingsChannel,
  SavingsPassbook,
  SavingsTransaction,
  SavingsTransactionType,
} from "./data";
import {
  SavingsNewTransactionDialog,
  type NewTransactionPayload,
} from "./savings-new-transaction-dialog";

/* ── Helpers ────────────────────────────────────────────────────── */

function formatFCFA(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

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

const ITEMS_PER_PAGE = 10;

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

  // Reset when client changes
  React.useEffect(() => {
    setLocalTransactions(client.savingsPassbook?.transactions ?? []);
    setLocalBalance(client.savingsPassbook?.currentBalance ?? 0);
    setPage(1);
    setSearchQuery("");
    setTypeFilter("all");
    setChannelFilter("all");
  }, [client.id, client.savingsPassbook?.transactions, client.savingsPassbook?.currentBalance]);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<SavingsTransactionType | "all">("all");
  const [channelFilter, setChannelFilter] = React.useState<SavingsChannel | "all">("all");
  const [page, setPage] = React.useState(1);

  // New transaction dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);

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

  // Filtered transactions
  const filtered = localTransactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (channelFilter !== "all" && tx.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !tx.description.toLowerCase().includes(q) &&
        !tx.reference.toLowerCase().includes(q) &&
        !tx.date.includes(q)
      )
        return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
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
    setPage(1);
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
              onClick={() => {}}
            >
              <Printer className="size-3" />
              Imprimer relevé
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 rounded-md"
              onClick={() => {}}
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
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 border-b">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher (libellé, réf, date)…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-7 text-xs"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as SavingsTransactionType | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-7 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Dépôt">Dépôt</SelectItem>
              <SelectItem value="Retrait">Retrait</SelectItem>
              <SelectItem value="Intérêts">Intérêts</SelectItem>
              <SelectItem value="Frais">Frais</SelectItem>
              <SelectItem value="Ajustement">Ajustement</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={channelFilter}
            onValueChange={(v) => {
              setChannelFilter(v as SavingsChannel | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[200px] h-7 text-xs">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les canaux</SelectItem>
              <SelectItem value="Guichet CFC">Guichet CFC</SelectItem>
              <SelectItem value="Mobile Money MTN">Mobile Money MTN</SelectItem>
              <SelectItem value="Mobile Money Orange">Mobile Money Orange</SelectItem>
              <SelectItem value="Virement Bancaire">Virement Bancaire</SelectItem>
              <SelectItem value="SYSTAC">SYSTAC</SelectItem>
              <SelectItem value="Prélèvement Employeur">Prélèvement Employeur</SelectItem>
              <SelectItem value="Virement SWIFT (Diaspora)">SWIFT (Diaspora)</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-[10.5px] text-muted-foreground ml-auto">
            {filtered.length} opération{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[10.5px]">
                <TableHead className="w-[85px]">Date</TableHead>
                <TableHead className="w-[70px]">Type</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="w-[160px]">Canal</TableHead>
                <TableHead className="w-[120px]">Référence</TableHead>
                <TableHead className="text-right w-[110px]">Débit</TableHead>
                <TableHead className="text-right w-[110px]">Crédit</TableHead>
                <TableHead className="text-right w-[120px]">Solde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Aucune opération trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((tx) => {
                  const chCfg = channelConfig[tx.channel];
                  return (
                    <TableRow key={tx.id} className="text-xs">
                      <TableCell className="font-mono text-[10.5px]">
                        {tx.date}
                      </TableCell>
                      <TableCell>
                        {tx.type === "Dépôt" || tx.type === "Intérêts" ? (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent rounded-md px-1.5 gap-0.5"
                          >
                            <ArrowDownLeft className="size-2.5" />
                            {tx.type}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-transparent rounded-md px-1.5 gap-0.5"
                          >
                            <ArrowUpRight className="size-2.5" />
                            {tx.type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] rounded-md px-1.5 gap-1 border-transparent font-medium",
                            chCfg.color
                          )}
                        >
                          {chCfg.icon}
                          {tx.channel.replace("Virement SWIFT (Diaspora)", "SWIFT")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {tx.reference}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10.5px]">
                        {tx.debit != null ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            -{tx.debit.toLocaleString("fr-FR")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10.5px]">
                        {tx.credit != null ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{tx.credit.toLocaleString("fr-FR")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10.5px] font-bold">
                        {tx.balance.toLocaleString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t">
            <span className="text-[10.5px] text-muted-foreground">
              Page {safePage} / {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 rounded-md"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 rounded-md"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
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
