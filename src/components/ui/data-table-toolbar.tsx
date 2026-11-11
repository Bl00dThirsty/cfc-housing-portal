"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTableFacetedFilter,
  type FilterOption,
} from "./data-table-faceted-filter";
import { cn } from "@/lib/utils";

export interface FacetedFilterDef {
  id: string;
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
}

export interface DataTableToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FacetedFilterDef[];
  onResetAll?: () => void;
  totalCount?: number;
  filteredCount?: number;
  unitName?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  filters = [],
  onResetAll,
  totalCount,
  filteredCount,
  unitName = "éléments",
  children,
  className,
}: DataTableToolbarProps) {
  const hasActiveFilters =
    filters.some((f) => f.selectedValues.length > 0) || Boolean(searchQuery.trim());

  const handleReset = () => {
    onSearchChange("");
    filters.forEach((f) => f.onSelect([]));
    onResetAll?.();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search input with search icon & clear button */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 pr-7 text-[12px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-xs text-subtle hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Faceted Filters */}
        {filters.map((filter) => (
          <DataTableFacetedFilter
            key={filter.id}
            title={filter.title}
            options={filter.options}
            selectedValues={filter.selectedValues}
            onSelect={filter.onSelect}
          />
        ))}

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 px-2.5 text-[12px] text-subtle hover:text-foreground"
          >
            <span>Réinitialiser</span>
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Right side: Count Badge & Actions */}
      <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
        {filteredCount !== undefined && (
          <span className="caption-style whitespace-nowrap font-mono text-subtle">
            {filteredCount} {unitName}
            {totalCount !== undefined && filteredCount !== totalCount && (
              <span className="text-subtle/60"> / {totalCount}</span>
            )}
          </span>
        )}

        {children}
      </div>
    </div>
  );
}
