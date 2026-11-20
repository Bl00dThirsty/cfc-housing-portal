"use client";

import { LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list";

export function ViewModeToggle({
  value,
  onValueChange,
  className = "",
}: {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Mode d'affichage"
      className={`inline-flex shrink-0 items-center rounded-lg border bg-card p-0.5 ${className}`}
    >
      <Button
        type="button"
        variant={value === "grid" ? "secondary" : "ghost"}
        size="sm"
        aria-label="Vue en grille"
        aria-pressed={value === "grid"}
        title="Afficher en grille"
        onClick={() => onValueChange("grid")}
        className="h-7 gap-1 px-2 text-xs"
      >
        <LayoutGrid aria-hidden className="size-3.5" />
        <span className="sr-only sm:not-sr-only">Grille</span>
      </Button>
      <Button
        type="button"
        variant={value === "list" ? "secondary" : "ghost"}
        size="sm"
        aria-label="Vue en liste"
        aria-pressed={value === "list"}
        title="Afficher en liste"
        onClick={() => onValueChange("list")}
        className="h-7 gap-1 px-2 text-xs"
      >
        <List aria-hidden className="size-3.5" />
        <span className="sr-only sm:not-sr-only">Liste</span>
      </Button>
    </div>
  );
}
