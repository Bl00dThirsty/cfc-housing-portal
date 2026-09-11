"use client";

import * as React from "react";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import {
  AlertTriangle,
  CheckSquare,
  Flame,
  FolderOpen,
  Paperclip,
  Plus,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, getInitials } from "@/lib/utils";

import { type ClientItem, clientsData } from "./data";
import {
  KanbanCardDialog,
  type ClientKanbanTask,
} from "./kanban-card-dialog";

export type ColumnId =
  | "kyc_savings"
  | "risk_bet"
  | "committees"
  | "notary_mortgage"
  | "disbursements"
  | "closing_release";

export const kanbanColumns: { id: ColumnId; title: string; subtitle: string }[] = [
  { id: "kyc_savings", title: "1. Épargne & KYC", subtitle: "Apport 20% & Enrôlement" },
  { id: "risk_bet", title: "2. Risques & BET", subtitle: "Expertise technique & Solvabilité" },
  { id: "committees", title: "3. Comités CGR / CRC", subtitle: "Arbitrage & Accord de prêt" },
  { id: "notary_mortgage", title: "4. Notaire & Hypothèque", subtitle: "Minute notariée & MINDCAF" },
  { id: "disbursements", title: "5. Déblocages Travaux", subtitle: "Déblocage par tranches" },
  { id: "closing_release", title: "6. Clôture & Mainlevée", subtitle: "Extinction & Quittance" },
];

export const columnIds: ColumnId[] = [
  "kyc_savings",
  "risk_bet",
  "committees",
  "notary_mortgage",
  "disbursements",
  "closing_release",
];

// Generate tailored tasks for any selected client
function generateClientBoard(client: ClientItem): Record<ColumnId, ClientKanbanTask[]> {
  const isPhase1 = client.phase === "Épargne & KYC";
  const isPhase2 = client.phase === "Risques & BET";
  const isPhase3 = client.phase === "Comités CGR/CRC";
  const isPhase4 = client.phase === "Notaire & Hypothèque";
  const isPhase5 = client.phase === "Déblocages Travaux";
  const isPhase6 = client.phase === "Clôture & Mainlevée";

  return {
    kyc_savings: [
      {
        id: `tsk-${client.id}-1`,
        title: `Constitution Apport Personnel (${client.savingsTarget})`,
        description: `Suivi du versement de l'apport cible (actuellement ${client.savingsCurrent}, soit ${client.savingsPercent}%). Compte d'épargne logement Carthago N° ${client.accountNumber}.`,
        priority: isPhase1 ? "High" : "Low",
        dueDate: "30 Sept 2026",
        daysInStage: isPhase1 ? 8 : 2,
        slaMaxDays: 15,
        progress: client.savingsPercent,
        assignedOfficer: client.officer,
        officerTone: "bg-blue-500/20 text-blue-800",
        tags: ["Carthago", "Apport 20%"],
        checklists: [
          { id: "c1", title: "Ouverture du compte d'épargne Carthago", completed: true },
          { id: "c2", title: "Versement de l'apport minimum légal (20%)", completed: client.savingsPercent >= 100 },
          { id: "c3", title: "Attestation de solde certifiée par le Chef d'Agence", completed: client.savingsPercent >= 100 },
        ],
        attachments: [
          { name: `Attestation_Solde_${client.ducId}.pdf`, size: "1.2 MB", date: "15/08/2026" },
          { name: "Releve_Carthago_Mouvements.pdf", size: "840 KB", date: "20/08/2026" },
        ],
        activities: [
          { id: "a1", author: client.officer, authorTone: "bg-blue-500/20 text-blue-800", action: "a validé le dépôt initial", date: "Il y a 3 jours", comment: "Solde vérifié conforme aux exigences de quotité." },
        ],
      },
      {
        id: `tsk-${client.id}-2`,
        title: "Conformité KYC & Enrôlement Biométrique",
        description: "Contrôle d'authenticité de la CNI, acte d'état civil et attestation d'immatriculation fiscale.",
        priority: "Medium",
        dueDate: "20 Sept 2026",
        daysInStage: 4,
        slaMaxDays: 10,
        progress: 100,
        assignedOfficer: client.officer,
        officerTone: "bg-emerald-500/20 text-emerald-800",
        tags: ["KYC", "Identité"],
        checklists: [
          { id: "k1", title: "CNI en cours de validité certifiée", completed: true },
          { id: "k2", title: "Certificat de domicile ou facture ENEO/CAMWATER", completed: true },
          { id: "k3", title: "Fiche d'identification biométrique scannée", completed: true },
        ],
        attachments: [
          { name: "CNI_Certifiee.pdf", size: "2.1 MB", date: "12/08/2026" },
        ],
        activities: [
          { id: "a2", author: "Guichet Agence", authorTone: "bg-slate-500/20 text-slate-800", action: "a certifié les pièces d'identité", date: "12/08/2026" },
        ],
      },
    ],
    risk_bet: [
      {
        id: `tsk-${client.id}-3`,
        title: `Contre-Expertise Technique & Devis (${client.betAssigned})`,
        description: `Vérification du Devis Quantitatif Estimatif (DQE) pour les travaux de ${client.projectType}. Sondage géotechnique et bornage contradictoire sur ${client.landTitle}.`,
        priority: isPhase2 ? "High" : "Medium",
        dueDate: "15 Oct 2026",
        daysInStage: isPhase2 ? 14 : 5,
        slaMaxDays: 15,
        progress: isPhase2 ? 80 : isPhase1 ? 20 : 100,
        assignedOfficer: client.betAssigned,
        officerTone: "bg-amber-500/20 text-amber-800",
        tags: ["BET", "Génie Civil", "Chantier"],
        checklists: [
          { id: "b1", title: "Visite sur site avec procès-verbal contradictoire", completed: !isPhase1 },
          { id: "b2", title: "Vérification des prix unitaires selon la mercuriale CFC", completed: !isPhase1 },
          { id: "b3", title: "Rapport d'expertise géotechnique visé", completed: !isPhase1 },
        ],
        attachments: [
          { name: `Rapport_Expertise_${client.betAssigned.replace(/\s+/g, "_")}.pdf`, size: "4.5 MB", date: "28/08/2026" },
          { name: "Plan_Situation_Geometre.pdf", size: "3.2 MB", date: "22/08/2026" },
        ],
        activities: [
          { id: "a3", author: client.betAssigned, authorTone: "bg-amber-500/20 text-amber-800", action: "a émis un avis technique", date: "28/08/2026", comment: "Terrain constructible, devis jugé raisonnable." },
        ],
      },
      {
        id: `tsk-${client.id}-4`,
        title: `Analyse Solvabilité COBAC (Ratio: ${client.debtRatio})`,
        description: `Contrôle de la capacité d'endettement (mensualité prévisionnelle ${client.monthlyPayment} pour un revenu net de ${client.monthlyIncome}).`,
        priority: "High",
        dueDate: "22 Oct 2026",
        daysInStage: isPhase2 ? 11 : 3,
        slaMaxDays: 12,
        progress: !isPhase1 ? 100 : 50,
        assignedOfficer: "Direction des Risques",
        officerTone: "bg-purple-500/20 text-purple-800",
        tags: ["COBAC", "Scoring"],
        checklists: [
          { id: "s1", title: "Vérification Centrale des Risques BEAC (zéro impayé)", completed: true },
          { id: "s2", title: "Calcul de la quotité cessible sur salaire (max 33%)", completed: true },
          { id: "s3", title: "Attestation de virement irrévocable (AVI) bancaire", completed: !isPhase1 },
        ],
        attachments: [
          { name: "Fiche_Scoring_COBAC.pdf", size: "980 KB", date: "25/08/2026" },
        ],
        activities: [
          { id: "a4", author: "Analyste Risques", authorTone: "bg-purple-500/20 text-purple-800", action: "a validé le ratio d'endettement", date: "25/08/2026" },
        ],
      },
    ],
    committees: [
      {
        id: `tsk-${client.id}-5`,
        title: `Arbitrage Comité Régional de Crédit (CRC)`,
        description: `Présentation du dossier de prêt de ${client.loanAmount} en séance pour décision collégiale et validation de l'offre préalable.`,
        priority: isPhase3 ? "High" : "Medium",
        dueDate: "28 Oct 2026",
        daysInStage: isPhase3 ? 6 : 0,
        slaMaxDays: 10,
        progress: isPhase3 ? 75 : isPhase4 || isPhase5 || isPhase6 ? 100 : 0,
        assignedOfficer: "Secrétariat CRC",
        officerTone: "bg-rose-500/20 text-rose-800",
        tags: ["Comité", "Arbitrage"],
        checklists: [
          { id: "cm1", title: "Inscription à l'ordre du jour du CRC", completed: isPhase3 || isPhase4 || isPhase5 || isPhase6 },
          { id: "cm2", title: "Examen des garanties hypothécaires", completed: isPhase4 || isPhase5 || isPhase6 },
          { id: "cm3", title: "Signature de la résolution d'accord de prêt", completed: isPhase4 || isPhase5 || isPhase6 },
        ],
        attachments: [
          { name: "Extrait_PV_Decision_CRC.pdf", size: "1.1 MB", date: "02/09/2026" },
        ],
        activities: [
          { id: "a5", author: "Président CRC", authorTone: "bg-rose-500/20 text-rose-800", action: "a émis un accord de principe", date: "02/09/2026" },
        ],
      },
    ],
    notary_mortgage: [
      {
        id: `tsk-${client.id}-6`,
        title: `Rédaction Convention Notariée (${client.notaryAssigned})`,
        description: `Inscription de l'hypothèque conventionnelle de 1er rang sur le Titre Foncier ${client.landTitle} auprès de la Conservation Foncière (MINDCAF).`,
        priority: isPhase4 ? "High" : "Medium",
        dueDate: "10 Nov 2026",
        daysInStage: isPhase4 ? 12 : 0,
        slaMaxDays: 15,
        progress: isPhase4 ? 60 : isPhase5 || isPhase6 ? 100 : 0,
        assignedOfficer: client.notaryAssigned,
        officerTone: "bg-indigo-500/20 text-indigo-800",
        tags: ["MINDCAF", "Hypothèque", "Notaire"],
        checklists: [
          { id: "n1", title: "Dépôt de la réquisition d'hypothèque à la Conservation", completed: isPhase4 || isPhase5 || isPhase6 },
          { id: "n2", title: "Souscription des polices d'assurance Incendie & ADI", completed: isPhase5 || isPhase6 },
          { id: "n3", title: "Délivrance de la grosse notariée visée avec bordereau", completed: isPhase5 || isPhase6 },
        ],
        attachments: [
          { name: "Projet_Acte_Pret_Hypothecaire.pdf", size: "3.8 MB", date: "05/09/2026" },
        ],
        activities: [
          { id: "a6", author: client.notaryAssigned, authorTone: "bg-indigo-500/20 text-indigo-800", action: "a engagé la publication légale", date: "05/09/2026" },
        ],
      },
    ],
    disbursements: [
      {
        id: `tsk-${client.id}-7`,
        title: "Ordonnancement Déblocages Travaux (3 Tranches)",
        description: `Mise à disposition échelonnée du prêt de ${client.loanAmount} sur présentation des procès-verbaux de valeur disponible (PVD) visés par le BET.`,
        priority: isPhase5 ? "High" : "Low",
        dueDate: "20 Déc 2026",
        daysInStage: isPhase5 ? 7 : 0,
        slaMaxDays: 15,
        progress: isPhase5 ? 50 : isPhase6 ? 100 : 0,
        assignedOfficer: "Comptabilité SYSTAC",
        officerTone: "bg-teal-500/20 text-teal-800",
        tags: ["SYSTAC", "Décaissement"],
        checklists: [
          { id: "d1", title: "Tranche 1 (Fondations 30%) débloquée", completed: isPhase5 || isPhase6 },
          { id: "d2", title: "PV de récolement et factures acquittées reçus", completed: isPhase6 },
          { id: "d3", title: "Tranche 2 (Gros œuvre 40%) ordonnancée", completed: isPhase6 },
        ],
        attachments: [
          { name: "Ordre_Virement_SYSTAC_Tranche1.pdf", size: "1.4 MB", date: "10/09/2026" },
        ],
        activities: [
          { id: "a7", author: "Comptable SYSTAC", authorTone: "bg-teal-500/20 text-teal-800", action: "a exécuté le premier virement", date: "10/09/2026" },
        ],
      },
    ],
    closing_release: [
      {
        id: `tsk-${client.id}-8`,
        title: "Clôture & Mainlevée d'Hypothèque",
        description: `Extinction totale de la dette au terme de la durée de ${client.durationYears} ans, quittance officielle et radiation de l'inscription d'hypothèque.`,
        priority: isPhase6 ? "High" : "Low",
        dueDate: "28 Août 2039",
        daysInStage: isPhase6 ? 3 : 0,
        slaMaxDays: 10,
        progress: isPhase6 ? 100 : 0,
        assignedOfficer: "Direction Juridique",
        officerTone: "bg-emerald-500/20 text-emerald-800",
        tags: ["Quittance", "Mainlevée"],
        checklists: [
          { id: "cl1", title: "Vérification solde zéro sur Core Banking Carthago", completed: isPhase6 },
          { id: "cl2", title: "Rédaction de l'acte de mainlevée notariée", completed: isPhase6 },
          { id: "cl3", title: "Restitution du Titre Foncier original à l'emprunteur", completed: isPhase6 },
        ],
        attachments: [
          { name: "Certificat_Radiation_Hypotheque.pdf", size: "1.8 MB", date: "28/08/2026" },
        ],
        activities: [
          { id: "a8", author: "Directeur Juridique", authorTone: "bg-emerald-500/20 text-emerald-800", action: "a signé l'acte de mainlevée", date: "28/08/2026" },
        ],
      },
    ],
  };
}

interface ClientKanbanProps {
  client: ClientItem | null;
  onSelectClient?: (client: ClientItem) => void;
  onOpenDuc?: () => void;
}

export function ClientKanban({ client, onSelectClient, onOpenDuc }: ClientKanbanProps) {
  // If no client selected, show guidance screen
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card space-y-4 my-6">
        <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <User className="size-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-bold text-foreground">Aucun Emprunteur Sélectionné</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Le tableau Kanban est structuré autour du cycle de crédit d&apos;un client. Veuillez sélectionner un emprunteur dans le répertoire pour afficher son pipeline d&apos;instruction personnalisé.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {clientsData.slice(0, 4).map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              className="text-xs rounded-md gap-1.5"
              onClick={() => onSelectClient?.(c)}
            >
              <Avatar className={cn("size-4 rounded-md", c.avatarTone)}>
                <AvatarFallback className="text-[8px] font-bold">{getInitials(c.name)}</AvatarFallback>
              </Avatar>
              {c.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return <ClientKanbanActive client={client} onOpenDuc={onOpenDuc} />;
}

function ClientKanbanActive({ client, onOpenDuc }: { client: ClientItem; onOpenDuc?: () => void }) {
  const [board, setBoard] = React.useState<Record<ColumnId, ClientKanbanTask[]>>(() =>
    generateClientBoard(client)
  );
  const [selectedTask, setSelectedTask] = React.useState<{
    task: ClientKanbanTask;
    columnTitle: string;
  } | null>(null);

  // Update board if client prop changes
  React.useEffect(() => {
    setBoard(generateClientBoard(client));
  }, [client]);

  const boardBeforeDrag = React.useRef<Record<ColumnId, ClientKanbanTask[]>>(board);

  function handleDragStart(event: DragStartEvent) {
    const { source } = event.operation;
    if (source?.type === "task") {
      boardBeforeDrag.current = board;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "task") {
      setBoard((currentBoard) => move(currentBoard, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;
    if (!source) return;
    if (event.canceled && source.type === "task") {
      setBoard(boardBeforeDrag.current);
    }
  }

  const handleTaskUpdate = (updatedTask: ClientKanbanTask) => {
    setBoard((curr) => {
      const copy = { ...curr };
      for (const colKey of columnIds) {
        copy[colKey] = copy[colKey].map((t) => (t.id === updatedTask.id ? updatedTask : t));
      }
      return copy;
    });
  };

  const handleMoveToNextStage = (taskId: string) => {
    setBoard((curr) => {
      const copy = { ...curr };
      let taskToMove: ClientKanbanTask | null = null;
      let currentColIndex = -1;

      for (let i = 0; i < columnIds.length; i++) {
        const colId = columnIds[i];
        const found = copy[colId].find((t) => t.id === taskId);
        if (found) {
          taskToMove = found;
          currentColIndex = i;
          copy[colId] = copy[colId].filter((t) => t.id !== taskId);
          break;
        }
      }

      if (taskToMove && currentColIndex >= 0 && currentColIndex < columnIds.length - 1) {
        const nextColId = columnIds[currentColIndex + 1];
        taskToMove.progress = 100;
        copy[nextColId] = [taskToMove, ...copy[nextColId]];
      }

      return copy;
    });
  };

  // Calculate total tasks and completion
  const allTasks = Object.values(board).flat();
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.progress >= 100).length;
  const overallPercent = Math.round((completedTasks / (totalTasks || 1)) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Sub-Header: Client Pipeline Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border bg-muted/20">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-background">
            {client.ducId}
          </Badge>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Pipeline Individuel · {client.name}
              <span className="text-muted-foreground font-normal">({client.projectType})</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Prêt: <strong className="text-foreground">{client.loanAmount}</strong> · Apport:{" "}
              <strong className="text-foreground">{client.savingsCurrent}</strong> ({client.savingsPercent}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Progression Globale:</span>
              <strong className="text-foreground">{overallPercent}%</strong>
            </div>
            <Progress value={overallPercent} className="h-1.5 w-32 rounded-full" />
          </div>

          {onOpenDuc && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-md text-xs font-medium"
              onClick={onOpenDuc}
            >
              <FolderOpen className="size-3.5 text-primary" />
              Consulter Pièces DUC
            </Button>
          )}
        </div>
      </div>

      {/* 2. DragDropProvider & 6 Pipeline Columns */}
      <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="scrollbar-thin min-h-[580px] overflow-x-auto overflow-y-hidden rounded-lg bg-muted/10 p-2 border [scrollbar-color:var(--border)_transparent]">
          <div className="inline-grid h-full min-w-full grid-cols-[repeat(6,minmax(19rem,1fr))] gap-3">
            {kanbanColumns.map((column, index) => {
              const colTasks = board[column.id] || [];
              return (
                <ClientKanbanColumn
                  key={column.id}
                  column={column}
                  index={index}
                  tasks={colTasks}
                  onCardClick={(task) =>
                    setSelectedTask({ task, columnTitle: column.title })
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {(source) => {
            if (!source || !source.data) return null;
            const task = source.data.task as ClientKanbanTask;
            if (!task) return null;
            return <ClientTaskCard task={task} isOverlay />;
          }}
        </DragOverlay>
      </DragDropProvider>

      {/* 3. Trello-like Modal Pop-up */}
      <KanbanCardDialog
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask?.task || null}
        columnTitle={selectedTask?.columnTitle || ""}
        client={client}
        onTaskUpdate={handleTaskUpdate}
        onMoveToNextStage={handleMoveToNextStage}
      />
    </div>
  );
}

interface ColumnProps {
  column: { id: ColumnId; title: string; subtitle: string };
  index: number;
  tasks: ClientKanbanTask[];
  onCardClick: (task: ClientKanbanTask) => void;
}

function ClientKanbanColumn({ column, index, tasks, onCardClick }: ColumnProps) {
  const columnSortable = useSortable({
    id: `col:${column.id}`,
    index,
    type: "column",
    accept: "column",
    group: "columns",
    data: { type: "column", columnId: column.id },
  });

  const taskDropTarget = useDroppable({
    id: column.id,
    type: "task-container",
    accept: "task",
    collisionPriority: CollisionPriority.Low,
    data: { type: "task-container", columnId: column.id },
  });

  return (
    <section
      ref={columnSortable.ref}
      className={cn(
        "flex min-h-[540px] flex-col rounded-lg border bg-card/60 shadow-xs transition-colors",
        (columnSortable.isDropTarget || taskDropTarget.isDropTarget) && "bg-muted/50 border-primary/40",
      )}
    >
      {/* Column Header */}
      <div className="flex items-start justify-between gap-2 p-3 border-b bg-muted/20 rounded-t-lg">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs text-foreground truncate tracking-tight">{column.title}</h4>
            <span className="flex size-4.5 items-center justify-center rounded-md bg-background border text-[10.5px] font-mono font-bold text-foreground">
              {tasks.length}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{column.subtitle}</p>
        </div>

        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground rounded-md">
          <Plus className="size-3" />
        </Button>
      </div>

      {/* Column Tasks Container */}
      <div
        ref={taskDropTarget.ref}
        className="flex-1 p-2.5 space-y-2.5 overflow-y-auto"
      >
        {tasks.map((task, taskIdx) => (
          <SortableClientTaskCard
            key={task.id}
            task={task}
            columnId={column.id}
            index={taskIdx}
            onClick={() => onCardClick(task)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-md text-center p-3 text-muted-foreground/60">
            <span className="text-[11px]">Étape en attente</span>
          </div>
        )}
      </div>
    </section>
  );
}

function SortableClientTaskCard({
  task,
  columnId,
  index,
  onClick,
}: {
  task: ClientKanbanTask;
  columnId: ColumnId;
  index: number;
  onClick: () => void;
}) {
  const { isDragging, ref } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: columnId,
    data: { type: "task", task, columnId },
  });

  return (
    <div ref={ref} className={cn("touch-none", isDragging && "opacity-30")}>
      <ClientTaskCard task={task} onClick={onClick} />
    </div>
  );
}

function ClientTaskCard({
  task,
  isOverlay = false,
  onClick,
}: {
  task: ClientKanbanTask;
  isOverlay?: boolean;
  onClick?: () => void;
}) {
  const completedChecklists = task.checklists.filter((c) => c.completed).length;
  const isSlaExceeded = task.daysInStage > task.slaMaxDays;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-lg border border-border/80 bg-background p-3 text-card-foreground shadow-2xs transition-all select-none hover:border-primary/50 hover:shadow-xs cursor-pointer",
        isOverlay && "w-68 rotate-1 shadow-lg border-primary/60",
      )}
    >
      {/* 1. Header Badges */}
      <div className="flex items-center justify-between gap-1.5">
        <Badge
          variant={task.priority === "High" ? "destructive" : "secondary"}
          className="h-4 px-1.5 text-[9.5px] rounded-md font-semibold gap-0.5"
        >
          {task.priority === "High" && <Flame className="size-2.5" />}
          {task.priority === "High" ? "Urgent" : task.priority === "Medium" ? "Moyen" : "Normal"}
        </Badge>

        <span
          className={cn(
            "text-[10px] font-mono font-medium flex items-center gap-0.5",
            isSlaExceeded ? "text-rose-600 font-bold" : "text-muted-foreground"
          )}
        >
          {isSlaExceeded && <AlertTriangle className="size-2.5 text-rose-500" />}
          J+{task.daysInStage}/{task.slaMaxDays}j
        </span>
      </div>

      {/* 2. Title & Description */}
      <div className="space-y-1">
        <h5 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
          {task.title}
        </h5>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* 3. Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Avancement</span>
          <span className="font-mono font-bold text-foreground">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-1 rounded-full" />
      </div>

      {/* 4. Footer: Checklists, Attachments, Officer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.checklists.length > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground font-mono">
              <CheckSquare className="size-3 text-primary/80" />
              <span>
                {completedChecklists}/{task.checklists.length}
              </span>
            </span>
          )}

          {task.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground font-mono">
              <Paperclip className="size-3 text-muted-foreground" />
              <span>{task.attachments.length}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-foreground truncate max-w-[80px]">
            {task.assignedOfficer.split(" ")[0]}
          </span>
          <Avatar className={cn("size-4 rounded-xs", task.officerTone)}>
            <AvatarFallback className="text-[7px] font-bold">
              {getInitials(task.assignedOfficer)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
