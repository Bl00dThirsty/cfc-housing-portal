"use client";

import * as React from "react";

import {
  applyFilters,
  applyGrouping,
  applySearch,
  applySorts,
  buildFacets,
  cellText,
  type DataGroup,
  type DataTableState,
  type FacetDef,
} from "@/lib/data-table";
import {
  tableState,
  useDataTableStore,
} from "@/stores/data-table-store";

import type { DataColumn } from "./types";

export interface UseDataTableInput<T> {
  /** Identifiant du tableau : il isole son état dans le store. */
  tableId: string;
  columns: DataColumn<T>[];
  rows: T[];
}

export interface UseDataTableResult<T> {
  state: DataTableState;
  groups: DataGroup<T>[];
  facets: FacetDef[];
  totalCount: number;
  filteredCount: number;
  setSearch: (search: string) => void;
  toggleSort: (key: string, additive: boolean) => void;
  setFilter: (facetId: string, values: string[]) => void;
  setGroupBy: (key: string | null) => void;
  reset: () => void;
  /** La valeur d'une cellule, telle que le moteur la connaît. */
  valueOf: (row: T, key: string) => string | null;
}

/**
 * Le moteur, côté composant.
 *
 * Ce hook ne **règle** rien : il demande aux règles pures
 * (`src/lib/data-table.ts`) de trier, filtrer et grouper, et il expose les
 * actions qui modifient l'état du tableau dans le store.
 */
export function useDataTable<T>(input: UseDataTableInput<T>): UseDataTableResult<T> {
  const { tableId, columns, rows } = input;

  // ⚠️ `tableState` doit renvoyer une **référence stable** pour un tableau
  // donné : zustand 5 compare les snapshots avec `Object.is` et ne mémoïse pas
  // le sélecteur. Un sélecteur qui alloue un objet à chaque appel déclencherait
  // l'avertissement « getSnapshot should be cached » de React et une tempête
  // de rendu sur les 44 tableaux.
  const state = useDataTableStore((store) => tableState(store, tableId));
  const setSearch = useDataTableStore((store) => store.setSearch);
  const toggleSortAction = useDataTableStore((store) => store.toggleSort);
  const setFilterAction = useDataTableStore((store) => store.setFilter);
  const setGroupByAction = useDataTableStore((store) => store.setGroupBy);
  const resetAction = useDataTableStore((store) => store.reset);

  const valueOf = React.useCallback(
    (row: T, key: string): string | null => {
      const column = columns.find((candidate) => candidate.key === key);
      if (!column?.accessor) return null;
      return cellText(column.accessor(row));
    },
    [columns],
  );

  const searchValues = React.useCallback(
    (row: T): string[] =>
      columns
        .map((column) => (column.accessor ? cellText(column.accessor(row)) : ""))
        .filter(Boolean),
    [columns],
  );

  const groups = React.useMemo(() => {
    const searched = applySearch(rows, state.search, searchValues);
    const filtered = applyFilters(searched, state.filters, valueOf);
    const sorted = applySorts(filtered, state.sorts, valueOf);
    const grouped = applyGrouping(sorted, state.groupBy, valueOf);

    if (!state.groupBy) return grouped;

    // Le libellé d'un groupe peut être reformulé par sa colonne.
    const column = columns.find((candidate) => candidate.key === state.groupBy);
    if (!column?.groupLabel) return grouped;

    return grouped.map((group) => ({
      ...group,
      label: column.groupLabel?.(group.key) ?? group.label,
    }));
  }, [columns, rows, searchValues, state.filters, state.groupBy, state.search, state.sorts, valueOf]);

  const facets = React.useMemo(() => {
    const built = buildFacets(columns, rows);

    // Une colonne de date produit une valeur ISO ; l'option de facette
    // peut vouloir la date française. C'est le même point de couture que
    // pour le libellé de groupe.
    return built.map((facet) => {
      const column = columns.find((candidate) => candidate.key === facet.id);
      if (!column?.facetLabel) return facet;

      return {
        ...facet,
        options: facet.options.map((option) => ({
          ...option,
          label: column.facetLabel?.(option.value) ?? option.label,
        })),
      };
    });
  }, [columns, rows]);

  const filteredCount = React.useMemo(
    () => groups.reduce((total, group) => total + group.rows.length, 0),
    [groups],
  );

  return {
    state,
    groups,
    facets,
    totalCount: rows.length,
    filteredCount,
    setSearch: (search) => setSearch(tableId, search),
    toggleSort: (key, additive) => toggleSortAction(tableId, key, additive),
    setFilter: (facetId, values) => setFilterAction(tableId, facetId, values),
    setGroupBy: (key) => setGroupByAction(tableId, key),
    reset: () => resetAction(tableId),
    valueOf,
  };
}

export type { DataColumn };
