"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";

/** Une date française saisie en entier dans la recherche : `JJ/MM/AAAA`. */
const FRENCH_DATE_QUERY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Traduit une date française en forme ISO.
 *
 * Le moteur normalise une `Date` en ISO : la recherche porte donc sur
 * « 2026-01-15 ». Un agent qui tape « 15/01/2026 » — la forme **affichée**
 * par le tableau — ne trouverait rien. La barre d'outils rétablit
 * l'équivalence : une requête qui est exactement une date française devient
 * sa forme ISO.
 *
 * Le moteur, lui, reste pur et inchangé : c'est la requête qui est traduite,
 * pas la valeur.
 */
function toIsoDateQuery(query: string): string {
  const match = FRENCH_DATE_QUERY.exec(query.trim());
  if (!match) return query;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/**
 * Le compte, accordé en nombre : « 1 ligne », « 2 lignes ».
 *
 * L'unité est donnée au pluriel par l'écran ; le singulier s'en déduit.
 */
function unitFor(count: number, unitName: string): string {
  if (count > 1 || !unitName.endsWith("s")) return unitName;
  return unitName.slice(0, -1);
}

/**
 * Barre d'outils du tableau — **canonique**.
 *
 * Elle porte la recherche, les facettes, le regroupement, les pastilles de
 * tri et l'export. Elle lit l'état dans le store : la table et sa barre
 * d'outils sont donc toujours d'accord, sans prop drilling ni duplication
 * d'état.
 */
export interface DataTableToolbarProps<T> {
  /** Identifiant du tableau : il isole son état dans le store. */
  tableId: string;
  /**
   * Les colonnes.
   *
   * Le tableau **doit** avoir une identité stable : une constante de module ou
   * un `useMemo`. Écrit en ligne dans le JSX, il invalide toutes les
   * mémoïsations du moteur à chaque rendu.
   */
  columns: DataColumn<T>[];
  rows: T[];
  /** Nom de l'unité, pour le compte : « 12 emprunteurs ». */
  unitName?: string;
  /** Export CSV : le bouton n'apparaît que si l'écran le propose. */
  onExport?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<T>({
  tableId,
  columns,
  rows,
  unitName = "lignes",
  onExport,
  children,
  className,
}: DataTableToolbarProps<T>) {
  const {
    state,
    facets,
    totalCount,
    filteredCount,
    setSearch,
    setFilter,
    setGroupBy,
    reset,
  } = useDataTable({ tableId, columns, rows });

  // La requête **telle que l'agent l'a écrite** : elle reste affichée, même
  // quand le store porte sa forme normalisée (« 15/01/2026 » → « 2026-01-15 »).
  const [query, setQuery] = React.useState(state.search);
  // Ce que la barre a poussé dans le store : la distingue d'un changement
  // venu d'ailleurs — une réinitialisation, par exemple.
  const pushedQuery = React.useRef(state.search);

  // Le store fait foi : quand il change ailleurs, le champ le suit.
  React.useEffect(() => {
    if (state.search === pushedQuery.current) return;
    pushedQuery.current = state.search;
    setQuery(state.search);
  }, [state.search]);

  const groupableColumns = columns.filter(
    (column) => column.groupable && column.accessor,
  );

  const hasActiveFilters =
    state.filters.some((filter) => filter.values.length > 0) ||
    Boolean(state.search.trim()) ||
    state.sorts.length > 0 ||
    state.groupBy !== null;

  const handleSearchChange = (value: string) => {
    setQuery(value);
    const normalized = toIsoDateQuery(value);
    pushedQuery.current = normalized;
    setSearch(normalized);
  };

  const handleClearSearch = () => {
    setQuery("");
    pushedQuery.current = "";
    setSearch("");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64 md:w-72">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Rechercher"
            placeholder="Rechercher…"
            value={query}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-8 pl-8 pr-7 text-[12px]"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-xs text-subtle hover:text-foreground"
            >
              <X className="size-3" aria-hidden />
            </button>
          ) : null}
        </div>

        {facets.map((facet) => (
          <DataTableFacetedFilter
            key={facet.id}
            title={facet.title}
            options={facet.options}
            selectedValues={
              state.filters.find((filter) => filter.id === facet.id)?.values ?? []
            }
            onSelect={(values) => setFilter(facet.id, values)}
          />
        ))}

        {groupableColumns.length > 0 ? (
          <Select
            value={state.groupBy ?? "__none__"}
            onValueChange={(value) => setGroupBy(value === "__none__" ? null : value)}
          >
            <SelectTrigger
              aria-label="Regrouper par"
              className="h-8 w-[150px] gap-1.5 rounded-lg border-dashed px-2.5 text-[12px] font-normal"
            >
              <span className="text-subtle">Regrouper par</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucun regroupement</SelectItem>
              {groupableColumns.map((column) => (
                <SelectItem key={column.key} value={column.key}>
                  {column.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {state.sorts.length > 0 ? (
          <span className="flex items-center gap-1 text-[11px] text-subtle">
            Tri :
            {state.sorts.map((sort) => (
              <span
                key={sort.key}
                className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10.5px] text-foreground"
              >
                {columns.find((column) => column.key === sort.key)?.label ?? sort.key}
                {sort.dir === "asc" ? " ↑" : " ↓"}
              </span>
            ))}
          </span>
        ) : null}

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 gap-1.5 px-2.5 text-[12px] text-subtle hover:text-foreground"
          >
            <span>Réinitialiser</span>
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
        <span className="caption-style whitespace-nowrap font-mono text-subtle">
          {filteredCount} {unitFor(filteredCount, unitName)}
          {filteredCount !== totalCount ? (
            <span className="text-subtle/60"> / {totalCount}</span>
          ) : null}
        </span>

        {onExport ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-8 gap-1.5 text-[12px]"
          >
            Exporter
          </Button>
        ) : null}

        {children}
      </div>
    </div>
  );
}

export default DataTableToolbar;
