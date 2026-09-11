"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building,
  Clock,
  Download,
  FileCheck,
  FileText,
  Printer,
  ShieldCheck,
  User,
  Workflow,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";

import { initialBoard, columns, tagTones } from "../_components/data";
import type { ColumnId, Task } from "../_components/types";

export default function KanbanDossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || "cfc-task-1";

  // Flatten tasks to find matching task by ID or DUC ID
  const allTasks: Task[] = Object.values(initialBoard).flat();
  const task =
    allTasks.find((t) => t.id === rawId || t.ducId === rawId) ||
    allTasks[0];

  // Find column for this task
  const currentColumnId = (Object.keys(initialBoard) as ColumnId[]).find((colId) =>
    initialBoard[colId].some((t) => t.id === task.id)
  ) || "kyc_savings";

  const currentColumn = columns.find((c) => c.id === currentColumnId) || columns[0];
  const currentColumnIndex = columns.findIndex((c) => c.id === currentColumnId);

  const isSlaExceeded = task.daysInStage > task.slaMaxDays;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* 1. Back Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/kanban")}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground -ml-2 mb-1"
          >
            <ArrowLeft className="size-3.5" />
            Retour au tableau Kanban
          </Button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {task.clientName}
            </h1>
            <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 rounded-md font-semibold bg-muted/40">
              {task.ducId}
            </Badge>
            <Badge variant="secondary" className={`text-xs rounded-md font-medium ${tagTones[task.team]}`}>
              {currentColumn.title}
            </Badge>
            {isSlaExceeded ? (
              <Badge variant="destructive" className="text-xs rounded-md gap-1">
                <AlertTriangle className="size-3" />
                SLA Dépassé (J+{task.daysInStage} / {task.slaMaxDays}j)
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs rounded-md gap-1 font-mono">
                <Clock className="size-3" />
                J+{task.daysInStage} / {task.slaMaxDays}j
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {task.projectTitle} · Titre Foncier: <strong className="text-foreground">{task.landTitle || "TF N° 12450/Mfoundi"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-md text-xs"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5" />
            Imprimer Fiche DUC
          </Button>

          {task.clientId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-md text-xs"
              onClick={() => router.push(`/admin/clients/${task.clientId}`)}
            >
              <User className="size-3.5" />
              Fiche Emprunteur
            </Button>
          )}

          <Button size="sm" className="gap-1.5 rounded-md text-xs font-semibold">
            Avancer à l&apos;étape suivante
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Pipeline Workflow Stepper (6 stages) */}
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
            Progression du Cycle DUC (6 Étapes Règlementaires)
          </span>
          <span className="font-mono font-bold text-foreground">
            Étape {currentColumnIndex + 1} / 6 · {task.progress}% complété
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {columns.map((col, idx) => {
            const isCompleted = idx < currentColumnIndex;
            const isCurrent = idx === currentColumnIndex;

            return (
              <div
                key={col.id}
                className={`flex flex-col gap-1 p-2.5 rounded-md border text-xs transition-all ${
                  isCurrent
                    ? "bg-primary/10 border-primary text-foreground font-semibold"
                    : isCompleted
                    ? "bg-muted/40 border-emerald-500/30 text-muted-foreground"
                    : "bg-muted/10 border-border/40 text-muted-foreground/60 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                  {isCompleted ? (
                    <BadgeCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <span className="size-2 rounded-full bg-border" />
                  )}
                </div>
                <span className="line-clamp-1 text-[11px]">{col.title.replace(/^\d+\.\s*/, "")}</span>
                <span className="text-[10px] text-muted-foreground">
                  {isCompleted ? "Validé" : isCurrent ? "En cours d'instruction" : "En attente"}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={task.progress} className="h-1.5 rounded-full" />
      </div>

      {/* 3. 4 Key Financial & Risk KPI Cards (Crisp rounded-lg, zero decorative filler icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-2 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Financement Sollicité</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">{task.amount}</span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">
              Prêt Logement
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Durée: 15 ans à taux bonifié CFC 4.75%</span>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-2 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Apport Personnel Épargne</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {task.equityContribution || "4 800 000 FCFA"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Carthago 20%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Vérifié &amp; consigné au compte séquestre</span>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-2 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Taux d&apos;Endettement BEAC</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {task.cobacRatio || "27.8%"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              &lt; 33% COBAC
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Capacité de remboursement validée</span>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-2 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Gestionnaire &amp; Agence</span>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className={`size-7 rounded-md ${task.owner.tone}`}>
              <AvatarFallback className="rounded-md text-[10px] font-bold">
                {getInitials(task.owner.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{task.owner.name}</span>
              <span className="text-[11px] text-muted-foreground">{task.agency}</span>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">Délai phase : J+{task.daysInStage}</span>
        </div>
      </div>

      {/* 4. Deep Tabbed Detail View */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto border-b rounded-none p-0 h-auto bg-transparent">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-semibold"
          >
            Fiche Emprunteur &amp; Projet
          </TabsTrigger>
          <TabsTrigger
            value="technical"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-semibold"
          >
            Analyse Risques &amp; BET
          </TabsTrigger>
          <TabsTrigger
            value="committees"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-semibold"
          >
            Visas &amp; Comités (CRC/CGR)
          </TabsTrigger>
          <TabsTrigger
            value="ged"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-semibold"
          >
            Documents GED Scellés (6)
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-semibold"
          >
            Journal d&apos;Audit &amp; SLA
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Fiche Emprunteur & Projet */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emprunteur Identity */}
            <div className="rounded-lg border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-2.5">
                <User className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Profil de l&apos;Emprunteur</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nom &amp; Prénoms</span>
                  <span className="font-semibold text-foreground">{task.clientName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Matricule DUC</span>
                  <span className="font-mono font-semibold text-foreground">{task.ducId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Profession</span>
                  <span className="font-medium text-foreground">Cadre Supérieur du Secteur Public</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employeur</span>
                  <span className="font-medium text-foreground">Ministère des Travaux Publics (MINTP)</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Revenu Net Mensuel</span>
                  <span className="font-mono font-semibold text-foreground">1 150 000 FCFA</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Épargne Carthago</span>
                  <span className="font-mono font-semibold text-foreground">4 800 000 FCFA</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Téléphone</span>
                  <span className="font-mono text-foreground">+237 699 12 34 56</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Agence CFC</span>
                  <span className="font-medium text-foreground">{task.agency}</span>
                </div>
              </div>
            </div>

            {/* Projet & Foncier */}
            <div className="rounded-lg border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-2.5">
                <Building className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Caractéristiques du Bien Immobilier</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Intitulé du Programme</span>
                  <span className="font-semibold text-foreground">{task.projectTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Titre Foncier (MINDCAF)</span>
                  <span className="font-mono font-semibold text-foreground">{task.landTitle || "TF N° 12450/Mfoundi"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Localisation</span>
                  <span className="font-medium text-foreground">Yaoundé Olembé (Zone Résidentielle)</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Superficie du Lot</span>
                  <span className="font-mono font-medium text-foreground">500 m²</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Valeur Vénale Terrain</span>
                  <span className="font-mono font-semibold text-foreground">9 000 000 FCFA</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Coût Estimatif Travaux</span>
                  <span className="font-mono font-semibold text-foreground">24 000 000 FCFA</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Hypothèque Projetée</span>
                  <span className="font-medium text-emerald-600">1er rang au profit du CFC</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Permis de Bâtir</span>
                  <span className="font-mono text-foreground">N° 2026/CUY/DUS/0481</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Analyse Risques & BET */}
        <TabsContent value="technical" className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-foreground">Rapport d&apos;Expertise Technique &amp; BET Epsilon</h3>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-xs rounded-md">
                Avis Favorable BET
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-md bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Conformité Urbanistique</span>
                <span className="font-semibold text-foreground">Zone constructible R+1 conforme</span>
                <p className="text-[11px] text-muted-foreground mt-1">Servitudes de recul et d&apos;alignement respectées.</p>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Étude de Sol &amp; Géotechnique</span>
                <span className="font-semibold text-foreground">Sol latéritique stable</span>
                <p className="text-[11px] text-muted-foreground mt-1">Semelles isolées ancrées à 1.80m.</p>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border">
                <span className="text-muted-foreground block text-[11px]">Devis Quantitatif Estimatif</span>
                <span className="font-mono font-semibold text-foreground">24 000 000 FCFA validé</span>
                <p className="text-[11px] text-muted-foreground mt-1">Échéancier de décaissement en 3 tranches (30%/40%/30%).</p>
              </div>
            </div>

            <div className="rounded-md border p-3 bg-muted/20 text-xs space-y-1">
              <span className="font-semibold text-foreground">Conclusions de l&apos;Ingénieur BET :</span>
              <p className="text-muted-foreground leading-relaxed">
                Le projet présente une faisabilité technique excellente. Les accès aux réseaux CAMWATER et ENEO sont existants à moins de 25 mètres. Les devis présentés sont conformes à la grille des prix unitaires de référence du CFC.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Visas & Comités */}
        <TabsContent value="committees" className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b pb-3">
              <Workflow className="size-4 text-purple-600" />
              <h3 className="font-semibold text-sm text-foreground">Résolutions des Organes d&apos;Arbitrage CFC</h3>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Organe / Instance</TableHead>
                  <TableHead className="text-xs">Date de Séance</TableHead>
                  <TableHead className="text-xs">Décision</TableHead>
                  <TableHead className="text-xs">Conditions Particulières</TableHead>
                  <TableHead className="text-xs">Signataire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-xs">Comité de Gestion des Risques (CGR)</TableCell>
                  <TableCell className="font-mono text-xs">28 Août 2026</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10.5px] rounded-md">
                      Favorable
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    Endettement 27.8% &lt; plafond 33% COBAC
                  </TableCell>
                  <TableCell className="text-xs">Dr. Eboumbou</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-xs">Comité Régional de Crédit (CRC Yaoundé)</TableCell>
                  <TableCell className="font-mono text-xs">02 Sept 2026</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10.5px] rounded-md">
                      Accord de Principe
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    Inscription hypothèque notariée de 1er rang
                  </TableCell>
                  <TableCell className="text-xs">Vincent Ayuk</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 4: Documents GED */}
        <TabsContent value="ged" className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Inventaire des Pièces Justificatives Numérisées GED</h3>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 rounded-md">
                <Download className="size-3.5" />
                Télécharger tout l&apos;archive (.ZIP)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "CNI Emprunteur & Acte de Mariage", code: "GED-01", status: "Conforme", date: "15 Août 2026" },
                { name: "3 Derniers Bulletins & Attestation de Virement Irrévocable (AVI)", code: "GED-02", status: "Conforme", date: "16 Août 2026" },
                { name: "Certificat de Propriété Foncière Récent (MINDCAF)", code: "GED-03", status: "Conforme", date: "18 Août 2026" },
                { name: "Permis de Bâtir & Plan d'Architecture Visé", code: "GED-04", status: "Conforme", date: "22 Août 2026" },
                { name: "Devis Descriptif & Quantitatif Estimatif BET Epsilon", code: "GED-05", status: "Conforme", date: "25 Août 2026" },
                { name: "Police d'Assurance Incendie & Décès-Invalidité (TRC)", code: "GED-06", status: "En attente signature notaire", date: "En cours" },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-xs text-foreground truncate">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{doc.code}</span>
                      <span>·</span>
                      <span>Reçu le {doc.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] rounded-md ${
                        doc.status === "Conforme"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-amber-500/10 text-amber-700"
                      }`}
                    >
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-7 rounded-md">
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Journal d'Audit & SLA */}
        <TabsContent value="audit" className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b pb-3">
              <Clock className="size-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Historique Chronologique des Événements &amp; Visas</h3>
            </div>

            <div className="space-y-4">
              {[
                { time: "Aujourd'hui, 09:15", title: "Mise à jour statut instruction", author: task.owner.name, desc: "Revue des pièces et calcul de la quotité disponible sur salaire." },
                { time: "Hier, 14:30", title: "Avis technique BET Epsilon enregistré", author: "Lucien Fame (BET)", desc: "Dépôt du rapport de visite contradictoire avec mention favorable." },
                { time: "28 Août 2026, 11:00", title: "Attestation d'épargne Carthago validée", author: "Suzanne Nga", desc: "Apport personnel de 4.8M FCFA confirmé au compte séquestre." },
                { time: "14 Août 2026, 08:45", title: "Enrôlement initial du Dossier Unique de Crédit (DUC)", author: "Guichet Agence Yaoundé", desc: "Création du dossier et génération du numéro CFC-2026-DUC-04829." },
              ].map((log, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <span className="size-2 rounded-full bg-primary mt-1.5" />
                    {idx < 3 && <span className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className="space-y-0.5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{log.title}</span>
                      <span className="text-[10.5px] text-muted-foreground font-mono">{log.time}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{log.desc}</p>
                    <span className="text-[10px] text-primary/80 font-medium">Par {log.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
