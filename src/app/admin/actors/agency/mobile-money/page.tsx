"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { momoTransactions as transactions } from "./data";

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

export default function MobileMoneyPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedCanals, setSelectedCanals] = React.useState<string[]>([]);

  const statusOptions = React.useMemo(() => [
    {
      label: "Rapproché",
      value: "Rapproché",
      count: transactions.filter((t) => t.status === "Rapproché").length,
    },
    {
      label: "En attente",
      value: "En attente",
      count: transactions.filter((t) => t.status === "En attente").length,
    },
    {
      label: "Échoué",
      value: "Échoué",
      count: transactions.filter((t) => t.status === "Échoué").length,
    },
  ], []);

  const canalOptions = React.useMemo(() => [
    {
      label: "MTN MoMo",
      value: "MTN MoMo",
      count: transactions.filter((t) => t.canal === "MTN MoMo").length,
    },
    {
      label: "Orange Money",
      value: "Orange Money",
      count: transactions.filter((t) => t.canal === "Orange Money").length,
    },
  ], []);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.client.toLowerCase().includes(q) ||
      t.ref.toLowerCase().includes(q) ||
      t.canal.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(t.status);
    const matchesCanal =
      selectedCanals.length === 0 || selectedCanals.includes(t.canal);

    return matchesSearch && matchesStatus && matchesCanal;
  });

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
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par emprunteur, réf. ou canal..."
          totalCount={transactions.length}
          filteredCount={filtered.length}
          unitName="transactions"
          filters={[
            {
              id: "status",
              title: "Statut",
              options: statusOptions,
              selectedValues: selectedStatuses,
              onSelect: setSelectedStatuses,
            },
            {
              id: "canal",
              title: "Opérateur",
              options: canalOptions,
              selectedValues: selectedCanals,
              onSelect: setSelectedCanals,
            },
          ]}
          onResetAll={() => {
            setSelectedStatuses([]);
            setSelectedCanals([]);
          }}
        />

        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Transaction</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Canal</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date &amp; Heure</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                    Aucune transaction ne correspond aux critères de filtre.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => router.push(`/admin/actors/agency/mobile-money/${item.id}`)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <TableCell className="px-3 py-2.5">
                      <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                        {item.ref}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
                      {item.client}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge
                        variant="secondary"
                        className={
                          item.canal === "MTN MoMo"
                            ? "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300 h-5 px-2 text-xs font-medium border-transparent"
                            : "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 h-5 px-2 text-xs font-medium border-transparent"
                        }
                      >
                        {item.canal}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                      {item.amount}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge
                        variant="secondary"
                        className={`${statusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.date}</TableCell>
                    <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/actors/agency/mobile-money/${item.id}`)}
                        className="size-8 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
