"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Smartphone,
  Building2,
  Globe,
  Briefcase,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SavingsChannel, SavingsTransactionType } from "./data";

const CHANNELS: { value: SavingsChannel; label: string; icon: React.ReactNode }[] = [
  { value: "Guichet CFC", label: "Guichet CFC", icon: <Landmark className="size-3.5" /> },
  { value: "Mobile Money MTN", label: "Mobile Money MTN", icon: <Smartphone className="size-3.5 text-amber-600" /> },
  { value: "Mobile Money Orange", label: "Mobile Money Orange", icon: <Smartphone className="size-3.5 text-orange-500" /> },
  { value: "Virement Bancaire", label: "Virement Bancaire", icon: <Building2 className="size-3.5 text-blue-600" /> },
  { value: "SYSTAC", label: "SYSTAC", icon: <CreditCard className="size-3.5 text-indigo-600" /> },
  { value: "Prélèvement Employeur", label: "Prélèvement Employeur", icon: <Briefcase className="size-3.5 text-teal-600" /> },
  { value: "Virement SWIFT (Diaspora)", label: "Virement SWIFT (Diaspora)", icon: <Globe className="size-3.5 text-purple-600" /> },
];

export interface NewTransactionPayload {
  type: SavingsTransactionType;
  amount: number;
  channel: SavingsChannel;
  description: string;
  reference: string;
}

interface SavingsNewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewTransactionPayload) => void;
  clientName: string;
}

export function SavingsNewTransactionDialog({
  open,
  onOpenChange,
  onSubmit,
  clientName,
}: SavingsNewTransactionDialogProps) {
  const [txType, setTxType] = React.useState<"Dépôt" | "Retrait">("Dépôt");
  const [amount, setAmount] = React.useState("");
  const [channel, setChannel] = React.useState<SavingsChannel>("Guichet CFC");
  const [description, setDescription] = React.useState("");
  const [reference, setReference] = React.useState("");

  const resetForm = () => {
    setTxType("Dépôt");
    setAmount("");
    setChannel("Guichet CFC");
    setDescription("");
    setReference("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(/\s/g, "").replace(/,/g, "."));
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const autoRef =
      reference ||
      `REF-${channel.includes("MTN") ? "MTN" : channel.includes("Orange") ? "ORG" : channel.includes("SWIFT") ? "SWF" : channel.includes("SYSTAC") ? "SYS" : channel.includes("Employeur") ? "EMP" : channel.includes("Virement") ? "VIR" : "GCH"}-${Date.now().toString(36).toUpperCase()}`;

    onSubmit({
      type: txType,
      amount: numericAmount,
      channel,
      description: description || `${txType} ${channel}`,
      reference: autoRef,
    });

    resetForm();
    onOpenChange(false);
  };

  const isValid = (() => {
    const n = parseFloat(amount.replace(/\s/g, "").replace(/,/g, "."));
    return !isNaN(n) && n > 0;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            {txType === "Dépôt" ? (
              <ArrowDownLeft className="size-4 text-emerald-600" />
            ) : (
              <ArrowUpRight className="size-4 text-rose-600" />
            )}
            Enregistrer une opération
          </DialogTitle>
          <DialogDescription>
            Saisie manuelle pour le compte épargne logement de{" "}
            <strong>{clientName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Type d&apos;opération
            </label>
            <Select
              value={txType}
              onValueChange={(v) => setTxType(v as "Dépôt" | "Retrait")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dépôt">
                  <span className="flex items-center gap-2">
                    <ArrowDownLeft className="size-3 text-emerald-600" />
                    Dépôt (Versement)
                  </span>
                </SelectItem>
                <SelectItem value="Retrait">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="size-3 text-rose-600" />
                    Retrait
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Montant */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Montant (FCFA)
            </label>
            <Input
              type="text"
              placeholder="Ex: 200 000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Canal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Canal de paiement
            </label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as SavingsChannel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch.value} value={ch.value}>
                    <span className="flex items-center gap-2">
                      {ch.icon}
                      {ch.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Libellé <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <Input
              type="text"
              placeholder="Versement mensuel épargne logement"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Référence */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Référence{" "}
              <span className="text-muted-foreground">(auto-générée si vide)</span>
            </label>
            <Input
              type="text"
              placeholder="REF-MTN-2026-0912"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isValid}
              className={
                txType === "Dépôt"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            >
              {txType === "Dépôt" ? (
                <ArrowDownLeft className="size-3.5 mr-1" />
              ) : (
                <ArrowUpRight className="size-3.5 mr-1" />
              )}
              Enregistrer le {txType.toLowerCase()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
