"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Edit,
  Eye,
  CreditCard,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientsData, type ClientItem, type ClientDocument } from "../_components/data";
import { ClientBarcodeWidget } from "./_components/client-barcode-widget";
import { ClientInfoTable } from "./_components/client-info-table";
import { ClientDraggableDocs } from "./_components/client-draggable-docs";
import { ClientEditForm } from "./_components/client-edit-form";

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

export default function ClientDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "cl-1";

  const initialClient = clientsData.find((c) => c.id === id) || clientsData[0];
  const [client, setClient] = React.useState<ClientItem>(initialClient);
  const [activeTab, setActiveTab] = React.useState<"info" | "docs" | "finance" | "history">("info");
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSaveClient = (updated: ClientItem) => {
    setClient(updated);
    setIsEditing(false);
  };

  const handleDocsChange = (updatedDocs: ClientDocument[]) => {
    setClient((prev) => ({ ...prev, documents: updatedDocs }));
  };

  return (
    <div className="flex flex-col gap-6 pb-16 max-w-7xl mx-auto w-full">
      {/* 1. Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/admin/clients"
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

      {/* 3. Underlined Horizontal Tabs & Edit Button (Style Nike Air Max) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-px">
        <div className="flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("info");
              setIsEditing(false);
            }}
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

        {/* Edit Button (Style Nike Air Max Edit button) */}
        {activeTab === "info" && (
          <div>
            {isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-xs h-8 px-3 gap-1.5 font-medium"
              >
                <Eye className="size-3.5" />
                Mode Lecture
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs h-8 px-3.5 gap-1.5 font-medium border-border/60 hover:bg-muted/30"
              >
                <Edit className="size-3.5" />
                Modifier le Dossier
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 4. Tab Content Area */}
      {activeTab === "info" && (
        <div>
          {isEditing ? (
            <ClientEditForm
              client={client}
              onSave={handleSaveClient}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ClientInfoTable client={client} />
          )}
        </div>
      )}

      {activeTab === "docs" && (
        <ClientDraggableDocs
          initialDocuments={client.documents}
          onDocumentsChange={handleDocsChange}
        />
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
                <span className="text-[11px] text-muted-foreground">Apport Cible (20%)</span>
                <span className="text-base font-bold font-mono text-foreground block">
                  {client.savingsTarget}
                </span>
                <span className="text-[10px] text-muted-foreground">Condition d&apos;octroi préalable</span>
              </div>

              <div className="p-3.5 rounded-lg border border-border/30 bg-background/70 space-y-1">
                <span className="text-[11px] text-muted-foreground">Solde Mobilisé</span>
                <span className="text-base font-bold font-mono text-emerald-600 block">
                  {client.savingsCurrent}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {client.savingsPercent}% de l&apos;objectif atteint
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-border/30 bg-background/70 space-y-1">
                <span className="text-[11px] text-muted-foreground">Capacité d&apos;Endettement</span>
                <span className="text-base font-bold font-mono text-foreground block">
                  {client.debtRatio}
                </span>
                <span className="text-[10px] text-muted-foreground">Plafond BEAC ≤ 33.3%</span>
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
                    <span className="col-span-2">Canal</span>
                    <span className="col-span-4">Libellé / Référence</span>
                    <span className="col-span-2 text-right">Crédit</span>
                    <span className="col-span-2 text-right pr-2">Solde</span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {client.savingsPassbook.transactions.slice(0, 6).map((txn) => (
                      <div
                        key={txn.id}
                        className="grid grid-cols-12 p-2.5 hover:bg-muted/15 transition-colors items-center text-xs"
                      >
                        <span className="col-span-2 font-mono text-muted-foreground">{txn.date}</span>
                        <span className="col-span-2 text-foreground font-medium truncate">{txn.channel}</span>
                        <span className="col-span-4 text-muted-foreground truncate">{txn.description}</span>
                        <span className="col-span-2 text-right font-mono font-semibold text-emerald-600">
                          {txn.credit ? `+${txn.credit.toLocaleString("fr-FR")} F` : "-"}
                        </span>
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
