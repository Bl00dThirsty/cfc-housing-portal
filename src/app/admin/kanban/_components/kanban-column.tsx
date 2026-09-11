"use client";

import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, MoreVertical, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SortableTaskCard } from "./sortable-task-card";
import type { Column, Task } from "./types";

interface KanbanColumnProps {
  column: Column;
  index: number;
  tasks: Task[];
  onCardClick?: (task: Task) => void;
}

export function KanbanColumn({ column, index, tasks, onCardClick }: KanbanColumnProps) {
  const columnSortable = useSortable({
    id: `column:${column.id}`,
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

  const totalVolumeMillion = (
    tasks.reduce((sum, t) => sum + (t.amountRaw || 0), 0) / 1000000
  ).toFixed(1);

  return (
    <section
      ref={columnSortable.ref}
      className={cn(
        "flex min-h-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        (columnSortable.isDropTarget || taskDropTarget.isDropTarget) && "bg-muted/60",
        columnSortable.isDragging && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2 px-3 pt-3.5 pb-2.5 border-b border-border/50">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <Button
              ref={columnSortable.handleRef}
              variant="ghost"
              size="icon-xs"
              className="-ml-1.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Glisser la colonne ${column.title}`}
            >
              <GripVertical className="size-3.5" />
            </Button>
            <h2 className="truncate font-semibold text-xs text-foreground tracking-tight">{column.title}</h2>
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-md bg-background border px-1 text-[10.5px] font-semibold text-foreground tabular-nums shadow-2xs">
              {tasks.length}
            </span>
          </div>
          <div className="pl-4 text-[10.5px] text-muted-foreground font-mono">
            Encours: <span className="font-semibold text-foreground/90">{totalVolumeMillion}M</span> FCFA
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-muted-foreground">
          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground rounded-md" aria-label={`Ajouter dossier à ${column.title}`}>
            <Plus className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground rounded-md" aria-label={`Actions colonne ${column.title}`}>
            <MoreVertical className="size-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={taskDropTarget.ref}
        className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
      >
        {tasks.map((task, taskIndex) => (
          <SortableTaskCard
            key={task.id}
            task={task}
            columnId={column.id}
            index={taskIndex}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </section>
  );
}
