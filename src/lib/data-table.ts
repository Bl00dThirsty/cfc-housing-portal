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
 * - tri : multi-colonnes prioritaire, stable, valeurs vides toujours en fin ;
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

/**
 * L'état par défaut : rien de saisi, rien de trié, rien de filtré.
 *
 * Il est **gelé**, avec les tableaux qu'il contient : c'est un singleton,
 * partagé par tous les tableaux. Une modification en place y échoue
 * bruyamment, au lieu de corrompre en silence l'état de tous les tableaux du
 * portail.
 *
 * Le gel se fait ici, par instruction : la constante garde le type
 * `DataTableState`, dont les tableaux restent mutables — c'est ce qui permet
 * d'écrire un test qui vérifie que la mutation **échoue**.
 */
export const DEFAULT_DATA_TABLE_STATE: DataTableState = {
  search: "",
  sorts: [],
  filters: [],
  groupBy: null,
};

Object.freeze(DEFAULT_DATA_TABLE_STATE.sorts);
Object.freeze(DEFAULT_DATA_TABLE_STATE.filters);
Object.freeze(DEFAULT_DATA_TABLE_STATE);

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
  if (isDate(value)) {
    const time = value.getTime();
    // Une date invalide n'a pas de forme textuelle.
    return Number.isFinite(time) ? value.toISOString() : "";
  }
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
    valuesOf(row).some((value) => cellText(value).toLowerCase().includes(needle)),
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
      const left = valueOf(a.row, rule.key);
      const right = valueOf(b.row, rule.key);

      // Les valeurs vides restent en fin de liste, quelle que soit la
      // direction : elles ne sont jamais inversées avec le reste.
      const leftEmpty = isEmptyValue(left);
      const rightEmpty = isEmptyValue(right);
      if (leftEmpty !== rightEmpty) return leftEmpty ? 1 : -1;

      const comparison = compareValues(left, right);
      if (comparison !== 0) return rule.dir === "asc" ? comparison : -comparison;
    }
    // À valeur égale, l'ordre d'origine est conservé : le tri est stable.
    return a.index - b.index;
  });

  return decorated.map((entry) => entry.row);
}

/** Compare deux valeurs de cellule : dates par horodatage, nombres, sinon locale française. */
function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;

  if (typeof a === "number" && typeof b === "number") return a - b;

  const aTime = dateTimestamp(a);
  const bTime = dateTimestamp(b);
  if (aTime !== null && bTime !== null) return aTime - bTime;

  return cellText(a).localeCompare(cellText(b), "fr");
}

/** Une date ISO : `2026-01-15` ou `2026-01-15T10:00:00.000Z`. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Vrai si la valeur est une date. */
function isDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === "[object Date]";
}

/**
 * L'horodatage d'une date ou d'une chaîne ISO ; `null` si la valeur n'en
 * est pas une.
 */
function dateTimestamp(value: unknown): number | null {
  if (isDate(value)) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === "string" && ISO_DATE.test(value)) {
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
  }
  return null;
}

/** Une valeur « vide » : rien à afficher, donc rien à comparer. */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value === "";
  if (isDate(value)) return !Number.isFinite(value.getTime());
  return false;
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
    const group = groups.get(key);
    // Le groupe est complété en place : pas de recopie à chaque ligne.
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()]
    .map(([key, groupRows]) => ({ key, label: key, rows: groupRows }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/**
 * Bascule du tri.
 *
 * - clic simple sur une colonne déjà triée : la direction s'inverse et
 *   **l'ensemble des tris est remplacé** — le tri secondaire est abandonné ;
 * - clic simple sur une autre colonne : elle devient le seul tri, le principal ;
 * - `shift` + clic sur une colonne déjà triée : elle est **retirée** du tri ;
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
