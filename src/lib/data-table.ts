/**
 * Moteur de table — les **règles**, sans React ni rendu.
 *
 * Toute la logique de manipulation des lignes vit ici : recherche, filtres à
 * facettes, tri multi-colonnes, groupement. Ce module est **pur** : il ne
 * connaît ni l'interface, ni la base, ni le store. C'est ce qui le rend
 * testable sans navigateur et réutilisable par n'importe quel tableau.
 *
 * Sémantique retenue :
 * - recherche : insensible à la casse, sur les valeurs textuelles de la ligne ;
 * - filtres : **ET** entre facettes, **OU** à l'intérieur d'une facette ;
 * - tri : multi-colonnes prioritaire, stable, valeurs nulles en fin ;
 * - groupement : **un seul niveau**.
 */

/** Une colonne triée. La première de la liste est le tri principal. */
export type SortRule = { key: string; dir: "asc" | "desc" };

/** Une facette : plusieurs valeurs acceptées pour une même colonne. */
export type FilterRule = { id: string; values: string[] };

/** L'état complet d'un tableau. */
export type DataTableState = {
  search: string;
  sorts: SortRule[];
  filters: FilterRule[];
  groupBy: string | null;
};

/** L'état par défaut : rien de saisi, rien de trié, rien de filtré. */
export const DEFAULT_DATA_TABLE_STATE: DataTableState = {
  search: "",
  sorts: [],
  filters: [],
  groupBy: null,
};

/** Une valeur proposée dans une facette. */
export type FacetOption = { label: string; value: string; count?: number };

/** Une facette : une colonne, un titre, ses valeurs. */
export type FacetDef = { id: string; title: string; options: FacetOption[] };

/** Un groupe de lignes, et son effectif. */
export type DataGroup<T> = { key: string; label: string; rows: T[] };

/** La forme textuelle d'une valeur de cellule. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** Recherche plein texte : la ligne est retenue si l'une de ses valeurs contient l'aiguille. */
export function applySearch<T>(
  rows: readonly T[],
  search: string,
  valuesOf: (row: T) => string[],
): T[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return [...rows];

  return rows.filter((row) =>
    valuesOf(row).some((value) => value.toLowerCase().includes(needle)),
  );
}

/**
 * Filtres à facettes : **ET** entre facettes, **OU** à l'intérieur d'une facette.
 *
 * Une facette sans valeur sélectionnée ne filtre rien.
 */
export function applyFilters<T>(
  rows: readonly T[],
  filters: readonly FilterRule[],
  valueOf: (row: T, facetId: string) => string | null,
): T[] {
  const active = filters.filter((filter) => filter.values.length > 0);
  if (active.length === 0) return [...rows];

  return rows.filter((row) =>
    active.every((filter) => {
      const value = valueOf(row, filter.id);
      return value !== null && filter.values.includes(value);
    }),
  );
}

/** Tri multi-colonnes prioritaire et stable. */
export function applySorts<T>(
  rows: readonly T[],
  sorts: readonly SortRule[],
  valueOf: (row: T, key: string) => unknown,
): T[] {
  if (sorts.length === 0) return [...rows];

  const decorated = rows.map((row, index) => ({ row, index }));

  decorated.sort((a, b) => {
    for (const rule of sorts) {
      const comparison = compareValues(valueOf(a.row, rule.key), valueOf(b.row, rule.key));
      if (comparison !== 0) return rule.dir === "asc" ? comparison : -comparison;
    }
    // À valeur égale, l'ordre d'origine est conservé : le tri est stable.
    return a.index - b.index;
  });

  return decorated.map((entry) => entry.row);
}

/** Compare deux valeurs de cellule : nombres d'abord, sinon locale française. */
function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;

  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === "number" && typeof b === "number") return a - b;

  return cellText(a).localeCompare(cellText(b), "fr");
}

/** Groupement simple : une clé, un groupe par valeur distincte, par ordre de libellé. */
export function applyGrouping<T>(
  rows: readonly T[],
  groupBy: string | null,
  valueOf: (row: T, key: string) => string | null,
): DataGroup<T>[] {
  if (!groupBy) return [{ key: "", label: "", rows: [...rows] }];

  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const key = cellText(valueOf(row, groupBy));
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups.entries()]
    .map(([key, groupRows]) => ({ key, label: key, rows: groupRows }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/**
 * Bascule du tri.
 *
 * - clic simple sur une colonne déjà triée : la direction s'inverse ;
 * - clic simple sur une autre colonne : elle devient le tri principal ;
 * - `shift` + clic sur une colonne déjà triée : elle est **retirée** ;
 * - `shift` + clic sur une colonne nouvelle : elle s'ajoute en secondaire.
 */
export function toggleSort(
  sorts: readonly SortRule[],
  key: string,
  additive: boolean,
): SortRule[] {
  const existing = sorts.find((sort) => sort.key === key);

  if (existing) {
    if (additive) return sorts.filter((sort) => sort.key !== key);
    return [{ key, dir: existing.dir === "asc" ? "desc" : "asc" }];
  }

  const rule: SortRule = { key, dir: "asc" };
  return additive ? [...sorts, rule] : [rule];
}

/** Les valeurs distinctes d'une colonne, par ordre alphabétique français. */
export function distinctValues<T>(
  columns: readonly {
    key: string;
    accessor?: (row: T) => unknown;
  }[],
  rows: readonly T[],
  key: string,
): string[] {
  const column = columns.find((candidate) => candidate.key === key);
  if (!column?.accessor) return [];

  const values = new Set<string>();
  for (const row of rows) {
    const value = cellText(column.accessor?.(row));
    if (value) values.add(value);
  }

  return [...values].sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Les facettes d'un tableau.
 *
 * Seules les colonnes `filterable` en produisent une. Les valeurs sont
 * calculées sur le jeu de lignes **complet** : une option ne disparaît pas
 * sous les yeux de l'agent parce qu'il vient de cocher une autre facette.
 */
export function buildFacets<T>(
  columns: readonly {
    key: string;
    label: string;
    filterable?: boolean;
    accessor?: (row: T) => unknown;
  }[],
  rows: readonly T[],
): FacetDef[] {
  return columns
    .filter((column) => column.filterable && column.accessor)
    .map((column) => ({
      id: column.key,
      title: column.label,
      options: distinctValues(columns, rows, column.key).map((value) => ({
        label: value,
        value,
      })),
    }));
}
