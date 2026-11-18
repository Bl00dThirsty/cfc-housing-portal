"use client";

import * as React from "react";

import { formatCfcDate } from "@/domain/entities/dates";
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
  type SortRule,
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
  /**
   * Le tri **initial** de l'écran : l'ordre d'ouverture du tableau.
   *
   * Il s'applique tant qu'aucun tri n'a été choisi — un clic sur un en-tête
   * prime dessus. C'est un tri **dérivé**, jamais stocké : il ne modifie pas
   * l'état du tableau, et le store reste le seul propriétaire du tri choisi.
   */
  initialSort?: readonly SortRule[];
}

/**
 * Aucun tri : une référence **stable**.
 *
 * Le tri effectif vaut soit le tri du store, soit le tri initial de
 * l'écran ; sans cette constante, l'absence de tri initial allouerait un
 * tableau à chaque rendu et invaliderait les mémoïsations du moteur.
 */
const NO_SORT: readonly SortRule[] = [];

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
  const { tableId, columns, rows, initialSort } = input;

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

  /**
   * La valeur **brute** d'une colonne, pour le tri.
   *
   * Le moteur sait comparer un nombre à un nombre et une date à une date :
   * lui passer la forme textuelle aplatirait « 1 000 000 » et « 900 000 »
   * en chaînes, et le tri deviendrait alphabétique — « 1000000 » avant
   * « 900000 ». Les filtres et les groupes, eux, gardent la forme textuelle :
   * leurs valeurs sont des chaînes.
   */
  const sortValueOf = React.useCallback(
    (row: T, key: string): unknown => {
      const column = columns.find((candidate) => candidate.key === key);
      return column?.accessor?.(row);
    },
    [columns],
  );

  const searchValues = React.useCallback(
    (row: T): string[] =>
      columns
        .flatMap((column) => {
          const accessor = column.accessor;
          if (!accessor) return [];

          // L'accesseur n'est appelé **qu'une fois** par valeur.
          const value = accessor(row);

          // Une date est cherchable sous **les deux formes** : l'ISO, que le
          // moteur compare, et la forme française, que l'agent voit. La saisie
          // n'est jamais normalisée : c'est la comparaison qui s'élargit.
          const values =
            value instanceof Date
              ? [cellText(value), formatCfcDate(value)]
              : [cellText(value)];

          // La colonne peut porter des valeurs **supplémentaires** : une
          // information affichée dans la ligne sans être une colonne — la
          // profession sous le nom, par exemple. Elle est cherchable comme
          // la valeur de la colonne.
          return [...values, ...(column.searchValues?.(row) ?? [])];
        })
        .filter(Boolean),
    [columns],
  );

  /**
   * Le tri effectif : celui que l'agent a choisi, sinon celui d'ouverture
   * de l'écran.
   *
   * Les trois sources sont des références **stables** — le tableau du store,
   * le tri initial de l'écran, la constante « aucun tri » — : le tri
   * effectif ne change donc pas d'identité entre deux rendus.
   */
  const sorts = state.sorts.length > 0 ? state.sorts : (initialSort ?? NO_SORT);

  const groups = React.useMemo(() => {
    const searched = applySearch(rows, state.search, searchValues);
    const filtered = applyFilters(searched, state.filters, valueOf);
    const sorted = applySorts(filtered, sorts, sortValueOf);
    const grouped = applyGrouping(sorted, state.groupBy, valueOf);

    if (!state.groupBy) return grouped;

    // Le libellé d'un groupe peut être reformulé par sa colonne.
    const column = columns.find((candidate) => candidate.key === state.groupBy);
    if (!column?.groupLabel) return grouped;

    return grouped.map((group) => ({
      ...group,
      label: column.groupLabel?.(group.key) ?? group.label,
    }));
  }, [columns, rows, searchValues, sortValueOf, sorts, state.filters, state.groupBy, state.search, valueOf]);

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

  // Les actions ont une **identité stable** : un consommateur qui les place
  // dans les dépendances d'un `useEffect` ne doit pas rejouer son effet à
  // chaque rendu.
  const setSearchFor = React.useCallback(
    (search: string) => setSearch(tableId, search),
    [setSearch, tableId],
  );
  const toggleSortFor = React.useCallback(
    (key: string, additive: boolean) => toggleSortAction(tableId, key, additive),
    [toggleSortAction, tableId],
  );
  const setFilterFor = React.useCallback(
    (facetId: string, values: string[]) => setFilterAction(tableId, facetId, values),
    [setFilterAction, tableId],
  );
  const setGroupByFor = React.useCallback(
    (key: string | null) => setGroupByAction(tableId, key),
    [setGroupByAction, tableId],
  );
  const resetFor = React.useCallback(() => resetAction(tableId), [resetAction, tableId]);

  return {
    state,
    groups,
    facets,
    totalCount: rows.length,
    filteredCount,
    setSearch: setSearchFor,
    toggleSort: toggleSortFor,
    setFilter: setFilterFor,
    setGroupBy: setGroupByFor,
    reset: resetFor,
    valueOf,
  };
}
export type { DataColumn };
