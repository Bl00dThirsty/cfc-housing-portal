"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle2,
  X,
  FileCheck,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatFCFA, getInitials } from "@/lib/utils";

export type KanbanPhaseId =
  | "phase_1_kyc"
  | "phase_2_risks_bet"
  | "phase_3_committees"
  | "phase_4_notary"
  | "phase_5_disbursements"
  | "phase_6_closing";

export interface KanbanTask {
  id: string;
  phaseId: KanbanPhaseId;
  ducId: string;
  clientName: string;
  projectType: string;
  projectCost: number;
  loanAmount: number;
  savingsBalance: number;
  savingsTarget: number;
  title: string;
  description: string;
  priority: "Urgent" | "Normal" | "Faible";
  dueDate: string;
  progress: number;
  responsibleActor: string;
  actorRole: string;
  team: string;
  agency: string;
  attachmentsCount: number;
  commentsCount: number;
}

const KANBAN_PHASES: { id: KanbanPhaseId; stepNumber: number; title: string; shortTitle: string }[] = [
  { id: "phase_1_kyc", stepNumber: 1, title: "1. Enrôlement & KYC", shortTitle: "KYC & Épargne" },
  { id: "phase_2_risks_bet", stepNumber: 2, title: "2. Risques & Expertise BET", shortTitle: "Risques & BET" },
  { id: "phase_3_committees", stepNumber: 3, title: "3. Comités CGR / CRC", shortTitle: "Comités Décisionnels" },
  { id: "phase_4_notary", stepNumber: 4, title: "4. Notaire & Hypothèque", shortTitle: "Formalisation Notariée" },
  { id: "phase_5_disbursements", stepNumber: 5, title: "5. Déblocages Travaux (VD)", shortTitle: "Déblocages Échelonnés" },
  { id: "phase_6_closing", stepNumber: 6, title: "6. Clôture & Mainlevée", shortTitle: "Mainlevée & Clôture" },
];

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: "t1",
    phaseId: "phase_1_kyc",
    ducId: "CFC-2026-DUC-04835",
    clientName: "ABANDA Eric",
    projectType: "Acquisition Terrain",
    projectCost: 6000000,
    loanAmount: 4800000,
    savingsBalance: 540000,
    savingsTarget: 1200000,
    title: "Constitution Épargne Habitat (45%)",
    description: "Versements mensuels programmés de 100 000 FCFA via MTN MoMo.",
    priority: "Normal",
    dueDate: "30 Sept 2026",
    progress: 45,
    responsibleActor: "Suzanne Nga",
    actorRole: "Chargé Clientèle",
    team: "Agence Yaoundé Centre",
    agency: "Yaoundé Centre",
    attachmentsCount: 2,
    commentsCount: 1,
  },
  {
    id: "t2",
    phaseId: "phase_2_risks_bet",
    ducId: "CFC-2026-DUC-04829",
    clientName: "MBALLA Jean-Paul",
    projectType: "Construction Villa",
    projectCost: 15000000,
    loanAmount: 12000000,
    savingsBalance: 3000000,
    savingsTarget: 3000000,
    title: "Visite Chantier & Expertise Devis BET",
    description: "Visite contradictoire sur la parcelle du TF 4892/Mfoundi pour vérifier les devis et plans.",
    priority: "Urgent",
    dueDate: "04 Sept 2026",
    progress: 85,
    responsibleActor: "Lucien Fame",
    actorRole: "Ingénieur BET Agréé",
    team: "Bureau d'Études Techniques",
    agency: "Yaoundé Centre",
    attachmentsCount: 6,
    commentsCount: 4,
  },
  {
    id: "t3",
    phaseId: "phase_2_risks_bet",
    ducId: "CFC-2026-DUC-04712",
    clientName: "FOTSO Michel",
    projectType: "Immeuble R+1",
    projectCost: 35000000,
    loanAmount: 28000000,
    savingsBalance: 7000000,
    savingsTarget: 7000000,
    title: "Note d'Analyse du Risque de Crédit",
    description: "Vérification de la solvabilité ménage (ratio d'endettement 28% < seuil COBAC 33%).",
    priority: "Urgent",
    dueDate: "05 Sept 2026",
    progress: 90,
    responsibleActor: "Vincent Ayuk",
    actorRole: "Gestion des Risques",
    team: "Comité CGR",
    agency: "Douala Bonanjo",
    attachmentsCount: 4,
    commentsCount: 3,
  },
  {
    id: "t4",
    phaseId: "phase_3_committees",
    ducId: "CFC-2026-DUC-04655",
    clientName: "NGO NSOA Marie",
    projectType: "Logement Social SIC",
    projectCost: 18000000,
    loanAmount: 14400000,
    savingsBalance: 3600000,
    savingsTarget: 3600000,
    title: "Vote Comité de Crédit (CRC)",
    description: "Arbitrage et émission de la Notification formelle d'Accord de Prêt.",
    priority: "Normal",
    dueDate: "08 Sept 2026",
    progress: 20,
    responsibleActor: "Comité de Crédit",
    actorRole: "Membres CRC",
    team: "Comité CRC",
    agency: "Yaoundé Centre",
    attachmentsCount: 3,
    commentsCount: 2,
  },
  {
    id: "t5",
    phaseId: "phase_4_notary",
    ducId: "CFC-2026-DUC-04590",
    clientName: "TCHOUNGUI Alain",
    projectType: "Construction Villa",
    projectCost: 22000000,
    loanAmount: 17600000,
    savingsBalance: 4400000,
    savingsTarget: 4400000,
    title: "Convention Notariée & Hypothèque 1er Rang",
    description: "Signature convention chez le Notaire et inscription au Cadastre MINDCAF.",
    priority: "Normal",
    dueDate: "15 Sept 2026",
    progress: 50,
    responsibleActor: "Me Nkouendjin",
    actorRole: "Notaire Instrumentaire",
    team: "Étude Notariale",
    agency: "Sud (Kribi)",
    attachmentsCount: 4,
    commentsCount: 1,
  },
  {
    id: "t6",
    phaseId: "phase_5_disbursements",
    ducId: "CFC-2026-DUC-04410",
    clientName: "EBAH Rodrigue",
    projectType: "Construction Villa",
    projectCost: 20000000,
    loanAmount: 16000000,
    savingsBalance: 4000000,
    savingsTarget: 4000000,
    title: "Déblocage Tranche 2/3 (Valeur Disponible)",
    description: "Validation de l'attachement travaux gros œuvre et mise à disposition des fonds.",
    priority: "Normal",
    dueDate: "20 Sept 2026",
    progress: 60,
    responsibleActor: "Comptabilité Clientèle",
    actorRole: "Service Décaissements",
    team: "DFBC Comptabilité",
    agency: "Ouest (Bafoussam)",
    attachmentsCount: 5,
    commentsCount: 2,
  },
  {
    id: "t7",
    phaseId: "phase_6_closing",
    ducId: "CFC-2026-DUC-03890",
    clientName: "KAMGA Pascal",
    projectType: "Prêt Individuel Clôturé",
    projectCost: 12000000,
    loanAmount: 9600000,
    savingsBalance: 2400000,
    savingsTarget: 2400000,
    title: "Mainlevée d'Hypothèque & Restitution TF",
    description: "Décompte d'extinction à solde nul et remise du Titre Foncier original libéré.",
    priority: "Normal",
    dueDate: "Terme 15 ans",
    progress: 100,
    responsibleActor: "Conservation Foncière",
    actorRole: "Conservateur MINDCAF",
    team: "MINDCAF",
    agency: "Yaoundé Centre",
    attachmentsCount: 3,
    commentsCount: 1,
  },
];

export default function KanbanBoard() {
  const [tasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ducId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === "all" ? true : t.team.toLowerCase().includes(filterTeam.toLowerCase());
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Toolbar Recherche & Filtres */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un dossier client, N° DUC ou mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full pl-8 pr-3 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="h-8 px-2.5 rounded-lg border bg-background text-xs text-foreground focus:ring-1 focus:ring-ring outline-none"
          >
            <option value="all">Tous les intervenants</option>
            <option value="Agence">Agences CFC</option>
            <option value="BET">Bureaux d&apos;Études (BET)</option>
            <option value="Comité">Comités CGR / CRC</option>
            <option value="Notaire">Notaires Instrumentaires</option>
            <option value="DFBC">Comptabilité & Décaissements</option>
          </select>

          <Badge variant="secondary" className="h-6 text-xs font-medium text-emerald-700 bg-emerald-500/10 dark:bg-emerald-500/15 dark:text-emerald-300 gap-1.5 px-2.5 border-transparent">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Carthago Connecté
          </Badge>
        </div>
      </div>

      {/* 2. Grille Kanban des 6 Phases Réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
        {KANBAN_PHASES.map((phase) => {
          const phaseTasks = filteredTasks.filter((t) => t.phaseId === phase.id);

          return (
            <div
              key={phase.id}
              className="bg-muted/40 rounded-xl p-3 border space-y-3 min-w-[220px]"
            >
              {/* En-tête de la phase */}
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {phase.shortTitle}
                </span>
                <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] font-normal">
                  {phaseTasks.length}
                </Badge>
              </div>

              {/* Cartes de tâches */}
              <div className="space-y-2.5">
                {phaseTasks.map((task) => (
                  <Card
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 cursor-pointer hover:border-primary/50 hover:shadow-xs transition-all space-y-2.5 bg-card text-card-foreground shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <Badge variant="outline" className="text-[10px] font-mono font-medium h-4.5 px-1.5">
                          {task.ducId.split("-").pop()}
                        </Badge>
                        <h4 className="text-xs font-semibold text-foreground mt-1 truncate">
                          {task.clientName}
                        </h4>
                      </div>
                      <Badge
                        variant={task.priority === "Urgent" ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0 h-4.5"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {task.title}
                    </p>

                    <div className="text-xs font-semibold font-mono text-[#7B2E15] dark:text-amber-300">
                      {formatFCFA(task.loanAmount)}
                    </div>

                    {/* Barre de progression */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Avancement</span>
                        <span className="font-semibold text-foreground">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>

                    {/* Footer carte */}
                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                        <Avatar className="size-5 rounded-sm">
                          <AvatarFallback className="rounded-sm text-[9px]">{getInitials(task.responsibleActor)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{task.responsibleActor}</span>
                      </div>
                      <span className="shrink-0 text-[10px]">{task.dueDate}</span>
                    </div>
                  </Card>
                ))}

                {phaseTasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground italic">
                    Aucun dossier dans cette phase
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modal DUC Inspection Détaillée */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-mono font-black flex items-center justify-center text-xs">
                  DUC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedTask.clientName}</h3>
                    <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
                      {selectedTask.ducId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Projet {selectedTask.projectType} · Coût : {formatFCFA(selectedTask.projectCost)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Épargne Constituée</div>
                  <div className="text-sm font-black text-[#7B2E15] mt-0.5">
                    {formatFCFA(selectedTask.savingsBalance)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {Math.round((selectedTask.savingsBalance / selectedTask.savingsTarget) * 100)}% de l&apos;apport
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Crédit Sollicité</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {formatFCFA(selectedTask.loanAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Taux bonifié 5,5% / 15 ans</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Pôle Responsable</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {selectedTask.team}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedTask.responsibleActor}</div>
                </div>
              </div>

              {/* Action Description */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7B2E15]">
                  <Clock className="w-4 h-4" />
                  <span>Jalon en cours : {selectedTask.title}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              {/* Pièces justificatives */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Pièces Justificatives Associées au Dossier
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-800">CNI légalisée + Acte de mariage</span>
                    </div>
                    <Badge variant="success">KYC Conforme</Badge>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-800">3 Bulletins + AVI Employeur</span>
                    </div>
                    <Badge variant="success">Solvabilité Validée</Badge>
                  </div>

                  <div className="p-3 bg-white border border-amber-200 bg-amber-50/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-800">Titre Foncier N° 4892/Mfoundi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="px-2.5 py-1 text-[10px] bg-emerald-600 text-white rounded font-bold">
                        Valider
                      </button>
                      <button className="px-2.5 py-1 text-[10px] bg-slate-200 text-slate-700 rounded font-bold">
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit trail COBAC */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                  Journal de traçabilité certifié (Loi 2024/001 & COBAC R-2016/04)
                </div>
                <div>• Échéance prévisionnelle du jalon : {selectedTask.dueDate}</div>
                <div>• Responsable désigné : {selectedTask.responsibleActor} ({selectedTask.actorRole})</div>
                <div>• Synchronisation automatique avec Carthago Crédit & SYSTAC</div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)} className="text-xs">
                Fermer
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    alert(`Le dossier ${selectedTask.ducId} a été validé et transmis à l'étape suivante.`);
                    setSelectedTask(null);
                  }}
                  className="bg-[#7B2E15] hover:bg-[#5C220F] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Valider le jalon & passer à l&apos;étape suivante →
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
