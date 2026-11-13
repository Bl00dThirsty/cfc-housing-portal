"use client";

import { create } from "zustand";

import {
  DEFAULT_DATA_TABLE_STATE,
  toggleSort as toggleSortRule,
  type DataTableState,
} from "@/lib/data-table";

/**
 * L'état des tableaux — **un seul** store, indexé par `tableId`.
 *
 * Chaque tableau a son propre état (recherche, tris, facettes, groupement),
 * mais cet état a **un seul propriétaire**. La disposition est celle du kit de
 * référence : un store par écran. Ici, un store par écran et par tableau
 * produirait quarante-deux propriétaires d'état ; l'indexation en donne un.
 */
export type TablesStore = {
  byTable: Record<string, DataTableState>;
  setSearch: (tableId: string, search: string) => void;
  toggleSort: (tableId: string, key: string, additive: boolean) => void;
  setFilter: (tableId: string, facetId: string, values: string[]) => void;
  setGroupBy: (tableId: string, key: string | null) => void;
  reset: (tableId: string) => void;
};

/** L'état d'un tableau ; l'état par défaut s'il n'a pas encore été touché. */
export function tableState(state: TablesStore, tableId: string): DataTableState {
  return state.byTable[tableId] ?? DEFAULT_DATA_TABLE_STATE;
}

export const useDataTableStore = create<TablesStore>((set) => ({
  byTable: {},

  setSearch: (tableId, search) =>
    set((state) => ({
      byTable: {
        ...state.byTable,
        [tableId]: { ...tableState(state, tableId), search },
      },
    })),

  toggleSort: (tableId, key, additive) =>
    set((state) => ({
      byTable: {
        ...state.byTable,
        [tableId]: {
          ...tableState(state, tableId),
          sorts: toggleSortRule(tableState(state, tableId).sorts, key, additive),
        },
      },
    })),

  setFilter: (tableId, facetId, values) =>
    set((state) => {
      const current = tableState(state, tableId);
      const others = current.filters.filter((filter) => filter.id !== facetId);

      return {
        byTable: {
          ...state.byTable,
          [tableId]: {
            ...current,
            filters: values.length === 0 ? others : [...others, { id: facetId, values }],
          },
        },
      };
    }),

  setGroupBy: (tableId, key) =>
    set((state) => ({
      byTable: {
        ...state.byTable,
        [tableId]: { ...tableState(state, tableId), groupBy: key },
      },
    })),

  reset: (tableId) =>
    set((state) => ({
      byTable: { ...state.byTable, [tableId]: { ...DEFAULT_DATA_TABLE_STATE } },
    })),
}));
