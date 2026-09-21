"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { momoTransactions } from "../data";

export default function MomoTransactionDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "t1";

  const transaction = momoTransactions.find((t) => t.id === id) || momoTransactions[0];
  const isReconciled = transaction.status === "Rapproché";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/admin/actors/agency/mobile-money"
          className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Paiements Mobile Money
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span>Transaction Quittance</span>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span className="text-foreground font-mono font-semibold">{transaction.ref}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reçu de Versement Épargne MoMo
            </h1>
            <Badge
              variant="secondary"
              className={
                isReconciled
                  ? "bg-emerald-500/10 text-emerald-700 h-5 px-2 text-xs font-semibold"
                  : transaction.status === "En attente"
                  ? "bg-amber-500/10 text-amber-700 h-5 px-2 text-xs font-semibold"
                  : "bg-rose-500/10 text-rose-700 h-5 px-2 text-xs font-semibold"
              }
            >
              {transaction.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Référence Quittance : {transaction.ref} · Opérateur : {transaction.canal}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-8 gap-1.5"
          >
            <Printer className="size-3.5" />
            Imprimer Quittance
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5">
            <Download className="size-3.5" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Main Quittance Voucher (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Transaction Details Table */}
        <div className="md:col-span-8 rounded-xl border border-border/30 bg-card/40 p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] pb-2 border-b border-border/20">
            Détails de l&apos;Opération de Versement
          </h3>

          <div className="divide-y divide-border/20 text-xs">
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Emprunteur Titulaire :</span>
              <span className="col-span-7 font-semibold text-foreground">{transaction.client}</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Opérateur de Paiement :</span>
              <span className="col-span-7 text-foreground font-medium">{transaction.canal}</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Montant Crédité :</span>
              <span className="col-span-7 font-mono font-bold text-emerald-600 text-sm">
                {transaction.amount}
              </span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Date &amp; Heure d&apos;Horodatage :</span>
              <span className="col-span-7 text-foreground font-mono">{transaction.date}</span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Rapprochement SYSTAC :</span>
              <span className="col-span-7">
                {isReconciled ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="size-3" /> Validé &amp; Équilibré (Niveau 1)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                    <Clock className="size-3" /> En cours de compensation
                  </span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-12 py-2.5">
              <span className="col-span-5 text-muted-foreground">Scellement Numérique :</span>
              <span className="col-span-7 font-mono text-[10.5px] text-muted-foreground truncate">
                SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Next Steps & Link to DUC */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/30 bg-card/40 p-4 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground text-[11.5px]">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Traçabilité Guichet Unique</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Ce flux est indexé en temps réel dans le carnet d&apos;épargne du Dossier Unique Client (DUC) et crédite directement l&apos;apport personnel.
            </p>
            <Button asChild className="w-full text-xs gap-1.5 mt-2">
              <Link href="/admin/clients/cl-1">
                Accéder au DUC Emprunteur
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
