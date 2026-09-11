"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  ExternalLink,
  FileText,
  Kanban as KanbanIcon,
  List,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";

import { columnIds, columns, tagTones } from "./data";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { GlobalKanbanCardDialog } from "./global-kanban-card-dialog";
import type { BoardState, ColumnId, Task } from "./types";

interface KanbanProps {
  initialBoard: BoardState;
}

type TaskDragData = {
  type: "task";
  task: Task;
  columnId: ColumnId;
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && columnIds.includes(value as ColumnId);
}

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "task" &&
    "task" in value &&
    typeof value.task === "object" &&
    value.task !== null &&
    "columnId" in value &&
    isColumnId(value.columnId)
  );
}

export function Kanban({ initialBoard }: KanbanProps) {
  const router = useRouter();
  const [board, setBoard] = React.useState<BoardState>(initialBoard);
  const [columnOrder, setColumnOrder] = React.useState<ColumnId[]>(columnIds);
  const [viewMode, setViewMode] = React.useState<"board" | "list" | "table">("board");
  const [search, setSearch] = React.useState("");
  const [selectedAgency, setSelectedAgency] = React.useState<string>("all");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("all");
  const [slaAlertOnly, setSlaAlertOnly] = React.useState<boolean>(false);
  const [selectedModalTask, setSelectedModalTask] = React.useState<Task | null>(null);

  const boardBeforeDrag = React.useRef<BoardState>(initialBoard);
  const orderedColumns = columnOrder.flatMap((columnId) => columns.find((column) => column.id === columnId) ?? []);

  // Filter tasks function
  const filterTask = (task: Task) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      task.clientName?.toLowerCase().includes(query) ||
      task.ducId?.toLowerCase().includes(query) ||
      task.projectTitle?.toLowerCase().includes(query) ||
      task.title?.toLowerCase().includes(query) ||
      task.agency?.toLowerCase().includes(query) ||
      task.owner.name.toLowerCase().includes(query);

    const matchesAgency =
      selectedAgency === "all" ||
      task.agency === selectedAgency ||
      task.team === selectedAgency;

    const matchesPriority =
      selectedPriority === "all" || task.priority === selectedPriority;

    const matchesSla = !slaAlertOnly || task.daysInStage > task.slaMaxDays;

    return matchesSearch && matchesAgency && matchesPriority && matchesSla;
  };

  // Aggregated pipeline metrics
  const allTasks = Object.values(board).flat();
  const totalTasks = allTasks.length;
  const totalVolume = allTasks.reduce((acc, t) => acc + (t.amountRaw || 0), 0);
  const totalVolumeFormatted = (totalVolume / 1000000).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });
  const slaExceededCount = allTasks.filter((t) => t.daysInStage > t.slaMaxDays).length;
  const avgProgress = Math.round(
    allTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / (totalTasks || 1)
  );

  const selectedModalColumnId = React.useMemo(() => {
    if (!selectedModalTask) return undefined;
    for (const [colId, tasks] of Object.entries(board)) {
      if (tasks.some((t) => t.id === selectedModalTask.id)) {
        return colId as ColumnId;
      }
    }
    return undefined;
  }, [board, selectedModalTask]);

  const handleTaskUpdate = (updatedTask: Task) => {
    setBoard((curr) => {
      const next: BoardState = { ...curr };
      for (const colId of Object.keys(next) as ColumnId[]) {
        next[colId] = next[colId].map((t) => (t.id === updatedTask.id ? updatedTask : t));
      }
      return next;
    });
    setSelectedModalTask(updatedTask);
  };

  const handleMoveToNextStage = (taskId: string) => {
    let sourceCol: ColumnId | null = null;
    let targetTask: Task | null = null;

    for (const colId of columnIds) {
      const found = board[colId].find((t) => t.id === taskId);
      if (found) {
        sourceCol = colId;
        targetTask = found;
        break;
      }
    }

    if (!sourceCol || !targetTask) return;

    const currentIdx = columnIds.indexOf(sourceCol);
    if (currentIdx < columnIds.length - 1) {
      const nextCol = columnIds[currentIdx + 1];
      setBoard((curr) => ({
        ...curr,
        [sourceCol!]: curr[sourceCol!].filter((t) => t.id !== taskId),
        [nextCol]: [
          {
            ...targetTask!,
            daysInStage: 0,
            progress: Math.min(100, Math.round(((currentIdx + 2) / columnIds.length) * 100)),
          },
          ...curr[nextCol],
        ],
      }));
      setSelectedModalTask(null);
    }
  };

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

    if (event.canceled) {
      if (source.type === "task") {
        setBoard(boardBeforeDrag.current);
      }
      return;
    }

    if (source.type === "column") {
      setColumnOrder((currentOrder) => move(currentOrder, event));
    }
  }

  return (
    <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      {/* 1. Header Controls Strip */}
      <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 lg:px-6">
        {/* Top bar: Tabs + Search + Actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={viewMode}
            onValueChange={(val) => setViewMode(val as "board" | "list" | "table")}
            className="min-w-0"
          >
            <TabsList className="w-full *:data-[slot=tabs-trigger]:flex-1 sm:w-fit sm:*:data-[slot=tabs-trigger]:flex-none">
              <TabsTrigger value="board" className="gap-2">
                <KanbanIcon className="size-4" />
                Tableau Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="size-4" />
                Vue Liste
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <Table2 className="size-4" />
                Vue Grille / Tableau
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:justify-end">
            <InputGroup className="min-w-0 sm:w-64 2xl:w-64">
              <InputGroupInput
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher emprunteur, DUC..."
              />
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-auto gap-2 rounded-md",
                    (selectedAgency !== "all" || selectedPriority !== "all" || slaAlertOnly) &&
                      "border-primary text-primary",
                  )}
                >
                  <SlidersHorizontal className="size-3.5" />
                  Filtrer
                  {(selectedAgency !== "all" || selectedPriority !== "all" || slaAlertOnly) && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-md">
                <DropdownMenuLabel className="text-xs">Agence régionale</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedAgency === "all"}
                  onCheckedChange={() => setSelectedAgency("all")}
                >
                  Toutes les agences
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedAgency === "Agence Yaoundé"}
                  onCheckedChange={() => setSelectedAgency("Agence Yaoundé")}
                >
                  Agence Yaoundé
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedAgency === "Agence Douala"}
                  onCheckedChange={() => setSelectedAgency("Agence Douala")}
                >
                  Agence Douala
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Priorité</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedPriority === "all"}
                  onCheckedChange={() => setSelectedPriority("all")}
                >
                  Toutes priorités
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPriority === "High"}
                  onCheckedChange={() => setSelectedPriority("High")}
                >
                  Haute priorité (Urgent)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedPriority === "Medium"}
                  onCheckedChange={() => setSelectedPriority("Medium")}
                >
                  Moyenne priorité
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={slaAlertOnly}
                  onCheckedChange={(checked) => setSlaAlertOnly(Boolean(checked))}
                  className="text-rose-600 dark:text-rose-400"
                >
                  <AlertTriangle className="size-3.5 mr-1" />
                  SLA dépassé uniquement
                </DropdownMenuCheckboxItem>

                {(selectedAgency !== "all" || selectedPriority !== "all" || slaAlertOnly) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedAgency("all");
                        setSelectedPriority("all");
                        setSlaAlertOnly(false);
                      }}
                      className="text-xs font-medium justify-center"
                    >
                      Réinitialiser les filtres
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 rounded-md"
              onClick={() => {
                setBoard((curr) => {
                  const sorted: BoardState = { ...curr };
                  for (const key of Object.keys(sorted) as ColumnId[]) {
                    sorted[key] = [...sorted[key]].sort((a, b) => (b.amountRaw || 0) - (a.amountRaw || 0));
                  }
                  return sorted;
                });
              }}
            >
              <ArrowUpDown className="size-3.5" />
              Trier montant
            </Button>

            <ButtonGroup className="w-full sm:w-fit">
              <Button className="flex-1 sm:flex-none rounded-md gap-1.5">
                <Plus className="size-4" />
                Nouveau Dossier DUC
              </Button>
              <ButtonGroupSeparator />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Menu options" size="icon" className="rounded-md">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-md">
                  <DropdownMenuItem onClick={() => router.push("/admin/clients")}>
                    <User className="size-4 mr-2" />
                    Répertoire Emprunteurs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/admin/analytics")}>
                    <Table2 className="size-4 mr-2" />
                    Vue Analytique DUC
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </div>

        {/* 2. Top Pipeline KPI Strip (Crisp rounded-lg, zero decorative filler icons) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-lg border bg-card/60 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Dossiers en Pipeline</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-foreground">{totalTasks}</span>
              <span className="text-[10.5px] text-muted-foreground">6 étapes actives</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card/60 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Volume Global sous Mandat</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-foreground">{totalVolumeFormatted}M</span>
              <span className="text-[10.5px] font-semibold text-purple-600">FCFA</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card/60 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Alerte SLA Dépassé</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                {slaExceededCount}
              </span>
              <span className="text-[10.5px] text-rose-600 font-medium">Instruction &gt; 15j</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card/60 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Avancement Global Moyen</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {avgProgress}%
              </span>
              <span className="text-[10.5px] text-muted-foreground">Cycle de crédit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main View Renderers */}
      {viewMode === "board" && (
        <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/20 px-4 pt-3.5 pb-2 [scrollbar-color:var(--border)_transparent] lg:px-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
            <div className="inline-grid h-full min-w-full grid-cols-[repeat(6,minmax(21rem,1fr))] gap-3.5">
              {orderedColumns.map((column, index) => {
                const columnTasks = board[column.id].filter(filterTask);
                return (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    index={index}
                    tasks={columnTasks}
                    onCardClick={(task) => setSelectedModalTask(task)}
                  />
                );
              })}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {(source) => {
              if (source.type !== "task" || !isTaskDragData(source.data)) {
                return null;
              }

              const columnId =
                isSortable(source) && isColumnId(source.group) ? source.group : source.data.columnId;

              return <TaskCard task={source.data.task} columnId={columnId} isOverlay />;
            }}
          </DragOverlay>
        </DragDropProvider>
      )}

      {viewMode === "list" && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 lg:px-6 bg-muted/15 space-y-5">
          {orderedColumns.map((column) => {
            const columnTasks = board[column.id].filter(filterTask);
            if (columnTasks.length === 0) return null;
            const colVol = (columnTasks.reduce((s, t) => s + (t.amountRaw || 0), 0) / 1000000).toFixed(1);

            return (
              <div key={column.id} className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="font-mono text-xs rounded-md">
                      {columnTasks.length} {columnTasks.length > 1 ? "dossiers" : "dossier"}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Sous-total: <strong className="text-foreground">{colVol}M FCFA</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {columnTasks.map((task) => {
                    const isSlaExceeded = task.daysInStage > task.slaMaxDays;
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedModalTask(task)}
                        className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer"
                      >
                        {/* Left: Info */}
                        <div className="space-y-1 min-w-[240px]">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs font-bold rounded-md">
                              {task.ducId}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] rounded-md font-medium",
                                tagTones[task.team]
                              )}
                            >
                              {task.agency || task.team}
                            </Badge>
                            {isSlaExceeded && (
                              <Badge variant="destructive" className="text-[10px] rounded-md gap-1">
                                <AlertTriangle className="size-2.5" /> SLA Dépassé
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {task.clientName || task.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.projectTitle || task.description}
                          </p>
                        </div>

                        {/* Middle: Financial & Progress */}
                        <div className="flex flex-wrap items-center gap-6 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10.5px] text-muted-foreground">Financement sollicité</span>
                            <div className="font-mono font-bold text-foreground text-sm">
                              {task.amount}
                            </div>
                            <span className="text-[10.5px] text-muted-foreground">
                              Apport: {task.equityContribution || "20%"}
                            </span>
                          </div>

                          <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Progression</span>
                              <span className="font-semibold text-foreground">{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1.5 rounded-full" />
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Délai étape</span>
                              <span className={isSlaExceeded ? "text-rose-600 font-bold" : ""}>
                                J+{task.daysInStage} / {task.slaMaxDays}j
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Avatar className={cn("size-6 rounded-md", task.owner.tone)}>
                              <AvatarFallback className="text-[10px] font-bold">
                                {getInitials(task.owner.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">{task.owner.name}</span>
                              <span className="text-[10px] text-muted-foreground">Gestionnaire</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div
                          className="flex items-center gap-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 rounded-md text-xs font-medium"
                            onClick={() => setSelectedModalTask(task)}
                          >
                            <ExternalLink className="size-3.5" />
                            Détails Trello
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 rounded-md">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-md">
                              <DropdownMenuItem onClick={() => setSelectedModalTask(task)}>
                                Ouvrir les détails (Trello)
                              </DropdownMenuItem>
                              {task.clientId && (
                                <DropdownMenuItem onClick={() => router.push(`/admin/clients?selected=${task.clientId}&tab=duc`)}>
                                  <FileText className="size-3.5 mr-2" />
                                  Dossier DUC du client
                                </DropdownMenuItem>
                              )}
                              {task.clientId && (
                                <DropdownMenuItem onClick={() => router.push(`/admin/clients?selected=${task.clientId}`)}>
                                  <User className="size-3.5 mr-2" />
                                  Fiche Emprunteur
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleMoveToNextStage(task.id)}>
                                <ArrowRight className="size-3.5 mr-2" />
                                Avancer à l&apos;étape suivante
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-rose-600">
                                Archiver le dossier
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "table" && (
        <div className="flex-1 min-h-0 overflow-auto px-4 py-3 lg:px-6 bg-background">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-28 text-xs font-semibold">N° DUC</TableHead>
                  <TableHead className="text-xs font-semibold">Emprunteur &amp; Projet</TableHead>
                  <TableHead className="w-36 text-xs font-semibold">Montant Prêt</TableHead>
                  <TableHead className="w-44 text-xs font-semibold">Phase Actuelle</TableHead>
                  <TableHead className="w-32 text-xs font-semibold">Avancement</TableHead>
                  <TableHead className="w-32 text-xs font-semibold">Délai SLA</TableHead>
                  <TableHead className="w-44 text-xs font-semibold">Responsable</TableHead>
                  <TableHead className="w-16 text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTasks.filter(filterTask).map((task) => {
                  const currentColumn = columns.find((c) =>
                    board[c.id]?.some((t) => t.id === task.id)
                  );
                  const isSlaExceeded = task.daysInStage > task.slaMaxDays;

                  return (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setSelectedModalTask(task)}
                    >
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        <Badge variant="outline" className="font-mono text-xs rounded-md">
                          {task.ducId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground hover:text-primary transition-colors">
                            {task.clientName || task.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1">
                            {task.projectTitle || task.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {task.amount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] rounded-md font-medium", tagTones[task.team])}
                        >
                          {currentColumn?.title || task.team}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="h-1.5 w-14 rounded-full" />
                          <span className="text-xs font-mono font-medium text-foreground">
                            {task.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-mono text-xs",
                            isSlaExceeded
                              ? "text-rose-600 dark:text-rose-400 font-bold"
                              : "text-muted-foreground"
                          )}
                        >
                          {isSlaExceeded && <AlertTriangle className="size-3 text-rose-500" />}
                          J+{task.daysInStage} / {task.slaMaxDays}j
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className={cn("size-5 rounded-md", task.owner.tone)}>
                            <AvatarFallback className="text-[9px] font-semibold">
                              {getInitials(task.owner.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">{task.owner.name}</span>
                            <span className="text-[10px] text-muted-foreground">{task.agency}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 rounded-md">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-md">
                            <DropdownMenuItem onClick={() => setSelectedModalTask(task)}>
                              <ExternalLink className="size-3.5 mr-2" />
                              Ouvrir détails (Trello)
                            </DropdownMenuItem>
                            {task.clientId && (
                              <DropdownMenuItem onClick={() => router.push(`/admin/clients?selected=${task.clientId}&tab=duc`)}>
                                <FileText className="size-3.5 mr-2" />
                                Dossier DUC du client
                              </DropdownMenuItem>
                            )}
                            {task.clientId && (
                              <DropdownMenuItem onClick={() => router.push(`/admin/clients?selected=${task.clientId}`)}>
                                <User className="size-3.5 mr-2" />
                                Fiche Emprunteur
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleMoveToNextStage(task.id)}>
                              <ArrowRight className="size-3.5 mr-2" />
                              Avancer étape
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600">
                              Archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Global Trello Modal Dialog */}
      <GlobalKanbanCardDialog
        task={selectedModalTask}
        columnId={selectedModalColumnId}
        open={Boolean(selectedModalTask)}
        onOpenChange={(open) => {
          if (!open) setSelectedModalTask(null);
        }}
        onTaskUpdate={handleTaskUpdate}
        onMoveToNextStage={handleMoveToNextStage}
      />
    </div>
  );
}
