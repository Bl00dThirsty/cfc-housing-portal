"use client";

import * as React from "react";
import {
  Download,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface MomoTransactionItem {
  id: string;
  ref: string;
  client: string;
  canal: string;
  amount: string;
  status: string;
  date: string;
  phone?: string;
  accountNumber?: string;
}

interface MomoTransactionDetailsSheetProps {
  transaction: MomoTransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MomoTransactionDetailsSheet({
  transaction,
  open,
  onOpenChange,
}: MomoTransactionDetailsSheetProps) {
  if (!transaction) return null;

  const isReconciled = transaction.status === "Rapproché";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col justify-between bg-background border-l border-border/40">
        <div className="space-y-5 p-6">
          {/* Header */}
          <SheetHeader className="space-y-2 border-b border-border/40 pb-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Collecte Épargne Habitat · Transaction Numérique
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {transaction.ref}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <SheetTitle className="text-base font-bold text-foreground">
                  Reçu de Versement MoMo
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {transaction.client} · Opérateur {transaction.canal}
                </SheetDescription>
              </div>

              <Badge
                variant="secondary"
                className={
                  isReconciled
                    ? "bg-emerald-500/10 text-emerald-700 h-5 px-2 text-xs font-medium"
                    : "bg-amber-500/10 text-amber-700 h-5 px-2 text-xs font-medium"
                }
              >
                {transaction.status}
              </Badge>
            </div>
          </SheetHeader>

          {/* Amount Display Box */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Montant Déposé
            </span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {transaction.amount}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              Crédit sur Compte Épargne Habitat CFC · {transaction.date}
            </span>
          </div>

          {/* Transaction Metadata Lines */}
          <div className="rounded-lg border border-border/40 p-4 space-y-3 bg-card/50 text-xs">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Détails de l&apos;Opération de Paiement
            </h4>

            <div className="space-y-2 divide-y divide-border/30">
              <div className="flex items-center justify-between pt-1 text-muted-foreground">
                <span>Référence Transaction :</span>
                <span className="font-mono font-medium text-foreground">{transaction.ref}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Emprunteur / Titulaire :</span>
                <span className="font-medium text-foreground">{transaction.client}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Canal de Paiement :</span>
                <span className="font-medium text-foreground">{transaction.canal}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Date &amp; Heure d&apos;Horodatage :</span>
                <span className="text-foreground">{transaction.date}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Rapprochement SYSTAC :</span>
                <span className={isReconciled ? "text-emerald-600 font-semibold" : "text-amber-600 font-medium"}>
                  {isReconciled ? "Validé & Équilibré (Niv. 1)" : "En cours de compensation"}
                </span>
              </div>
            </div>
          </div>

          {/* Sécurité & Audit Note */}
          <div className="p-3.5 rounded-lg border border-border/30 bg-muted/20 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground text-[11.5px]">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Traçabilité &amp; Scellement Automatique</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Ce versement est automatiquement indexé dans le carnet d&apos;épargne du Dossier Unique Client (DUC).
              Un SMS de confirmation a été transmis à l&apos;emprunteur.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-muted/15 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fermer
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              Imprimer Quittance
            </Button>
            <Button
              size="sm"
              className="text-xs font-medium gap-1.5"
            >
              <Download className="size-3.5" />
              Télécharger Reçu
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
