"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  FileCheck,
  FileText,
  Flame,
  Paperclip,
  Plus,
  Send,
  Tag,
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

import type { ClientItem } from "./data";

export interface KanbanChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface KanbanAttachment {
  name: string;
  size: string;
  date: string;
  kind?: string;
}

export interface KanbanActivityItem {
  id: string;
  author: string;
  authorTone: string;
  action: string;
  date: string;
  comment?: string;
}

export interface ClientKanbanTask {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  daysInStage: number;
  slaMaxDays: number;
  progress: number;
  assignedOfficer: string;
  officerTone: string;
  tags: string[];
  checklists: KanbanChecklistItem[];
  attachments: KanbanAttachment[];
  activities: KanbanActivityItem[];
}

interface KanbanCardDialogProps {
  task: ClientKanbanTask | null;
  columnTitle?: string;
  client: ClientItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate?: (updatedTask: ClientKanbanTask) => void;
  onMoveToNextStage?: (taskId: string) => void;
}

export function KanbanCardDialog({
  task,
  columnTitle = "Étape d'instruction",
  client,
  open,
  onOpenChange,
  onTaskUpdate,
  onMoveToNextStage,
}: KanbanCardDialogProps) {
  const [currentTask, setCurrentTask] = React.useState<ClientKanbanTask | null>(task);
  const [newComment, setNewComment] = React.useState("");

  React.useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  if (!currentTask) return null;

  const toggleChecklist = (checkId: string) => {
    const updatedChecklists = currentTask.checklists.map((item) =>
      item.id === checkId ? { ...item, completed: !item.completed } : item
    );
    const completedCount = updatedChecklists.filter((c) => c.completed).length;
    const progress = Math.round((completedCount / (updatedChecklists.length || 1)) * 100);

    const updated = {
      ...currentTask,
      checklists: updatedChecklists,
      progress,
    };
    setCurrentTask(updated);
    onTaskUpdate?.(updated);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const newAct: KanbanActivityItem = {
      id: `act-${Date.now()}`,
      author: "Gestionnaire Connecté",
      authorTone: "bg-blue-500/20 text-blue-800",
      action: "a ajouté un visa / note",
      date: "À l'instant",
      comment: newComment.trim(),
    };
    const updated = {
      ...currentTask,
      activities: [newAct, ...currentTask.activities],
    };
    setCurrentTask(updated);
    setNewComment("");
    onTaskUpdate?.(updated);
  };

  const completedChecklistCount = currentTask.checklists.filter((c) => c.completed).length;
  const checklistPercent = Math.round(
    (completedChecklistCount / (currentTask.checklists.length || 1)) * 100
  );
  const isSlaExceeded = currentTask.daysInStage > currentTask.slaMaxDays;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg p-0 gap-0 border bg-background shadow-xl">
        {/* 1. Header style Trello */}
        <div className="p-6 pb-4 border-b bg-muted/20 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs rounded-md bg-background font-semibold">
              {client?.ducId || "DUC-CFC-2026"}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Dans l&apos;étape <strong className="text-foreground">{columnTitle}</strong>
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-medium">
              Emprunteur: <strong className="text-foreground">{client?.name || "Client"}</strong>
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground leading-snug">
            {currentTask.title}
          </DialogTitle>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {/* Priority */}
            <Badge
              variant={currentTask.priority === "High" ? "destructive" : "secondary"}
              className="text-xs rounded-md gap-1"
            >
              {currentTask.priority === "High" && <Flame className="size-3" />}
              {currentTask.priority === "High" ? "Priorité Haute" : currentTask.priority === "Medium" ? "Priorité Moyenne" : "Priorité Normale"}
            </Badge>

            {/* SLA badge */}
            <Badge
              variant={isSlaExceeded ? "destructive" : "secondary"}
              className={cn("text-xs rounded-md gap-1 font-mono")}
            >
              {isSlaExceeded ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
              Délai: J+{currentTask.daysInStage} / {currentTask.slaMaxDays}j {isSlaExceeded && "(SLA Dépassé)"}
            </Badge>

            {/* Tags */}
            {currentTask.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs rounded-md gap-1 bg-background/50">
                <Tag className="size-2.5 text-muted-foreground" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* 2. Main Content Grid (Trello Layout: 2/3 Content + 1/3 Sidebar Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 p-6 gap-6">
          {/* LEFT COLUMN: Description, Checklist, Attachments, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="size-3.5 text-primary" />
                Description &amp; Objectifs de l&apos;Étape
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
                  Checklist d&apos;Instruction Réglementaire
                </div>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {completedChecklistCount}/{currentTask.checklists.length} ({checklistPercent}%)
                </span>
              </div>

              <Progress value={checklistPercent} className="h-1.5 rounded-full" />

              <div className="space-y-2 pt-1">
                {currentTask.checklists.map((check) => (
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
                  Pièces Jointes &amp; Justificatifs Scellés
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {currentTask.attachments.length} document(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentTask.attachments.map((att, idx) => (
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

            {/* Activity & Visas Thread */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="size-3.5 text-primary" />
                Journal des Visas &amp; Commentaires
              </div>

              {/* Add comment input */}
              <div className="flex gap-2 items-center">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Rédiger une observation ou un visa d'instruction..."
                  className="h-8 text-xs rounded-md"
                />
                <Button size="sm" className="h-8 px-3 rounded-md gap-1 text-xs" onClick={handleAddComment}>
                  <Send className="size-3" />
                  Viser
                </Button>
              </div>

              {/* Activity entries */}
              <div className="space-y-2.5 pt-1">
                {currentTask.activities.map((act) => (
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

          {/* RIGHT SIDEBAR: Responsables, Échéance, Trello Actions */}
          <div className="space-y-5 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
            {/* Responsable */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Gestionnaire Assigné
              </span>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                <Avatar className={cn("size-7 rounded-md", currentTask.officerTone)}>
                  <AvatarFallback className="text-[10px] font-bold">
                    {getInitials(currentTask.assignedOfficer)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{currentTask.assignedOfficer}</span>
                  <span className="text-[10px] text-muted-foreground">{client?.agency || "Agence CFC"}</span>
                </div>
              </div>
            </div>

            {/* Échéance */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Échéance &amp; Calendrier
              </span>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Date cible :</span>
                  <strong className="text-foreground">{currentTask.dueDate}</strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Temps passé :</span>
                  <span className={cn("font-mono font-semibold", isSlaExceeded ? "text-rose-600" : "text-foreground")}>
                    J+{currentTask.daysInStage}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Rapides Style Trello */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Actions sur la Carte
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

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-md text-xs"
                  onClick={() => {
                    const checkTitle = prompt("Nom de la vérification à ajouter à la checklist :");
                    if (checkTitle && checkTitle.trim()) {
                      const newCheck: KanbanChecklistItem = {
                        id: `chk-${Date.now()}`,
                        title: checkTitle.trim(),
                        completed: false,
                      };
                      const updated = {
                        ...currentTask,
                        checklists: [...currentTask.checklists, newCheck],
                      };
                      setCurrentTask(updated);
                      onTaskUpdate?.(updated);
                    }
                  }}
                >
                  <Plus className="size-3.5" />
                  Ajouter un contrôle
                </Button>

                <Button variant="outline" size="sm" className="w-full justify-start gap-2 rounded-md text-xs">
                  <Paperclip className="size-3.5" />
                  Joindre une pièce
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-md text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700"
                  onClick={() => onOpenChange(false)}
                >
                  <Archive className="size-3.5" />
                  Mettre en attente
                </Button>
              </div>
            </div>

            {/* Rappel Client */}
            {client && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-xs">
                <span className="font-semibold text-primary block text-[11px]">Projet Crédit Logement</span>
                <span className="text-foreground font-medium block text-xs">{client.projectType}</span>
                <span className="font-mono text-muted-foreground text-[10.5px]">Montant: {client.loanAmount}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
