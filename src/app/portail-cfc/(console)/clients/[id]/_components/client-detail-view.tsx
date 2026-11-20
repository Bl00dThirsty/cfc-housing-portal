"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ClientItem } from "@/domain/entities/client";
import type { AssignedNameCorrectionRequest } from "@/domain/entities/profile";
import { ClientBarcodeWidget } from "./client-barcode-widget";
import { ClientInfoTable } from "./client-info-table";
import { DossierAssignmentPanel, type AssignmentControl } from "./dossier-assignment-panel";
import { ClientDucManager } from "../../_components/client-duc-manager";
import { NameCorrectionReviewPanel } from "@/components/profile/name-correction-review-panel";

const phaseBadgeColors: Record<ClientItem["phase"], string> = {
  "Épargne & KYC": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent",
  "Risques & BET": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent",
  "Comités CGR/CRC": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-transparent",
  "Notaire & Hypothèque": "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-transparent",
  "Déblocages Travaux": "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent",
  "Clôture & Mainlevée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent",
};

const statusBadgeColors: Record<ClientItem["status"], string> = {
  Conforme: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent",
  Accordé: "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-semibold border-transparent",
  "En Examen": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent",
  "Pièces Manquantes": "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-transparent",
  Mainlevée: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-transparent",
};

export function ClientDetailView({
  initialClient,
  assignmentControl,
  correctionRequests = [],
  correctionRequestError,
  canDecideNameCorrection = false,
}: {
  initialClient: ClientItem;
  assignmentControl?: AssignmentControl;
  correctionRequests?: AssignedNameCorrectionRequest[];
  correctionRequestError?: string | null;
  canDecideNameCorrection?: boolean;
}) {
  const client = initialClient;
  const [activeTab, setActiveTab] = React.useState<"info" | "docs" | "finance" | "history">("info");

  return (
    <div className="flex flex-col gap-6 pb-16 max-w-7xl mx-auto w-full">
      {/* 1. Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/portail-cfc/clients"
          className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Répertoire des Emprunteurs
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span>Dossier Unique Client</span>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span className="text-foreground font-mono font-semibold">{client.ducId}</span>
      </div>

      {/* 2. Top Header Section (Style Nike Air Max: Title, Reference, Status, Price + Barcode Widget) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {client.name}
            </h1>
            <Badge className={`${statusBadgeColors[client.status]} text-xs rounded-md font-medium`}>
              {client.status}
            </Badge>
            <Badge className={`${phaseBadgeColors[client.phase]} text-xs rounded-md font-medium`}>
              {client.phase}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>#{client.ducId}</span>
            <span>·</span>
            <span className="font-sans font-medium">{client.projectType}</span>
            <span>·</span>
            <span>{client.agency}</span>
          </div>

          <div className="flex items-baseline gap-2 pt-1 text-sm">
            <span className="text-xs text-muted-foreground">Crédit Sollicité :</span>
            <span className="text-lg font-bold font-mono text-foreground">{client.loanAmount}</span>
            <span className="text-xs text-muted-foreground font-mono">
              ({client.durationYears} ans à {client.rate})
            </span>
            <span className="text-muted-foreground/40 mx-1">·</span>
            <span className="text-xs text-muted-foreground">Apport Mobilisé :</span>
            <span className="font-semibold text-emerald-600 font-mono">
              {client.savingsCurrent} ({client.savingsPercent}%)
            </span>
          </div>
        </div>

        {/* Right Barcode Widget (Style Nike Air Max Barcode / Print) */}
        <div className="shrink-0">
          <ClientBarcodeWidget ducId={client.ducId} clientName={client.name} />
        </div>
      </div>

      {assignmentControl ? (
        <DossierAssignmentPanel
          dossierId={client.id}
          dossierCode={client.ducId}
          currentManagerName={client.officer}
          assignment={assignmentControl}
        />
      ) : null}

      {correctionRequestError ? (
        <section role="alert" className="rounded-lg border border-destructive/30 bg-card p-4">
          <h2 className="text-sm font-semibold">Demandes de correction KYC indisponibles</h2>
          <p className="mt-1 text-xs text-muted-foreground">{correctionRequestError}</p>
        </section>
      ) : correctionRequests.map((request) => (
        <NameCorrectionReviewPanel
          key={request.id}
          currentName={client.name}
          request={request}
          canDecide={canDecideNameCorrection}
        />
      ))}

      {/* 3. Underlined Horizontal Tabs & Edit Button (Style Nike Air Max) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-px">
        <div className="flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("info")}
            className={`text-xs font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "info"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Informations Générales
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-1.5 text-xs font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "docs"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Documents DUC</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
              {client.documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("finance")}
            className={`text-xs font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "finance"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Plan Financier &amp; Épargne
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`text-xs font-semibold pb-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Historique &amp; Visas
          </button>
        </div>

      </div>

      {/* 4. Tab Content Area */}
      {activeTab === "info" && <ClientInfoTable client={client} />}

      {activeTab === "docs" && (
        <ClientDucManager client={client} />
      )}

      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/30 bg-card/40 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Carnet d&apos;Épargne Numérisé &amp; Flux Carthago
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold text-foreground">
                Compte N° {client.accountNumber}
              </span>
            </div>

            {/* Financial summary 3 numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-border/30 bg-background/70 space-y-1">
                <span className="text-[11px] text-muted-foreground">Objectif d&apos;épargne enregistré</span>
                <span className="text-base font-bold font-mono text-foreground block">
                  {client.savingsTarget}
                </span>
                <span className="text-[10px] text-muted-foreground">Valeur enregistrée pour ce dossier</span>
              </div>

              <div className="p-3.5 rounded-lg border border-border/30 bg-background/70 space-y-1">
                <span className="text-[11px] text-muted-foreground">Solde Mobilisé</span>
                <span className="text-base font-bold font-mono text-emerald-600 block">
                  {client.savingsCurrent}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {client.savingsPassbook?.savingsTarget === null ? "Objectif non renseigné" : `${client.savingsPercent}% de l’objectif enregistré`}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-border/30 bg-background/70 space-y-1">
                <span className="text-[11px] text-muted-foreground">Capacité d&apos;Endettement</span>
                <span className="text-base font-bold font-mono text-foreground block">
                  {client.debtRatio}
                </span>
                <span className="text-[10px] text-muted-foreground">Valeur issue du dossier</span>
              </div>
            </div>

            {/* Passbook Transactions Table */}
            {client.savingsPassbook && client.savingsPassbook.transactions.length > 0 ? (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Derniers Mouvements du Carnet d&apos;Épargne
                </h4>
                <div className="rounded-lg border border-border/30 overflow-hidden text-xs">
                  <div className="grid grid-cols-12 p-2.5 bg-muted/20 font-medium text-muted-foreground text-[11px]">
                    <span className="col-span-2">Date</span>
                    <span className="col-span-2">Type</span>
                    <span className="col-span-4">Libellé / Référence</span>
                    <span className="col-span-2 text-right">Montant</span>
                    <span className="col-span-2 text-center">État</span>
                    <span className="col-span-2 text-right pr-2">Solde</span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {client.savingsPassbook.transactions.slice(0, 6).map((txn) => (
                      <div
                        key={txn.id}
                        className="grid grid-cols-12 p-2.5 hover:bg-muted/15 transition-colors items-center text-xs"
                      >
                        <span className="col-span-2 font-mono text-muted-foreground">{txn.date}</span>
                        <span className="col-span-2 text-foreground font-medium truncate">{txn.type}</span>
                        <span className="col-span-4 text-muted-foreground truncate">{txn.description}</span>
                        <span className="col-span-2 text-right font-mono font-semibold text-emerald-600">
                          {txn.type === "Retrait" ? "−" : "+"}{txn.amount.toLocaleString("fr-FR")} F
                        </span>
                        <span className="col-span-2 text-center text-[10px]">{txn.status === "validated" ? "Validée" : txn.status === "rejected" ? "Rejetée" : "En attente"}</span>
                        <span className="col-span-2 text-right font-mono font-semibold text-foreground pr-2">
                          {txn.balance.toLocaleString("fr-FR")} F
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/30 bg-card/40 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Piste d&apos;Audit &amp; Visas des Pôles Métiers
                </h3>
              </div>
                <span className="text-xs text-muted-foreground font-mono">
                Dernière activité : {client.lastActivity}
              </span>
            </div>

            <div className="space-y-3">
              {client.visas.map((v, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/30 p-3.5 bg-background/60 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{v.stage}</span>
                      <span className="text-muted-foreground">· {v.actor}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] rounded-md font-medium h-5 px-2 border-transparent ${
                        v.decision === "Favorable"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : v.decision === "Réserves"
                          ? "bg-rose-500/10 text-rose-700"
                          : "bg-amber-500/10 text-amber-700"
                      }`}
                    >
                      {v.decision}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{v.comment}</p>
                  <span className="text-[10px] text-muted-foreground/80 block font-mono">{v.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
