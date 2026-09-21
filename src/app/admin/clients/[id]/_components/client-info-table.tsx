"use client";

import * as React from "react";
import { type ClientItem } from "../../_components/data";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock } from "lucide-react";

interface ClientInfoTableProps {
  client: ClientItem;
}

export function ClientInfoTable({ client }: ClientInfoTableProps) {
  const infoRows = [
    {
      label: "Description du Dossier",
      value: `Dossier Unique Client (DUC) ouvert au Guichet Unique pour un projet de ${client.projectType.toLowerCase()}. Financement sollicité de ${client.loanAmount} remboursable sur ${client.durationYears} ans.`,
    },
    {
      label: "Profession & Statut",
      value: client.profession,
    },
    {
      label: "Employeur & Catégorie",
      value: client.employer,
    },
    {
      label: "Revenu Net Mensuel",
      value: `${client.monthlyIncome} (Vérifié bulletin & avis d'imposition)`,
    },
    {
      label: "Téléphone & Mobile Money",
      value: client.phone,
      isMono: true,
    },
    {
      label: "Adresse Email",
      value: client.email,
    },
    {
      label: "Agence CFC de Gestion",
      value: `${client.agency} (${client.region})`,
    },
    {
      label: "Conseiller Clientèle Référent",
      value: client.officer,
    },
    {
      label: "Type de Projet Immobilier",
      value: client.projectType,
    },
    {
      label: "Garantie Hypothécaire",
      value: `Titre Foncier N° ${client.landTitle} (Inscription hypothécaire de 1er rang)`,
      isMono: true,
    },
    {
      label: "Compte Épargne (Carthago)",
      value: `${client.accountNumber} · Solde disponible : ${client.savingsCurrent}`,
      isMono: true,
    },
    {
      label: "Bureau d'Études (BET)",
      value: client.betAssigned,
    },
    {
      label: "Notaire Instrumentaire",
      value: client.notaryAssigned,
    },
    {
      label: "Durée & Taux Nominale",
      value: `${client.durationYears} ans à taux fixe ${client.rate}`,
    },
    {
      label: "Mensualité Amortissement",
      value: client.monthlyPayment,
      isMono: true,
    },
    {
      label: "Ratio d'Endettement",
      value: `${client.debtRatio} (Conforme aux ratios prudentiels BEAC / COBAC ≤ 33.3%)`,
    },
  ];

  const milestones = [
    { label: "Enrôlement Guichet", value: "Validé (G1)", date: "15 Mai 2026", done: true },
    { label: "Vérification Fichier Central", value: "0 Doublon", date: "18 Mai 2026", done: true },
    { label: "Constitution Apport (20%)", value: `${client.savingsPercent}% mobilisé`, date: "En cours", done: client.savingsPercent >= 100 },
    { label: "Contre-expertise BET", value: client.betAssigned, date: "Prévue S38", done: false },
    { label: "Arbitrage Comité CRC", value: "À planifier", date: "Fin Sept 2026", done: false },
    { label: "Formalisation Hypothécaire", value: client.notaryAssigned, date: "Oct 2026", done: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main 2-Column Key/Value Table (Style Nike Air Max) */}
      <div className="lg:col-span-8 rounded-lg border border-border/30 bg-card/40 overflow-hidden shadow-2xs">
        <div className="divide-y divide-border/20 text-xs">
          {infoRows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 px-4 py-3 hover:bg-muted/15 transition-colors gap-2 sm:gap-4"
            >
              <span className="sm:col-span-4 text-muted-foreground font-medium">
                {row.label}
              </span>
              <span
                className={`sm:col-span-8 text-foreground ${
                  row.isMono ? "font-mono font-semibold" : ""
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Order History / Milestones Widget (Style Nike Air Max) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-lg border border-border/30 bg-card/40 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/20 pb-2.5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px]">
              Jalons &amp; Échéances DUC
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              {client.phase}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Complétude du dossier</span>
              <span className="font-semibold text-foreground font-mono">
                {client.completionPercent}%
              </span>
            </div>
            <Progress value={client.completionPercent} className="h-1.5" />
          </div>

          <div className="rounded-md border border-border/20 divide-y divide-border/20 overflow-hidden text-xs">
            <div className="grid grid-cols-3 p-2 bg-muted/20 font-medium text-muted-foreground text-[10.5px]">
              <span>Étape</span>
              <span>Statut</span>
              <span className="text-right">Date</span>
            </div>
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="grid grid-cols-3 p-2 hover:bg-muted/15 transition-colors items-center text-[11px]"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  {m.done ? (
                    <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                  )}
                  <span className="truncate font-medium text-foreground">
                    {m.label}
                  </span>
                </div>
                <span className="text-muted-foreground truncate">{m.value}</span>
                <span className="text-right font-mono text-muted-foreground/90 truncate">
                  {m.date}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/20 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Apport Épargne Cible :</span>
              <span className="font-mono font-semibold text-foreground">
                {client.savingsTarget}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Solde Déjà Mobilisé :</span>
              <span className="font-mono font-semibold text-emerald-600">
                {client.savingsCurrent}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Dernière Activité :</span>
              <span className="text-foreground">{client.lastActivity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
