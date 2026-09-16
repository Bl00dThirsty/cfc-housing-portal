"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Flame,
  Paperclip,
  Plus,
  Send,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn, getInitials } from "@/lib/utils";

import { columns } from "./data";
import type { Task, ColumnId } from "./types";

interface GlobalKanbanCardDialogProps {
  task: Task | null;
  columnId?: ColumnId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate?: (task: Task) => void;
  onMoveToNextStage?: (taskId: string) => void;
}

export function GlobalKanbanCardDialog({
  task,
  columnId,
  open,
  onOpenChange,
  onTaskUpdate,
  onMoveToNextStage,
}: GlobalKanbanCardDialogProps) {
  const router = useRouter();
  const [currentTask, setCurrentTask] = React.useState<Task | null>(task);
  const [newComment, setNewComment] = React.useState("");

  // Local checklist state for the Trello card
  const [checklists, setChecklists] = React.useState<
    { id: string; title: string; completed: boolean }[]
  >([
    { id: "c1", title: "Contrôle des pièces d'état civil & CNI certifiée", completed: true },
    { id: "c2", title: "Vérification apport personnel (Carthago)", completed: true },
    { id: "c3", title: "Rapport d'expertise technique BET contradictoire", completed: false },
    { id: "c4", title: "Validation ratio d'endettement BEAC (< 33%)", completed: false },
  ]);

  // Local activities state
  const [activities, setActivities] = React.useState<
    { id: string; author: string; authorTone: string; action: string; date: string; comment?: string }[]
  >([
    {
      id: "a1",
      author: task?.owner.name || "Gestionnaire",
      authorTone: task?.owner.tone || "bg-blue-500/20 text-blue-800",
      action: "a instruit le dossier et vérifié la complétude",
      date: "Aujourd'hui, 10:15",
      comment: "Dossier conforme aux critères d'octroi de prêt du Crédit Foncier.",
    },
    {
      id: "a2",
      author: "Guichet Agence",
      authorTone: "bg-slate-500/20 text-slate-800",
      action: "a enregistré les pièces numérisées GED",
      date: "Hier, 16:30",
    },
  ]);

  React.useEffect(() => {
    setCurrentTask(task);
    if (task) {
      setActivities([
        {
          id: "a1",
          author: task.owner.name,
          authorTone: task.owner.tone,
          action: "a instruit le dossier et vérifié la complétude",
          date: "Aujourd'hui, 10:15",
          comment: "Dossier conforme aux critères d'octroi de prêt du Crédit Foncier.",
        },
        {
          id: "a2",
          author: "Guichet Agence",
          authorTone: "bg-slate-500/20 text-slate-800",
          action: "a enregistré les pièces numérisées GED",
          date: "Hier, 16:30",
        },
      ]);
    }
  }, [task]);

  if (!currentTask) return null;

  const currentColumn = columns.find((c) => c.id === columnId) || columns[0];
  const isSlaExceeded = currentTask.daysInStage > currentTask.slaMaxDays;

  const toggleChecklist = (checkId: string) => {
    const updated = checklists.map((item) =>
      item.id === checkId ? { ...item, completed: !item.completed } : item
    );
    setChecklists(updated);
    const completedCount = updated.filter((i) => i.completed).length;
    const progress = Math.round((completedCount / updated.length) * 100);
    const updatedTask = { ...currentTask, progress };
    setCurrentTask(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const newAct = {
      id: `act-${Date.now()}`,
      author: "Gestionnaire Actif",
      authorTone: "bg-blue-500/20 text-blue-800",
      action: "a ajouté une observation",
      date: "À l'instant",
      comment: newComment.trim(),
    };
    setActivities([newAct, ...activities]);
    setNewComment("");
  };

  const completedChecklistCount = checklists.filter((c) => c.completed).length;
  const checklistPercent = Math.round(
    (completedChecklistCount / (checklists.length || 1)) * 100
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg p-0 gap-0 border bg-background shadow-xl">
        {/* 1. Header Trello */}
        <div className="p-6 pb-4 border-b bg-muted/20 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs rounded-md bg-background font-semibold">
              {currentTask.ducId}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Dans la colonne <strong className="text-foreground">{currentColumn.title}</strong>
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-medium">
              Emprunteur: <strong className="text-foreground">{currentTask.clientName}</strong>
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground leading-snug">
            {currentTask.projectTitle || currentTask.title}
          </DialogTitle>

          <div className="flex items-center gap-2.5 pt-1 flex-wrap">
            <Badge
              variant={currentTask.priority === "High" ? "destructive" : "secondary"}
              className="text-xs rounded-md gap-1"
            >
              {currentTask.priority === "High" && <Flame className="size-3" />}
              {currentTask.priority === "High" ? "Priorité Haute" : currentTask.priority === "Medium" ? "Priorité Moyenne" : "Priorité Normale"}
            </Badge>

            <Badge
              variant={isSlaExceeded ? "destructive" : "secondary"}
              className={cn("text-xs rounded-md gap-1 font-mono")}
            >
              {isSlaExceeded ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
              Délai: J+{currentTask.daysInStage} / {currentTask.slaMaxDays}j {isSlaExceeded && "(SLA Dépassé)"}
            </Badge>

            <Badge variant="outline" className="text-xs rounded-md gap-1 bg-background/50 font-mono font-semibold">
              Montant: {currentTask.amount}
            </Badge>
          </div>
        </div>

        {/* 2. Main Content Grid (Trello Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 p-6 gap-6">
          {/* LEFT: Description, Checklists, Attachments, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="size-3.5 text-primary" />
                Description du Dossier &amp; Opération
              </div>
              <div className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3.5 rounded-lg border border-border/60">
                {currentTask.description}
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CheckSquare className="size-3.5 text-primary" />
                  Contrôles d&apos;Instruction Réglementaire
                </div>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {completedChecklistCount}/{checklists.length} ({checklistPercent}%)
                </span>
              </div>

              <Progress value={checklistPercent} className="h-1.5 rounded-full" />

              <div className="space-y-2 pt-1">
                {checklists.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => toggleChecklist(check.id)}
                    className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50"
                  >
                    <Checkbox
                      checked={check.completed}
                      onCheckedChange={() => toggleChecklist(check.id)}
                      className="mt-0.5 rounded-xs"
                    />
                    <span
                      className={cn(
                        "text-xs leading-relaxed transition-all select-none",
                        check.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
                      )}
                    >
                      {check.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments / Pièces jointes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Paperclip className="size-3.5 text-primary" />
                  Pièces Jointes &amp; Documents Scellés
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {currentTask.insights.find((i) => i.label === "Attachments")?.count || 4} document(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: `Attestation_Pret_${currentTask.ducId}.pdf`, size: "2.1 MB", date: "15/08/2026" },
                  { name: `Titre_Foncier_${(currentTask.landTitle || "Mfoundi").replace(/\s+/g, "_")}.pdf`, size: "4.8 MB", date: "18/08/2026" },
                ].map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="size-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-foreground truncate block text-xs">
                          {att.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {att.size} · {att.date}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-md">
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Comments & Activities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="size-3.5 text-primary" />
                Journal des Visas &amp; Commentaires
              </div>

              <div className="flex gap-2 items-center">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Ajouter une observation ou un visa d'instruction..."
                  className="h-8 text-xs rounded-md"
                />
                <Button size="sm" className="h-8 px-3 rounded-md gap-1 text-xs" onClick={handleAddComment}>
                  <Send className="size-3" />
                  Viser
                </Button>
              </div>

              <div className="space-y-2.5 pt-1">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-2.5 text-xs bg-muted/20 p-2.5 rounded-md border border-border/40">
                    <Avatar className={cn("size-6 rounded-md", act.authorTone)}>
                      <AvatarFallback className="text-[9px] font-bold">
                        {getInitials(act.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-xs">{act.author}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{act.date}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{act.action}</p>
                      {act.comment && (
                        <div className="mt-1 bg-background p-2 rounded-md border text-xs text-foreground/90 italic">
                          &laquo; {act.comment} &raquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Trello Side Rail */}
          <div className="space-y-5 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
            {/* Responsable */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Gestionnaire Assigné
              </span>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                <Avatar className={cn("size-7 rounded-md", currentTask.owner.tone)}>
                  <AvatarFallback className="text-[10px] font-bold">
                    {getInitials(currentTask.owner.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{currentTask.owner.name}</span>
                  <span className="text-[10px] text-muted-foreground">{currentTask.agency}</span>
                </div>
              </div>
            </div>

            {/* Échéance */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Échéance &amp; Délais
              </span>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Date limite :</span>
                  <strong className="text-foreground">{currentTask.dueDate}</strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Jours en phase :</span>
                  <span className={cn("font-mono font-semibold", isSlaExceeded ? "text-rose-600" : "text-foreground")}>
                    J+{currentTask.daysInStage} / {currentTask.slaMaxDays}j
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Rapides */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Actions Rapides
              </span>
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  className="w-full justify-start gap-2 rounded-md text-xs font-semibold"
                  onClick={() => {
                    onMoveToNextStage?.(currentTask.id);
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle2 className="size-3.5" />
                  Valider &amp; Étape Suivante
                </Button>

                {currentTask.clientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 rounded-md text-xs"
                    onClick={() => router.push(`/admin/clients/${currentTask.clientId}`)}
                  >
                    <User className="size-3.5" />
                    Fiche Emprunteur
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-md text-xs"
                  onClick={() => router.push(`/admin/clients?tab=duc&clientId=${currentTask.clientId || "cl-1"}`)}
                >
                  <ExternalLink className="size-3.5" />
                  Ouvrir Dossier Unique Client (DUC)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-md text-xs"
                  onClick={() => {
                    const checkTitle = prompt("Ajouter un contrôle à la checklist :");
                    if (checkTitle && checkTitle.trim()) {
                      setChecklists([
                        ...checklists,
                        { id: `chk-${Date.now()}`, title: checkTitle.trim(), completed: false },
                      ]);
                    }
                  }}
                >
                  <Plus className="size-3.5" />
                  Ajouter un contrôle
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-md text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  onClick={() => onOpenChange(false)}
                >
                  <Archive className="size-3.5" />
                  Mettre en attente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
