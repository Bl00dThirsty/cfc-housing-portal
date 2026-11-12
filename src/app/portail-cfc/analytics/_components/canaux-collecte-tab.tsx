"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Download, MoreHorizontal, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function CanauxCollecteTab() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedChannel, setSelectedChannel] = React.useState<string>("all");

  const filtered = transactionsData.filter((t) => {
    const matchesSearch =
      t.payer.toLowerCase().includes(search.toLowerCase()) ||
      t.txRef.toLowerCase().includes(search.toLowerCase()) ||
      t.ducOrSaverId.toLowerCase().includes(search.toLowerCase()) ||
      t.phoneOrAccount.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = selectedChannel === "all" || t.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, payeur, N° DUC ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedChannel("all")}
              className={`h-7 text-xs px-2.5 ${selectedChannel === "all" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Tous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedChannel("MTN MoMo")}
              className={`h-7 text-xs px-2.5 ${selectedChannel === "MTN MoMo" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              MoMo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedChannel("Orange Money")}
              className={`h-7 text-xs px-2.5 ${selectedChannel === "Orange Money" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              OM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedChannel("Virement SYSTAC")}
              className={`h-7 text-xs px-2.5 ${selectedChannel === "Virement SYSTAC" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              SYSTAC
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium ml-2">
              <Download className="size-3.5" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Flux</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Canal de Collecte</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Payeur / Émetteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Affectation DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Encaissé</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Carthago</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Horodatage</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/analytics/transactions/${item.id}`)}
                >
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.txRef}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${channelStyles[item.channel] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{item.payer}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.phoneOrAccount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducOrSaverId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.amount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${carthagoStatusStyles[item.carthagoStatus] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.carthagoStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
                        <DropdownMenuLabel className="text-xs font-semibold">Actions Transaction</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/transactions/${item.id}`)} className="cursor-pointer text-xs">
                          <FileText className="size-3.5 mr-2 text-muted-foreground" />
                          Voir la preuve de règlement
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/transactions/${item.id}`)} className="cursor-pointer text-xs">
                          <RefreshCw className="size-3.5 mr-2 text-muted-foreground" />
                          Forcer le rapprochement Carthago
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/transactions/${item.id}`)} className="cursor-pointer text-xs">
                          <Download className="size-3.5 mr-2 text-muted-foreground" />
                          Télécharger le reçu fiscal (PDF)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/transactions/${item.id}`)} className="cursor-pointer text-xs text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="size-3.5 mr-2" />
                          Signaler un litige / anomalie
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
