"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  FileText,
  Flame,
  type LucideIcon,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Paperclip,
  ExternalLink,
  User,
  Archive,
  ArrowRight,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn, getInitials } from "@/lib/utils";

import { tagTones } from "./data";
import type { ColumnId, Task, TaskInsightLabel, TaskPriority } from "./types";

const taskInsightIcons: Record<TaskInsightLabel, LucideIcon> = {
  Attachments: Paperclip,
  Comments: MessageSquare,
  Documents: FileText,
};

const priorityBadgeConfig: Record<
  TaskPriority,
  { icon: LucideIcon; variant: "destructive" | "secondary"; className: string }
> = {
  High: {
    icon: Flame,
    variant: "destructive",
    className: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-500/20 font-semibold",
  },
  Low: {
    icon: Minus,
    variant: "secondary",
    className: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-500/20 font-medium",
  },
  Medium: {
    icon: ArrowUpRight,
    variant: "secondary",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/20 font-semibold",
  },
};

export function TaskCard({
  task,
  columnId,
  isOverlay = false,
  onCardClick,
}: {
  task: Task;
  columnId?: ColumnId;
  isOverlay?: boolean;
  onCardClick?: (task: Task) => void;
}) {
  const router = useRouter();
  const isDone = columnId === "closing_release";
  const owner = task.owner;
  const PriorityIcon = priorityBadgeConfig[task.priority].icon;

  const isSlaExceeded = task.daysInStage > task.slaMaxDays;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if click wasn't on an action button or dropdown
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[role='menuitem']") || target.closest("[data-prevent-click]")) {
      return;
    }
    if (onCardClick) {
      onCardClick(task);
    } else {
      router.push(`/admin/kanban/${task.id}`);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-3.5 text-card-foreground shadow-xs transition-all select-none hover:border-primary/40 hover:shadow-sm cursor-pointer",
        isOverlay && "w-72 rotate-1 shadow-lg border-primary/50",
      )}
    >
      {/* 1. Header: DUC ID, Priority Badge & 3-dots Menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="font-mono text-[10.5px] font-semibold bg-muted/50 px-1.5 py-0 h-4.5 rounded-md border-border/70 text-foreground"
          >
            {task.ducId || "DUC-04829"}
          </Badge>
          <Badge
            variant={priorityBadgeConfig[task.priority].variant}
            className={cn(
              "shrink-0 h-4.5 px-1.5 text-[10px] rounded-md gap-0.5",
              priorityBadgeConfig[task.priority].className,
            )}
          >
            <PriorityIcon className="size-2.5" />
            {task.priority === "High" ? "Urgent" : task.priority === "Medium" ? "Moyen" : "Normal"}
          </Badge>
        </div>

        <div className="flex items-center gap-1" data-prevent-click>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                aria-label="Actions du dossier"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-md">
              <DropdownMenuItem
                className="gap-2 text-xs font-medium cursor-pointer"
                onClick={() => {
                  if (onCardClick) {
                    onCardClick(task);
                  } else {
                    router.push(`/admin/kanban/${task.id}`);
                  }
                }}
              >
                <ExternalLink className="size-3.5 text-primary" />
                Détails carte (Trello)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-medium cursor-pointer"
                onClick={() => router.push(`/admin/kanban/${task.id}`)}
              >
                <FileText className="size-3.5 text-muted-foreground" />
                Fiche complète (Page dédiée)
              </DropdownMenuItem>
              {task.clientId ? (
                <DropdownMenuItem
                  className="gap-2 text-xs cursor-pointer"
                  onClick={() => router.push(`/admin/clients/${task.clientId}`)}
                >
                  <User className="size-3.5 text-muted-foreground" />
                  Voir la fiche emprunteur
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <ArrowRight className="size-3.5 text-muted-foreground" />
                Avancer à l&apos;étape suivante
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-xs text-rose-600 dark:text-rose-400 cursor-pointer">
                <Archive className="size-3.5" />
                Archiver / Mettre en attente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Client & Project Title */}
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors truncate">
          {task.clientName || task.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {task.projectTitle || task.description}
        </p>
      </div>

      {/* 3. Financial Amount & SLA Timer */}
      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 border border-border/40 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-medium">Financement</span>
          <span className="font-mono font-semibold text-foreground text-xs">{task.amount}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground font-medium">Délai étape</span>
          <span
            className={cn(
              "font-mono text-[11px] font-semibold flex items-center gap-1",
              isSlaExceeded
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground",
            )}
          >
            {isSlaExceeded ? <AlertTriangle className="size-3 text-rose-500" /> : null}
            J+{task.daysInStage} / {task.slaMaxDays}j
          </span>
        </div>
      </div>

      {/* 4. Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
          <span className="leading-none">Avancement</span>
          <span className="tabular-nums font-semibold text-foreground leading-none">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-1.5 rounded-full" />
      </div>

      <Separator />

      {/* 5. Footer: Assignee, Team badge & Insights */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className={cn("size-5 rounded-md text-[9px]", owner.tone)}>
            <AvatarFallback className="rounded-md text-[9px] font-semibold">
              {getInitials(owner.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-foreground text-[11px] font-medium max-w-[90px]">
            {owner.name}
          </span>
        </div>

        {isDone ? (
          <div className="flex items-center gap-1 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="size-3.5" />
            Clôturé
          </div>
        ) : (
          <Badge
            variant="secondary"
            className={cn("h-4.5 px-1.5 text-[9.5px] font-medium border rounded-md max-w-[100px] truncate", tagTones[task.team])}
          >
            {task.agency || task.team}
          </Badge>
        )}

        <div className="flex items-center gap-2 text-[11px]">
          {task.insights.map((insight) => {
            const Icon = taskInsightIcons[insight.label];
            return (
              <span key={insight.label} className="flex items-center gap-0.5 text-muted-foreground">
                <Icon className="size-3" />
                <span className="tabular-nums text-[10px]">{insight.count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </article>
  );
}
