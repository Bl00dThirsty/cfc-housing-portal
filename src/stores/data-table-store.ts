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
 * produirait quarante-quatre propriétaires d'état ; l'indexation en donne un.
 */
export type TablesStore = {
  byTable: Record<string, DataTableState>;
  setSearch: (tableId: string, search: string) => void;
  toggleSort: (tableId: string, key: string, additive: boolean) => void;
  setFilter: (tableId: string, facetId: string, values: string[]) => void;
  setGroupBy: (tableId: string, key: string | null) => void;
  reset: (tableId: string) => void;
};

/**
 * Un état neuf : chaque tableau possède **ses** tableaux.
 *
 * L'état par défaut est un singleton partagé : sans cette copie, une
 * modification en place sur un tableau corromprait tous les autres — sans
 * exception ni rendu, donc sans aucun signal.
 */
function freshState(): DataTableState {
  return { search: "", sorts: [], filters: [], groupBy: null };
}

/** L'état de base d'un tableau, avec des tableaux qui lui appartiennent. */
function ownState(state: TablesStore, tableId: string): DataTableState {
  const current = state.byTable[tableId];
  if (!current) return freshState();
  return {
    ...current,
    sorts: [...current.sorts],
    filters: current.filters.map((filter) => ({ ...filter, values: [...filter.values] })),
  };
}

/**
 * L'état d'un tableau ; l'état par défaut s'il n'a pas encore été touché.
 *
 * La référence est **stable** pour un tableau donné : c'est un sélecteur, il
 * ne doit rien allouer à chaque appel, sinon React signale « getSnapshot
 * should be cached » et le rendu déraille.
 */
export function tableState(state: TablesStore, tableId: string): DataTableState {
  return state.byTable[tableId] ?? DEFAULT_DATA_TABLE_STATE;
}

export const useDataTableStore = create<TablesStore>((set) => ({
  byTable: {},

  setSearch: (tableId, search) =>
    set((state) => ({
      byTable: {
        ...state.byTable,
        [tableId]: { ...ownState(state, tableId), search },
      },
    })),

  toggleSort: (tableId, key, additive) =>
    set((state) => {
      const current = ownState(state, tableId);

      return {
        byTable: {
          ...state.byTable,
          [tableId]: { ...current, sorts: toggleSortRule(current.sorts, key, additive) },
        },
      };
    }),

  setFilter: (tableId, facetId, values) =>
    set((state) => {
      const current = ownState(state, tableId);
      const others = current.filters.filter((filter) => filter.id !== facetId);

      return {
        byTable: {
          ...state.byTable,
          [tableId]: {
            ...current,
            filters:
              values.length === 0
                ? others
                : [...others, { id: facetId, values: [...values] }],
          },
        },
      };
    }),

  setGroupBy: (tableId, key) =>
    set((state) => ({
      byTable: {
        ...state.byTable,
        [tableId]: { ...ownState(state, tableId), groupBy: key },
      },
    })),

  reset: (tableId) =>
    set((state) => ({
      byTable: { ...state.byTable, [tableId]: freshState() },
    })),
}));
