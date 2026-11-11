"use client";

import {
  FileText,
  FolderOpen,
  Kanban as KanbanIcon,
  Landmark,
  MoreHorizontal,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { cn, getInitials } from "@/lib/utils";

import {
  CLIENT_TABLE_CELL_CLASS,
  CLIENT_TABLE_ROW_CLASS,
  clientColumnClass,
} from "./table-columns";
import type { ClientItem } from "@/domain/entities/client";

const STATUS_TONE: Record<ClientItem["status"], "green" | "neutral" | "red" | "teal" | "purple"> = {
  Conforme: "green",
  "En Examen": "neutral",
  "Pièces Manquantes": "red",
  Accordé: "teal",
  Mainlevée: "purple",
};

type ClientRowProps = {
  client: ClientItem;
  selected: boolean;
  active: boolean;
  onToggle: (id: string) => void;
  onOpen: (client: ClientItem) => void;
  onOpenKanban: (client: ClientItem) => void;
  onOpenDuc: (client: ClientItem) => void;
  onOpenEpargne: (client: ClientItem) => void;
};

export function ClientRow({
  client,
  selected,
  active,
  onToggle,
  onOpen,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientRowProps) {
  return (
    <TableRow
      role="row"
      data-active={active || selected}
      className={cn(
        CLIENT_TABLE_ROW_CLASS,
        "cursor-pointer",
        active && "bg-muted/60",
      )}
      onClick={() => onOpen(client)}
    >
      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "gap-2", clientColumnClass("name"))}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(client.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Sélectionner ${client.name}`}
          className="shrink-0"
        />
        <Avatar className={cn("size-7 shrink-0 rounded-md", client.avatarTone)}>
          <AvatarFallback className="text-[10px] font-bold">
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(client);
          }}
          className="flex min-w-0 flex-col items-start truncate text-left"
        >
          <span className="truncate text-xs font-medium text-foreground">
            {client.name}
          </span>
          <span className="truncate font-mono text-[10px] text-soft">
            {client.ducId}
          </span>
        </button>
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "text-xs text-muted-foreground", clientColumnClass("agency"))}
      >
        {client.agency}
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, clientColumnClass("phase"))}
      >
        <Tag tone="blue" size="sm">
          {client.phase}
        </Tag>
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, clientColumnClass("status"))}
      >
        <Tag tone={STATUS_TONE[client.status]} size="sm">
          {client.status}
        </Tag>
      </TableCell>

      <TableCell
        role="cell"
        className={cn(
          CLIENT_TABLE_CELL_CLASS,
          "text-xs font-medium text-foreground",
          clientColumnClass("loanAmount"),
        )}
      >
        {client.loanAmount}
      </TableCell>

      <TableCell
        role="cell"
        className={cn(
          CLIENT_TABLE_CELL_CLASS,
          "text-xs text-muted-foreground",
          clientColumnClass("savingsCurrent"),
        )}
      >
        {client.savingsCurrent}
      </TableCell>

      <TableCell
        role="cell"
        className={cn(
          CLIENT_TABLE_CELL_CLASS,
          "gap-2",
          clientColumnClass("completionPercent"),
        )}
      >
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={client.completionPercent}
          aria-label={`Avancement ${client.completionPercent} %`}
          className="h-1.5 w-16 overflow-hidden rounded-full bg-track"
        >
          <div
            className="h-full rounded-full bg-cfc-brown"
            style={{ width: `${client.completionPercent}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {client.completionPercent}%
        </span>
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "justify-center", clientColumnClass("action"))}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7"
              onClick={(event) => event.stopPropagation()}
              aria-label={`Actions pour ${client.name}`}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onOpen(client)}>
              <FileText className="size-3.5" />
              Ouvrir la fiche
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onOpenKanban(client)}>
              <KanbanIcon className="size-3.5" />
              Tableau Kanban
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenDuc(client)}>
              <FolderOpen className="size-3.5" />
              Dossier Unique (DUC)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenEpargne(client)}>
              <Landmark className="size-3.5" />
              Carnet d&apos;épargne
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
