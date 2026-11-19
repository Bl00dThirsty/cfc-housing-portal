"use client";

import { FileText, FolderOpen, Kanban as KanbanIcon, Landmark } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "@/components/ui/tag";
import { cn, getInitials } from "@/lib/utils";
import type { ClientItem } from "@/domain/entities/client";

const STATUS_TONE: Record<string, "green" | "neutral" | "red" | "teal" | "purple" | "blue" | "orange" | "amber"> = {
  Conforme: "green",
  "En Examen": "neutral",
  "Pièces Manquantes": "red",
  Accordé: "teal",
  Mainlevée: "purple",
  Brouillon: "neutral",
  Ouvert: "blue",
  "En instruction": "blue",
  "En cours": "blue",
  Approuvé: "green",
  Rejeté: "red",
  Clôturé: "neutral",
  Suspendu: "orange",
};

export function ClientCard({
  client,
  selected,
  active,
  onToggle,
  onOpen,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: {
  client: ClientItem;
  selected: boolean;
  active: boolean;
  onToggle: (id: string) => void;
  onOpen: () => void;
  onOpenKanban: () => void;
  onOpenDuc: () => void;
  onOpenEpargne: () => void;
}) {
  const progress = Math.min(100, Math.max(0, client.completionPercent));

  return (
    <li className="min-w-0 list-none">
      <article
        data-active={active || selected}
        className={cn(
          "flex h-full flex-col gap-4 rounded-lg border bg-card p-4 shadow-xs transition-colors",
          (active || selected) && "border-primary/50 bg-muted/30",
        )}
      >
        <header className="flex min-w-0 items-start gap-3">
          <Avatar className={cn("size-10 shrink-0 rounded-md border", client.avatarTone)}>
            <AvatarFallback className="text-xs font-bold">{getInitials(client.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Button
              type="button"
              variant="link"
              onClick={onOpen}
              className="h-auto max-w-full justify-start truncate p-0 text-sm font-semibold text-foreground no-underline hover:no-underline"
            >
              {client.name}
            </Button>
            <p className="truncate font-mono text-[10px] text-muted-foreground">{client.ducId}</p>
          </div>
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(client.id)}
            aria-label={`Sélectionner ${client.name}`}
            className="mt-1 shrink-0"
          />
        </header>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="max-w-full truncate text-[10px]">{client.phase}</Badge>
          <Tag tone={STATUS_TONE[client.status] ?? "neutral"} size="sm" className="max-w-full truncate text-[10px]">
            {client.status}
          </Tag>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-y py-3 text-xs">
          <div className="col-span-2 min-w-0">
            <dt className="text-[10px] text-muted-foreground">Agence</dt>
            <dd className="truncate font-medium">{client.agency}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] text-muted-foreground">Montant sollicité</dt>
            <dd className="truncate font-semibold tabular-nums">{client.loanAmount}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] text-muted-foreground">Épargne</dt>
            <dd className="truncate font-medium tabular-nums">{client.savingsCurrent}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>Avancement du dossier</span>
            <span className="font-mono tabular-nums">{client.completionPercent}%</span>
          </div>
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`Avancement ${client.completionPercent} %`}
            className="h-1.5 overflow-hidden rounded-full bg-track"
          >
            <div className="h-full rounded-full bg-cfc-brown" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <footer className="mt-auto flex flex-wrap items-center gap-1 border-t pt-3">
          <Button type="button" size="sm" variant="outline" onClick={onOpen} className="mr-auto h-7 gap-1 text-[11px]">
            <FileText aria-hidden className="size-3.5" /> Ouvrir la fiche
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onOpenKanban} aria-label={`Kanban de ${client.name}`} title="Ouvrir le Kanban">
            <KanbanIcon aria-hidden />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onOpenDuc} aria-label={`DUC de ${client.name}`} title="Ouvrir le DUC">
            <FolderOpen aria-hidden />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onOpenEpargne} aria-label={`Épargne de ${client.name}`} title="Ouvrir le carnet d'épargne">
            <Landmark aria-hidden />
          </Button>
        </footer>
      </article>
    </li>
  );
}
