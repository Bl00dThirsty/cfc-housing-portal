"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  FileText,
  CreditCard,
  Building,
  ChevronRight,
  Printer,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils";
import { clientsData, type ClientItem } from "../_components/data";

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
  const router = useRouter();
  const id = (params?.id as string) || "cl-1";

  const client = clientsData.find((c) => c.id === id) || clientsData[0];

  const workflowSteps = [
    { code: "Épargne & KYC", label: "1. Épargne & KYC" },
    { code: "Risques & BET", label: "2. Risques & BET" },
    { code: "Comités CGR/CRC", label: "3. Comités CGR/CRC" },
    { code: "Notaire & Hypothèque", label: "4. Notariat & Hypothèque" },
    { code: "Déblocages Travaux", label: "5. Déblocages Travaux" },
    { code: "Clôture & Mainlevée", label: "6. Clôture & Mainlevée" },
  ];

  const currentStepIndex = workflowSteps.findIndex((s) => s.code === client.phase);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Top Breadcrumbs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin/clients"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Répertoire des Emprunteurs
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span>Dossier DUC</span>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-mono font-semibold">{client.ducId}</span>
          <Badge className={`${phaseBadgeColors[client.phase]} text-[11px] rounded-md font-medium`}>
            {client.phase}
          </Badge>
          <Badge className={`${statusBadgeColors[client.status]} text-[11px] rounded-md font-medium`}>
            {client.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium rounded-md">
            <Printer className="size-3.5" />
            Imprimer Fiche
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium rounded-md">
            <Download className="size-3.5" />
            Dossier PDF
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/file-manager")}
            className="h-8 gap-1.5 px-3 text-xs font-medium rounded-md"
          >
            <FileText className="size-3.5" />
            GED Numérique
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/actors/credit-committees")}
            className="h-8 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
          >
            <CheckCircle2 className="size-3.5" />
            Transmettre Comité
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Strip: 4 Sharp Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Montant Crédit Sollicité</span>
            <Badge variant="outline" className="font-mono text-[10px] rounded-md">
              {client.rate}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">
              {client.loanAmount}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {client.durationYears} ans
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Remboursement :</span>
            <strong className="text-foreground">{client.monthlyPayment}</strong>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Apport Personnel Constitué</span>
            <Badge
              variant="secondary"
              className={
                client.savingsPercent >= 100
                  ? "bg-emerald-500/10 text-emerald-700 text-[10px] rounded-md font-semibold border-transparent"
                  : "bg-amber-500/10 text-amber-700 text-[10px] rounded-md font-semibold border-transparent"
              }
            >
              {client.savingsPercent}% mobilisé
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">
              {client.savingsCurrent}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Cible : {client.savingsTarget}
            </span>
          </div>
          <Progress value={client.savingsPercent} className="h-1.5 rounded-xs" />
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Revenus & Capacité de Remboursement</span>
            <Badge variant="outline" className="text-[10px] rounded-md text-emerald-700 bg-emerald-500/5">
              Vérifié
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">
              {client.monthlyIncome}
            </span>
            <span className="text-xs text-muted-foreground">Net mensuel</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Employeur :</span>
            <strong className="text-foreground truncate">{client.employer}</strong>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ratio d&apos;Endettement Calculé</span>
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-700 text-[10px] rounded-md font-semibold border-transparent"
            >
              BEAC ≤ 33.3%
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">
              {client.debtRatio}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Solvable & Conforme</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Garantie :</span>
            <strong className="text-foreground font-mono truncate">{client.landTitle}</strong>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Dashboard: Left Profile & Project, Right Workflow & GED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* A. Identity & Bank Profile */}
          <div className="rounded-lg border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="size-11 rounded-md flex items-center justify-center font-bold text-sm bg-primary/10 text-primary">
                {getInitials(client.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">{client.name}</h3>
                <span className="text-xs text-muted-foreground truncate">{client.profession}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="p-3 rounded-md bg-muted/30 flex items-start gap-2.5">
                <Briefcase className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">Employeur & Statut</span>
                  <span className="font-semibold text-foreground">{client.employer}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/30 flex items-start gap-2.5">
                <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">Téléphone & Paiement Mobile</span>
                  <span className="font-semibold text-foreground font-mono">{client.phone}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/30 flex items-start gap-2.5">
                <Mail className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">Adresse Email</span>
                  <span className="font-semibold text-foreground truncate">{client.email}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/30 flex items-start gap-2.5">
                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">Agence CFC de Gestion</span>
                  <span className="font-semibold text-foreground">{client.agency} ({client.region})</span>
                  <span className="text-[11px] text-muted-foreground">Conseiller référent : {client.officer}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/30 flex items-start gap-2.5">
                <CreditCard className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">Compte Épargne Habitat (Carthago)</span>
                  <span className="font-semibold text-foreground font-mono">{client.accountNumber}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Solde disponible : {client.savingsCurrent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* B. Project & Guarantees */}
          <div className="rounded-lg border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Building className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Projet Immobilier & Garanties</h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono rounded-md">
                {client.projectType}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md border bg-background space-y-1">
                <span className="text-muted-foreground text-[11px] block">Garantie Hypothécaire Principale</span>
                <span className="font-semibold text-foreground font-mono text-xs">{client.landTitle}</span>
                <span className="text-[11px] text-muted-foreground block">Affectation hypothécaire de 1er rang au profit du CFC</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md border bg-background space-y-1">
                  <span className="text-muted-foreground text-[11px] block">Bureau d&apos;Études (BET)</span>
                  <span className="font-medium text-foreground block truncate">{client.betAssigned}</span>
                </div>
                <div className="p-3 rounded-md border bg-background space-y-1">
                  <span className="text-muted-foreground text-[11px] block">Notaire Instrumentaire</span>
                  <span className="font-medium text-foreground block truncate">{client.notaryAssigned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* A. Workflow Pipeline Tracker (6 Phases) */}
          <div className="rounded-lg border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Circuit d&apos;Instruction DUC</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Complétude : {client.completionPercent}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {workflowSteps.map((step, idx) => {
                const isCurrent = step.code === client.phase;
                const isPassed = idx < currentStepIndex;

                return (
                  <div
                    key={step.code}
                    className={`p-3 rounded-md border flex flex-col gap-1 transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/5 text-foreground font-semibold shadow-2xs ring-1 ring-primary/20"
                        : isPassed
                        ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                        : "border-border/60 bg-muted/10 text-muted-foreground/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono">
                        {isPassed ? "✓ Validé" : isCurrent ? "● En cours" : `Étape ${idx + 1}`}
                      </span>
                      {isPassed && <CheckCircle2 className="size-3 text-emerald-600" />}
                    </div>
                    <span className="text-xs truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Regulatory 6 Documents Checklist (GED) */}
          <div className="rounded-lg border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  Checklist Réglementaire des Pièces Justificatives (GED)
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                6 documents obligatoires
              </span>
            </div>

            <div className="rounded-md border divide-y overflow-hidden text-xs">
              {client.documents.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-3 bg-card hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground truncate">{doc.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {doc.category} {doc.ref ? `· ${doc.ref}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-muted-foreground">{doc.date}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] rounded-md font-medium h-5 px-2 border-transparent ${
                        doc.status === "Validé"
                          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : doc.status === "En cours"
                          ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                          : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                      }`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. Visas Trail & Audit Log */}
          <div className="rounded-lg border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Traçabilité & Visas des Acteurs</h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Dernière maj : {client.lastActivity}</span>
            </div>

            <div className="space-y-3">
              {client.visas.map((v, i) => (
                <div key={i} className="rounded-md border p-3.5 bg-muted/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{v.stage}</span>
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
      </div>
    </div>
  );
}
