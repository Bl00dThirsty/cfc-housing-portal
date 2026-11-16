"use client";

import * as React from "react";
import { Check, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FacetOption } from "@/lib/data-table";
import { cn } from "@/lib/utils";

/**
 * Une option de facette : la valeur du module pur, plus l'icône d'affichage.
 *
 * Le module pur ne connaît pas React : l'icône est donc ajoutée ici, et
 * nulle part ailleurs.
 */
export type FilterOption = FacetOption & {
  icon?: React.ComponentType<{ className?: string }>;
};

export interface DataTableFacetedFilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  className?: string;
}

export function DataTableFacetedFilter({
  title,
  options,
  selectedValues,
  onSelect,
  className,
}: DataTableFacetedFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!query.trim()) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onSelect(selectedValues.filter((v) => v !== val));
    } else {
      onSelect([...selectedValues, val]);
    }
  };

  const clearFilter = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelect([]);
  };

  const selectedSet = new Set(selectedValues);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 border-dashed border-line-strong bg-secondary px-2.5 text-[12px] font-normal hover:bg-muted",
            selectedValues.length > 0 && "border-solid border-primary/40 bg-muted/40",
            className
          )}
        >
          <PlusCircle className="size-3.5 shrink-0 text-subtle" />
          <span>{title}</span>

          {selectedValues.length > 0 && (
            <>
              <span className="mx-1 h-3.5 w-px shrink-0 bg-line-strong" />
              {selectedValues.length <= 2 ? (
                <div className="flex items-center gap-1">
                  {options
                    .filter((opt) => selectedSet.has(opt.value))
                    .map((opt) => (
                      <Badge
                        key={opt.value}
                        variant="secondary"
                        className="h-4.5 rounded-sm bg-muted px-1.5 py-0 text-[10px] font-normal text-foreground"
                      >
                        {opt.label}
                      </Badge>
                    ))}
                </div>
              ) : (
                <Badge
                  variant="secondary"
                  className="h-4.5 rounded-sm bg-muted px-1.5 py-0 text-[10px] font-normal text-foreground"
                >
                  {selectedValues.length} sélectionnés
                </Badge>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 p-1.5">
        <DropdownMenuLabel className="caption-style uppercase tracking-wider text-subtle">
          {title}
        </DropdownMenuLabel>

        {options.length > 4 && (
          <div className="px-1.5 pb-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder={`Filtrer ${title.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-7 w-full rounded-md border border-line-strong bg-secondary pl-6 pr-2 text-[12px] text-foreground outline-none transition-[border-color] duration-150 placeholder:text-subtle focus-visible:border-ring"
              />
            </div>
          </div>
        )}

        <div className="max-h-56 space-y-0.5 overflow-y-auto pt-0.5">
          {filteredOptions.length === 0 ? (
            <div className="py-3 text-center text-[12px] text-subtle">
              Aucun résultat
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedSet.has(opt.value);
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleOption(opt.value);
                  }}
                  className="cursor-pointer justify-between gap-2 px-2 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-xs border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-subtle/40 opacity-70"
                      )}
                    >
                      {isSelected && <Check className="size-2.5 stroke-[3]" />}
                    </div>

                    {opt.icon && (
                      <opt.icon className="size-3.5 shrink-0 text-subtle" />
                    )}

                    <span className="truncate font-medium">{opt.label}</span>
                  </div>

                  {opt.count !== undefined && (
                    <span className="ml-1 shrink-0 font-mono text-[10px] text-subtle">
                      {opt.count}
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {selectedValues.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onSelect={() => clearFilter()}
              className="cursor-pointer justify-center py-1 text-center text-[12px] font-medium text-subtle hover:text-foreground"
            >
              Effacer les filtres
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
