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
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

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
            "h-8 border-dashed border-input text-xs font-normal gap-1.5 px-2.5 bg-background hover:bg-muted/40 transition-colors",
            selectedValues.length > 0 && "border-solid border-primary/40 bg-secondary/30",
            className
          )}
        >
          <PlusCircle className="size-3.5 text-muted-foreground shrink-0" />
          <span>{title}</span>

          {selectedValues.length > 0 && (
            <>
              <span className="h-3.5 w-px bg-border/60 mx-1 shrink-0" />
              {selectedValues.length <= 2 ? (
                <div className="flex items-center gap-1">
                  {options
                    .filter((opt) => selectedSet.has(opt.value))
                    .map((opt) => (
                      <Badge
                        key={opt.value}
                        variant="secondary"
                        className="px-1.5 py-0 h-4.5 text-[10px] font-normal rounded-sm bg-muted text-foreground"
                      >
                        {opt.label}
                      </Badge>
                    ))}
                </div>
              ) : (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 h-4.5 text-[10px] font-normal rounded-sm bg-muted text-foreground"
                >
                  {selectedValues.length} sélectionnés
                </Badge>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-xl shadow-lg border">
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
          {title}
        </DropdownMenuLabel>

        {options.length > 4 && (
          <div className="px-1.5 pb-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={`Filtrer ${title.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-7 w-full rounded-md border bg-muted/30 pl-6 pr-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}

        <div className="max-h-56 overflow-y-auto space-y-0.5 pt-0.5">
          {filteredOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
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
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "size-3.5 rounded-xs border flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 opacity-70"
                      )}
                    >
                      {isSelected && <Check className="size-2.5 stroke-[3]" />}
                    </div>

                    {opt.icon && (
                      <opt.icon className="size-3.5 text-muted-foreground shrink-0" />
                    )}

                    <span className="truncate font-medium">{opt.label}</span>
                  </div>

                  {opt.count !== undefined && (
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-1">
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
              className="justify-center text-center text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1"
            >
              Effacer les filtres
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
