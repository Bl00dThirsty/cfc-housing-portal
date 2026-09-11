"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  CreditCard,
  ChevronRight,
  Printer,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TransactionDetail {
  id: string;
  txRef: string;
  channel: string;
  payer: string;
  phoneOrAccount: string;
  ducOrSaverId: string;
  amount: string;
  carthagoStatus: string;
  timestamp: string;
  gatewayFee: string;
  beacTraceId: string;
  journalEntry: string;
  operatorRef: string;
  ipnStatus: string;
  bankSettlementTime: string;
}

const transactionsDatabase: Record<string, TransactionDetail> = {
  "tx1": {
    id: "tx1",
    txRef: "TX-MOMO-2026-09-0891",
    channel: "MTN Mobile Money",
    payer: "ABANDA Eric",
    phoneOrAccount: "+237 677 45 12 80",
    ducOrSaverId: "CFC-2026-DUC-04829",
    amount: "250 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "08 Septembre 2026 à 11:42",
    gatewayFee: "1 250 FCFA",
    beacTraceId: "MTN-CM-9948102384",
    journalEntry: "JRN-CARTHAGO-2026-08812",
    operatorRef: "MTN-REC-849102",
    ipnStatus: "200 OK (Reçu en 1.2s)",
    bankSettlementTime: "Règlement J+0 (Instantané)",
  },
  "tx2": {
    id: "tx2",
    txRef: "TX-OM-2026-09-0442",
    channel: "Orange Money",
    payer: "NKOULOU Sandrine",
    phoneOrAccount: "+237 699 12 84 90",
    ducOrSaverId: "CFC-2026-DUC-04830",
    amount: "150 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "08 Septembre 2026 à 10:15",
    gatewayFee: "750 FCFA",
    beacTraceId: "OM-CM-8812049102",
    journalEntry: "JRN-CARTHAGO-2026-08811",
    operatorRef: "OM-PAY-77192",
    ipnStatus: "200 OK (Reçu en 0.8s)",
    bankSettlementTime: "Règlement J+0 (Instantané)",
  },
  "tx3": {
    id: "tx3",
    txRef: "TX-SYS-2026-09-0120",
    channel: "Virement SYSTAC",
    payer: "MINFI / Direction du Budget",
    phoneOrAccount: "RIB UBA 10033-05200-0192",
    ducOrSaverId: "CFC-2026-DUC-04840",
    amount: "1 200 000 FCFA",
    carthagoStatus: "Rapproché J+0",
    timestamp: "07 Septembre 2026 à 16:30",
    gatewayFee: "0 FCFA (Convention État)",
    beacTraceId: "SYSTAC-BEAC-2026-77192",
    journalEntry: "JRN-CARTHAGO-2026-08805",
    operatorRef: "BEAC-RTGS-0091",
    ipnStatus: "Télécompensation Validée",
    bankSettlementTime: "Séance SYSTAC 16h00",
  },
};

export default function TransactionDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "tx1";

  const tx = transactionsDatabase[id] || {
    ...transactionsDatabase["tx1"],
    id,
    txRef: `TX-CFC-2026-${id}`,
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin/analytics?tab=acquisition"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux Analytics
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span>Canaux de Collecte</span>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-mono font-semibold">{tx.txRef}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Printer className="size-3.5" />
            Imprimer Reçu
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Download className="size-3.5" />
            Bordereau Comptable (PDF)
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <RefreshCw className="size-3.5" />
            Re-synchroniser Carthago
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              {tx.txRef}
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent h-5 px-2 text-xs font-medium">
              {tx.channel}
            </Badge>
            <span className="text-xs text-muted-foreground">• {tx.timestamp}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bordereau de Règlement : {tx.amount}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>Payeur : <strong>{tx.payer}</strong> ({tx.phoneOrAccount})</span>
            <span>•</span>
            <span>Imputation : <strong className="font-mono">{tx.ducOrSaverId}</strong></span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <span className="text-xs text-muted-foreground">Statut Réconciliation Core Banking</span>
          <div className="flex items-baseline gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-sm font-semibold px-3 py-1 border-transparent">
              {tx.carthagoStatus}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Pièce comptable : {tx.journalEntry}</span>
        </div>
      </div>

      {/* 4 Technical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Montant Encaissé</span>
          <div className="text-2xl font-bold font-mono text-foreground">{tx.amount}</div>
          <span className="text-[11px] text-muted-foreground">Crédité au compte DUC</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Commission Passerelle</span>
          <div className="text-2xl font-bold font-mono text-muted-foreground">{tx.gatewayFee}</div>
          <span className="text-[11px] text-muted-foreground">Frais opérateur télécom</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Règlement Interbancaire</span>
          <div className="text-sm font-bold text-foreground mt-2">{tx.bankSettlementTime}</div>
          <span className="text-[11px] text-muted-foreground">Compensation BEAC</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Webhook / IPN Callback</span>
          <div className="text-sm font-mono font-bold text-emerald-600 mt-2">{tx.ipnStatus}</div>
          <span className="text-[11px] text-muted-foreground">Accusé de réception sécurisé</span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left (8 cols): Traçabilité & Données Techniques */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Traçabilité Complète de la Transaction
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Identifiant Opérateur / Gateway</span>
                <span className="font-mono font-semibold text-foreground text-sm">{tx.operatorRef}</span>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Identifiant Trace BEAC / SYSTAC</span>
                <span className="font-mono font-semibold text-foreground text-sm">{tx.beacTraceId}</span>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Écriture Core Banking Carthago</span>
                <span className="font-mono font-semibold text-foreground text-sm">{tx.journalEntry}</span>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Compte Destinataire (DUC)</span>
                <span className="font-mono font-semibold text-foreground text-sm">{tx.ducOrSaverId}</span>
              </div>
            </div>
          </div>

          {/* Journal des Événements */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Journal d&apos;Audit &amp; Horodatage
            </h3>

            <div className="rounded-lg border divide-y overflow-hidden text-xs">
              <div className="p-3 bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">1. Déclenchement de la transaction</span>
                  <span className="text-muted-foreground text-[11px]">Initiée via {tx.channel} par {tx.payer}</span>
                </div>
                <span className="font-mono text-muted-foreground">11:42:01</span>
              </div>
              <div className="p-3 bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">2. Validation Passerelle Télécom</span>
                  <span className="text-muted-foreground text-[11px]">Fonds débités et confirmés par l&apos;opérateur</span>
                </div>
                <span className="font-mono text-emerald-600 font-semibold">11:42:03 (200 OK)</span>
              </div>
              <div className="p-3 bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">3. Inscription Grand Livre Carthago</span>
                  <span className="text-muted-foreground text-[11px]">Rapprochement automatique et génération pièce {tx.journalEntry}</span>
                </div>
                <span className="font-mono text-emerald-600 font-semibold">11:42:04 (Comptabilisé)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 cols): Actions & Imputation */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Actions sur le Règlement
            </h3>
            <Button className="w-full h-10 text-xs font-semibold gap-2">
              <Download className="size-4" />
              Télécharger le Reçu Officiel CFC
            </Button>
            <Button variant="outline" className="w-full h-9 text-xs font-medium gap-2">
              <ExternalLink className="size-4" />
              Accéder au Dossier DUC Client
            </Button>
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">
              Transmettre Copie par Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
