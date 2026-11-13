# Moteur de table partagé — Plan d'implémentation

> **Pour les agents d'implémentation :** SOUS-SKILL REQUIS : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**Objectif :** un moteur de table unique — tri multi-colonnes, filtres à facettes, groupement simple — qui pilote les 44 tableaux de la console et supprime les barres d'outils sur mesure.

**Architecture :** les règles de manipulation des lignes sont des **fonctions pures** (`src/lib/data-table.ts`), testables sans React. L'état vit dans **un seul** store zustand indexé par `tableId` (`src/stores/data-table-store.ts`). Le composant `DataTable` (`src/components/data-table/`) ne fait que rendre ; il ne connaît aucune règle métier.

**Pile technique :** Next.js 15.5 · React 19 · TypeScript strict · Tailwind v4 · zustand 5 · Radix UI · Vitest + @testing-library/react

## Contraintes globales

- `src/domain/**` ne peut importer ni `react`, ni `next`, ni `@supabase/*`, ni `@/components/**`, ni `@/server/**`. Les règles pures du moteur vivent donc dans `src/lib/`, pas dans `src/domain/`.
- `src/components/**` ne peut importer ni `@supabase/*` ni `@/server/**` — sauf `@/server/actions/**`.
- **Tout le texte visible par l'utilisateur est en français** — y compris les dates : une `Date` s'affiche par `formatCfcDate`, jamais par `String(date)`, qui produirait un texte anglais en heure locale.
- **Le tableau `columns` doit avoir une identité stable** — une constante de module ou un `useMemo`. Écrit en ligne dans le JSX, il invalide toutes les mémoïsations du moteur à chaque rendu.
- Charte CFC : brun (`--cfc-brown`) et or (`--cfc-gold`), pas la violet du kit de référence.
- Un seul exemplaire par concept : un second store de tri, une seconde barre d'outils ou un second filtre est **supprimé**, jamais ajouté en parallèle.
- Les commandes de validation, depuis `C:/Users/DTA_WorkStation/Documents/cfc-housing-portal` :
  - `npm run typecheck` (doit sortir en 0)
  - `npm run lint` (doit sortir en 0 — **0 erreur, 0 avertissement**)
  - `npm test`
  - `npm run build` (ne doit **pas** tourner en même temps que le serveur de développement : `.next` est partagé)
  - `node scripts/smoke.mjs`
- Le build et le serveur de développement ne tournent jamais en parallèle.

---

## Carte des fichiers

| Fichier | Rôle | Statut |
|---|---|---|
| `src/lib/data-table.ts` | Règles pures : recherche, filtres, tris, groupement, facettes | créé |
| `src/lib/data-table.test.ts` | Tests des règles pures | créé |
| `src/stores/data-table-store.ts` | État unique, indexé par `tableId` | créé |
| `src/stores/data-table-store.test.ts` | Tests du store | créé |
| `src/components/data-table/types.ts` | Contrat `DataColumn<T>` | créé |
| `src/components/data-table/use-data-table.ts` | Hook d'orchestration | créé |
| `src/components/data-table/data-table.tsx` | Rendu : en-têtes triables, groupes | créé |
| `src/components/data-table/data-table.test.tsx` | Tests du composant | créé |
| `src/components/ui/data-table-toolbar.tsx` | Barre d'outils canonique (réécrite) | modifié |
| `src/components/ui/data-table-faceted-filter.tsx` | Primitive de facette (adaptée) | modifié |
| `src/stores/clients-store.ts` | Store de tri du répertoire — **supprimé** | supprimé |
| `src/lib/clients-filters.ts` | Filtres du répertoire — **supprimé** | supprimé |
| `src/components/clients/toolbar/clients-toolbar.tsx` | Barre d'outils du répertoire — **supprimé** | supprimé |
| `src/components/_common/filter-menu.tsx` | Menu de filtre — **supprimé** | supprimé |
| `src/components/clients/table/clients-table.tsx` | Tableau du répertoire | modifié |
| `src/components/clients/table/table-columns.ts` | Colonnes du répertoire | modifié |
| 40 fichiers d'écrans | Tableaux à migrer | modifiés |

---

## Tâche 1 — Les règles pures du moteur

**Fichiers :**
- Créer : `src/lib/data-table.ts`
- Créer : `src/lib/data-table.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit (utilisé par toutes les tâches suivantes) :
  - `type SortRule = { key: string; dir: "asc" | "desc" }`
  - `type FilterRule = { id: string; values: string[] }`
  - `type DataTableState = { search: string; sorts: SortRule[]; filters: FilterRule[]; groupBy: string | null }`
  - `const DEFAULT_DATA_TABLE_STATE: DataTableState`
  - `type FacetOption = { label: string; value: string; count?: number }`
  - `type FacetDef = { id: string; title: string; options: FacetOption[] }`
  - `type DataGroup<T> = { key: string; label: string; rows: T[] }`
  - `cellText(value: unknown): string`
  - `applySearch<T>(rows: readonly T[], search: string, valuesOf: (row: T) => string[]): T[]`
  - `applyFilters<T>(rows: readonly T[], filters: readonly FilterRule[], valueOf: (row: T, facetId: string) => string | null): T[]`
  - `applySorts<T>(rows: readonly T[], sorts: readonly SortRule[], valueOf: (row: T, key: string) => unknown): T[]`
  - `applyGrouping<T>(rows: readonly T[], groupBy: string | null, valueOf: (row: T, key: string) => string | null): DataGroup<T>[]`
  - `toggleSort(sorts: readonly SortRule[], key: string, additive: boolean): SortRule[]`
  - `buildFacets<T>(columns: readonly { key: string; label: string; filterable?: boolean; accessor?: (row: T) => unknown }[], rows: readonly T[]): FacetDef[]`
  - `distinctValues<T>(columns, rows, key): string[]`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/lib/data-table.test.ts` :

```ts
import { describe, expect, it } from "vitest";

import {
  applyFilters,
  applyGrouping,
  applySearch,
  applySorts,
  buildFacets,
  toggleSort,
} from "@/lib/data-table";

type Row = { name: string; phase: string; amount: number | null };

const ROWS: Row[] = [
  { name: "ÉBAH", phase: "kyc_savings", amount: 1200 },
  { name: "FOTSO", phase: "kyc_savings", amount: 3400 },
  { name: "NGUEMA", phase: "committees", amount: null },
  { name: "ABENA", phase: "committees", amount: 800 },
];

const valueOf = (row: Row, key: string): string | null => {
  if (key === "name") return row.name;
  if (key === "phase") return row.phase;
  return null;
};

describe("moteur de table — règles pures", () => {
  it("cherche sans tenir compte de la casse", () => {
    const found = applySearch(ROWS, "éba", (row) => [row.name, row.phase]);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("ÉBAH");
  });

  it("ignore une recherche vide", () => {
    expect(applySearch(ROWS, "   ", (row) => [row.name])).toHaveLength(4);
  });

  it("combine les facettes en ET, et les valeurs d'une facette en OU", () => {
    const filtered = applyFilters(
      ROWS,
      [
        { id: "phase", values: ["kyc_savings", "committees"] },
        { id: "name", values: ["ÉBAH"] },
      ],
      valueOf,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("ÉBAH");
  });

  it("trie sur plusieurs colonnes, par ordre de priorité", () => {
    const sorted = applySorts(
      ROWS,
      [
        { key: "phase", dir: "asc" },
        { key: "name", dir: "desc" },
      ],
      (row, key) => (key === "phase" ? row.phase : row.name),
    );
    expect(sorted.map((row) => row.name)).toEqual(["NGUEMA", "ABENA", "FOTSO", "ÉBAH"]);
  });

  it("place les valeurs nulles en fin de liste", () => {
    const sorted = applySorts(ROWS, [{ key: "amount", dir: "asc" }], (row) => row.amount);
    expect(sorted[sorted.length - 1].name).toBe("NGUEMA");
  });

  it("conserve l'ordre d'origine à valeur égale", () => {
    const sorted = applySorts(ROWS, [{ key: "phase", dir: "asc" }], (row) => row.phase);
    expect(sorted.map((row) => row.name)).toEqual(["NGUEMA", "ABENA", "ÉBAH", "FOTSO"]);
  });

  it("bascule la direction au clic et retire la colonne au shift+clic", () => {
    let sorts = toggleSort([], "phase", false);
    expect(sorts).toEqual([{ key: "phase", dir: "asc" }]);

    sorts = toggleSort(sorts, "phase", false);
    expect(sorts).toEqual([{ key: "phase", dir: "desc" }]);

    sorts = toggleSort(sorts, "name", true);
    expect(sorts).toEqual([
      { key: "phase", dir: "desc" },
      { key: "name", dir: "asc" },
    ]);

    sorts = toggleSort(sorts, "phase", true);
    expect(sorts).toEqual([{ key: "name", dir: "asc" }]);
  });

  it("regroupe par une seule clé", () => {
    const groups = applyGrouping(ROWS, "phase", valueOf);
    expect(groups).toHaveLength(2);
    expect(groups[0].rows).toHaveLength(2);
    expect(groups.map((group) => group.label)).toEqual(["committees", "kyc_savings"]);
  });

  it("ne regroupe pas sans clé", () => {
    const groups = applyGrouping(ROWS, null, valueOf);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows).toHaveLength(4);
  });

  it("construit les facettes à partir des colonnes filtrables", () => {
    const facets = buildFacets(
      [
        { key: "name", label: "Emprunteur" },
        { key: "phase", label: "Phase", filterable: true, accessor: (row: Row) => row.phase },
      ],
      ROWS,
    );
    expect(facets).toHaveLength(1);
    expect(facets[0].id).toBe("phase");
    expect(facets[0].options.map((option) => option.value)).toEqual([
      "committees",
      "kyc_savings",
    ]);
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/lib/data-table.test.ts
```
Attendu : échec, `Cannot find module '@/lib/data-table'`.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/lib/data-table.ts` :

```ts
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
``````

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/lib/data-table.test.ts
```
Attendu : **10 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/lib/data-table.ts src/lib/data-table.test.ts
git commit -m "feat(data-table): les règles pures du moteur de table

Recherche, filtres à facettes, tri multi-colonnes et groupement — sans
React, sans rendu, donc testables sans navigateur."
```

---

## Tâche 2 — L'état unique des tableaux

**Fichiers :**
- Créer : `src/stores/data-table-store.ts`
- Créer : `src/stores/data-table-store.test.ts`

**Interfaces :**
- Consomme : `DataTableState`, `DEFAULT_DATA_TABLE_STATE`, `toggleSort`, `SortRule` de `src/lib/data-table.ts`.
- Produit :
  - `useDataTableStore` — store zustand, état `byTable: Record<string, DataTableState>`.
  - `setSearch(tableId: string, search: string): void`
  - `toggleSort(tableId: string, key: string, additive: boolean): void`
  - `setFilter(tableId: string, facetId: string, values: string[]): void`
  - `setGroupBy(tableId: string, key: string | null): void`
  - `reset(tableId: string): void`
  - `tableState(state: TablesStore, tableId: string): DataTableState` — sélecteur utilitaire exporté.

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/stores/data-table-store.test.ts` :

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { useDataTableStore } from "@/stores/data-table-store";

const TABLE = "clients";

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("store des tableaux — un état par tableau", () => {
  it("démarre vide pour un tableau inconnu", () => {
    const state = useDataTableStore.getState();
    expect(state.byTable[TABLE]).toBeUndefined();
  });

  it("n'écrit que dans le tableau visé", () => {
    const store = useDataTableStore.getState();
    store.setSearch(TABLE, "eba");
    store.setSearch("kanban", "zola");

    expect(useDataTableStore.getState().byTable[TABLE]?.search).toBe("eba");
    expect(useDataTableStore.getState().byTable.kanban?.search).toBe("zola");
  });

  it("empile les tris dans l'ordre de priorité", () => {
    const store = useDataTableStore.getState();
    store.toggleSort(TABLE, "phase", false);
    store.toggleSort(TABLE, "name", true);

    expect(useDataTableStore.getState().byTable[TABLE]?.sorts).toEqual([
      { key: "phase", dir: "asc" },
      { key: "name", dir: "asc" },
    ]);
  });

  it("remplace les filtres d'une facette", () => {
    const store = useDataTableStore.getState();
    store.setFilter(TABLE, "phase", ["kyc_savings"]);
    store.setFilter(TABLE, "phase", ["committees"]);

    expect(useDataTableStore.getState().byTable[TABLE]?.filters).toEqual([
      { id: "phase", values: ["committees"] },
    ]);
  });

  it("remet un tableau à zéro sans toucher aux autres", () => {
    const store = useDataTableStore.getState();
    store.setSearch(TABLE, "eba");
    store.setSearch("kanban", "zola");
    store.reset(TABLE);

    expect(useDataTableStore.getState().byTable[TABLE]?.search).toBe("");
    expect(useDataTableStore.getState().byTable.kanban?.search).toBe("zola");
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/stores/data-table-store.test.ts
```
Attendu : échec, `Cannot find module '@/stores/data-table-store'`.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/stores/data-table-store.ts` :

```ts
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
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/stores/data-table-store.test.ts
```
Attendu : **5 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/stores/data-table-store.ts src/stores/data-table-store.test.ts
git commit -m "feat(data-table): un état unique pour tous les tableaux

Un store zustand indexé par tableId : recherche, tris, facettes et
groupement ont un seul propriétaire, au lieu d'un par écran."
```

---

## Tâche 3 — Le contrat de colonne, le helper de date et le hook d'orchestration

**Fichiers :**
- Créer : `src/components/data-table/types.ts`
- Créer : `src/components/data-table/use-data-table.ts`
- Créer : `src/components/data-table/use-data-table.test.tsx`
- Créer : `src/domain/entities/dates.ts`
- Créer : `src/domain/entities/dates.test.ts`

**Interfaces :**
- Consomme : `src/lib/data-table.ts`, `src/stores/data-table-store.ts`.
- Produit :
  - `type DataColumn<T>` — `{ key; label; accessor?; render?; sortable?; filterable?; groupable?; align?; headerClassName?; cellClassName?; groupLabel?; facetLabel? }`
  - `useDataTable<T>(input: { tableId: string; columns: DataColumn<T>[]; rows: T[] }): UseDataTableResult<T>`
  - `type UseDataTableResult<T> = { state: DataTableState; groups: DataGroup<T>[]; facets: FacetDef[]; totalCount: number; filteredCount: number; setSearch; toggleSort; setFilter; setGroupBy; reset; valueOf }`
  - `parseCfcDate(value: string): Date | null` — une date française `JJ/MM/AAAA` devient une `Date` ; `null` si la date est illisible.
  - `formatCfcDate(value: Date): string` — l'inverse : `JJ/MM/AAAA`.

> **Pourquoi un helper de date dans le domaine.** Le moteur sait trier une
> `Date` et une chaîne ISO ; il ne devine pas un format. Or les données de
> la plateforme sont écrites en français (`15/01/2026`) : une telle chaîne se
> trierait **alphabétiquement**, donc dans le désordre chronologique. Le
> domaine possède donc **un seul** lieu où une date est lue, et une colonne de
> date fait `accessor: (row) => parseCfcDate(row.date)`.
>
> La `Date` produite est à **minuit UTC** : deux dates de jours différents
> ne peuvent pas se chevaucher, quelle que soit l'heure locale du poste.

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/components/data-table/use-data-table.test.tsx` :

```tsx
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useDataTable, type DataColumn } from "@/components/data-table/use-data-table";
import { useDataTableStore } from "@/stores/data-table-store";

type Row = { id: string; name: string; phase: string };

const COLUMNS: DataColumn<Row>[] = [
  { key: "name", label: "Emprunteur", accessor: (row) => row.name, filterable: true, groupable: true },
  { key: "phase", label: "Phase", accessor: (row) => row.phase, filterable: true, groupable: true },
];

const ROWS: Row[] = [
  { id: "1", name: "ÉBAH", phase: "kyc_savings" },
  { id: "2", name: "FOTSO", phase: "kyc_savings" },
  { id: "3", name: "NGUEMA", phase: "committees" },
];

beforeEach(() => {
  // Le store est global : chaque test repart de zéro.
  useDataTableStore.setState({ byTable: {} });
});

describe("useDataTable", () => {
  it("renvoie toutes les lignes quand rien n'est saisi", () => {
    const { result } = renderHook(() =>
      useDataTable({ tableId: "t1", columns: COLUMNS, rows: ROWS }),
    );

    expect(result.current.totalCount).toBe(3);
    expect(result.current.filteredCount).toBe(3);
    expect(result.current.groups).toHaveLength(1);
  });

  it("filtre sur la recherche", () => {
    const { result } = renderHook(() =>
      useDataTable({ tableId: "t1", columns: COLUMNS, rows: ROWS }),
    );

    act(() => result.current.setSearch("ngu"));

    expect(result.current.filteredCount).toBe(1);
    expect(result.current.groups[0].rows[0].name).toBe("NGUEMA");
  });

  it("groupe par la colonne choisie", () => {
    const { result } = renderHook(() =>
      useDataTable({ tableId: "t1", columns: COLUMNS, rows: ROWS }),
    );

    act(() => result.current.setGroupBy("phase"));

    expect(result.current.groups.map((group) => group.label)).toEqual([
      "committees",
      "kyc_savings",
    ]);
    expect(result.current.groups[1].rows).toHaveLength(2);
  });

  it("construit les facettes depuis les colonnes filtrables", () => {
    const { result } = renderHook(() =>
      useDataTable({ tableId: "t1", columns: COLUMNS, rows: ROWS }),
    );

    expect(result.current.facets.map((facet) => facet.id)).toEqual(["name", "phase"]);
  });

  it("applique le libellé de groupe de la colonne", () => {
    const columns: DataColumn<Row>[] = [
      {
        key: "phase",
        label: "Phase",
        accessor: (row) => row.phase,
        groupable: true,
        groupLabel: (value) => `Phase ${value}`,
      },
    ];

    const { result } = renderHook(() =>
      useDataTable({ tableId: "t2", columns, rows: ROWS }),
    );

    act(() => result.current.setGroupBy("phase"));

    expect(result.current.groups.map((group) => group.label)).toEqual([
      "Phase committees",
      "Phase kyc_savings",
    ]);
  });

  it("applique le libellé de facette de la colonne", () => {
    const columns: DataColumn<Row>[] = [
      {
        key: "phase",
        label: "Phase",
        accessor: (row) => row.phase,
        filterable: true,
        facetLabel: (value) => value.toUpperCase(),
      },
    ];

    const { result } = renderHook(() =>
      useDataTable({ tableId: "t3", columns, rows: ROWS }),
    );

    const facet = result.current.facets[0];
    expect(facet.options.map((option) => option.label)).toEqual([
      "COMMITTEES",
      "KYC_SAVINGS",
    ]);
    // La **valeur** reste celle qui sert au filtre : seul le libellé change.
    expect(facet.options.map((option) => option.value)).toEqual([
      "committees",
      "kyc_savings",
    ]);
  });
});
```

> L'import du store est **statique** (`import { useDataTableStore } from
> "@/stores/data-table-store"`) : un `require(...)` dans un module ESM
> échouerait à l'exécution sous Vitest.

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/components/data-table/use-data-table.test.tsx
```
Attendu : échec, `Cannot find module '@/components/data-table/use-data-table'`.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/components/data-table/types.ts` :

```ts
import type * as React from "react";

/**
 * Le contrat d'une colonne.
 *
 * L'`accessor` porte la **valeur** de la cellule — celle qu'on cherche, qu'on
 * trie et qu'on groupe. Le `render` porte le **noeud** affiché. Les deux sont
 * distincts : un montant se trie par sa valeur numérique mais s'affiche
 * formaté.
 */
export interface DataColumn<T> {
  /** Identifiant stable de la colonne ; il qualifie le tri, la facette et le groupe. */
  key: string;
  /** Libellé affiché dans l'en-tête. */
  label: string;
  /**
   * Valeur de la cellule. Sans elle, la colonne n'est ni triable ni filtrable.
   *
   * Une **date** est une `Date` : c'est le moteur qui sait la trier
   * chronologiquement. Une date française en texte brut se trierait
   * alphabétiquement — donc dans le désordre.
   */
  accessor?: (row: T) => string | number | boolean | Date | null | undefined;
  /** Rendu de la cellule ; par défaut la valeur de l'`accessor`. */
  render?: (row: T) => React.ReactNode;
  /** Exclusion explicite du tri (colonne d'icônes). */
  sortable?: boolean;
  /** La colonne alimente une facette de filtre. */
  filterable?: boolean;
  /** La colonne peut servir de clé de groupement. */
  groupable?: boolean;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
  /** Libellé du groupe quand la colonne sert de clé de groupement. */
  groupLabel?: (value: string) => string;
  /**
   * Libellé de l'option de facette.
   *
   * Une colonne de date produit une valeur ISO ; l'affichage peut vouloir la
   * date française. Le libellé du groupe et celui de la facette sont donc
   * deux points de couture distincts.
   */
  facetLabel?: (value: string) => string;
}
```

Créer `src/domain/entities/dates.ts` :

```ts
/**
 * Les dates de la plateforme.
 *
 * Les données CFC sont écrites en français : `15/01/2026`. Une telle chaîne
 * se trie **alphabétiquement**, donc dans le désordre chronologique — c'est
 * le piège. Ce module est le **seul** lieu où une date **française** est lue.
 *
 * La `Date` produite est à **minuit UTC** : deux dates de jours différents ne
 * peuvent pas se chevaucher, quelle que soit l'heure locale du poste.
 */

const FRENCH_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Lit une date française `JJ/MM/AAAA`.
 *
 * Renvoie `null` si la date est absente ou illisible : une date illisible
 * n'est pas une date, et se masquerait sinon dans un tri.
 */
export function parseCfcDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = FRENCH_DATE.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  // Une date inexistante (`31/02/2026`) est rejetée : `Date.UTC` déborde.
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

/** Écrit une date au format français `JJ/MM/AAAA`. */
export function formatCfcDate(value: Date): string {
  // Une date invalide ne doit pas laisser fuir « NaN/NaN/NaN » à l'écran.
  if (!Number.isFinite(value.getTime())) return "";

  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${value.getUTCFullYear()}`;
}
```

Créer `src/domain/entities/dates.test.ts` :

```ts
import { describe, expect, it } from "vitest";

import { formatCfcDate, parseCfcDate } from "@/domain/entities/dates";

describe("dates de la plateforme", () => {
  it("lit une date française", () => {
    const parsed = parseCfcDate("15/01/2026");
    expect(parsed?.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("refuse une date inexistante", () => {
    expect(parseCfcDate("31/02/2026")).toBeNull();
  });

  it("refuse une date illisible", () => {
    expect(parseCfcDate("hier")).toBeNull();
    expect(parseCfcDate("")).toBeNull();
    expect(parseCfcDate(null)).toBeNull();
  });

  it("écrit une date française", () => {
    expect(formatCfcDate(new Date("2026-01-15T00:00:00.000Z"))).toBe("15/01/2026");
  });

  it("fait l'aller-retour", () => {
    const parsed = parseCfcDate("03/09/2026");
    expect(parsed && formatCfcDate(parsed)).toBe("03/09/2026");
  });

  it("n'écrit pas une date invalide", () => {
    expect(formatCfcDate(new Date(""))).toBe("");
  });
});
```

Créer `src/components/data-table/use-data-table.ts` :

```ts
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
```

- [ ] **Étape 4 : lancer les tests et vérifier qu'ils passent**

```
npx vitest run src/components/data-table/use-data-table.test.tsx src/domain/entities/dates.test.ts
```
Attendu : **12 tests passés** (6 pour le hook, 6 pour les dates).

- [ ] **Étape 5 : committer**

```bash
git add src/components/data-table src/domain/entities/dates.ts src/domain/entities/dates.test.ts
git commit -m "feat(data-table): le contrat de colonne, le helper de date et le hook

Le contrat de colonne porte la valeur (tri, filtre, groupe) et le noeud
affiché. Les dates sont lues en un seul lieu — le domaine — parce qu'une
date française se trierait alphabétiquement sans cela."
```

---

## Tâche 4 — Le composant `<DataTable>`

**Fichiers :**
- Créer : `src/components/data-table/data-table.tsx`
- Créer : `src/components/data-table/data-table.test.tsx`

**Interfaces :**
- Consomme : `useDataTable`, `DataColumn` (tâche 3) ; `ui/table` ; `formatCfcDate` (`@/domain/entities/dates`).
- Produit :
  - `DataTable<T>(props: DataTableProps<T>)`
  - `type DataTableProps<T> = { tableId: string; columns: DataColumn<T>[]; rows: T[]; getRowId: (row: T) => string; renderRow?: (context: { row: T; cell: (key: string) => React.ReactNode }) => React.ReactNode; emptyLabel?: string; className?: string; tableClassName?: string; rowClassName?: string; headClassName?: string; cellClassName?: string }`
  - Les quatre classes de mise en page (`tableClassName`, `rowClassName`, `headClassName`, `cellClassName`) portent la disposition d'un tableau qui s'aligne par **sous-grille** CSS : le moteur ne connaît pas la mise en page, il la porte.
  - `export type { DataColumn }` — ré-exporté, pour que les consommateurs n'aient qu'un seul point d'entrée.

> La section « Interfaces » ci-dessus ne reprend **pas** `ui/badge` : le composant ne l'utilise pas, et l'importer serait une erreur de lint (import inutilisé).

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/components/data-table/data-table.test.tsx` :

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { useDataTableStore } from "@/stores/data-table-store";

type Row = { id: string; name: string; phase: string };

const COLUMNS: DataColumn<Row>[] = [
  { key: "name", label: "Emprunteur", accessor: (row) => row.name },
  { key: "phase", label: "Phase", accessor: (row) => row.phase, groupable: true },
];

const ROWS: Row[] = [
  // L'ordre de la source n'est **pas** l'ordre alphabétique : un test de tri
  // doit pouvoir échouer si le tri ne se fait pas.
  { id: "3", name: "NGUEMA", phase: "committees" },
  { id: "1", name: "ÉBAH", phase: "kyc_savings" },
  { id: "2", name: "FOTSO", phase: "committees" },
];

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

function renderTable() {
  return render(
    <DataTable
      tableId="test-table"
      columns={COLUMNS}
      rows={ROWS}
      getRowId={(row) => row.id}
    />,
  );
}

describe("DataTable", () => {
  it("affiche les en-têtes de colonnes", () => {
    renderTable();
    expect(screen.getByRole("columnheader", { name: /Emprunteur/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Phase/ })).toBeInTheDocument();
  });

  it("trie sur le clic d'un en-tête", async () => {
    const user = userEvent.setup();
    renderTable();

    // Avant le clic, les lignes sont dans l'ordre de la source — **pas**
    // dans l'ordre alphabétique : l'assertion d'après prouve que le tri a
    // eu lieu.
    const before = screen.getAllByRole("row")[1];
    expect(within(before).getByText("NGUEMA")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Emprunteur/ }));

    const after = screen.getAllByRole("row")[1];
    expect(within(after).getByText("ÉBAH")).toBeInTheDocument();
  });

  it("annonce la direction du tri à l'assistance technique", async () => {
    const user = userEvent.setup();
    renderTable();

    const header = screen.getByRole("columnheader", { name: /Emprunteur/ });
    expect(header).toHaveAttribute("aria-sort", "none");

    await user.click(screen.getByRole("button", { name: /Emprunteur/ }));
    expect(screen.getByRole("columnheader", { name: /Emprunteur/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("affiche le message quand aucune ligne ne correspond", () => {
    render(
      <DataTable
        tableId="empty-table"
        columns={COLUMNS}
        rows={[]}
        getRowId={(row) => row.id}
        emptyLabel="Aucun emprunteur ne correspond aux filtres appliqués."
      />,
    );

    expect(
      screen.getByText("Aucun emprunteur ne correspond aux filtres appliqués."),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/components/data-table/data-table.test.tsx
```
Attendu : échec, `Cannot find module '@/components/data-table/data-table'`.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/components/data-table/data-table.tsx` :

```tsx
"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCfcDate } from "@/domain/entities/dates";
import { cn } from "@/lib/utils";

import type { DataColumn } from "./types";
import { useDataTable } from "./use-data-table";

export interface DataTableProps<T> {
  /** Identifiant du tableau : il isole son état dans le store. */
  tableId: string;
  columns: DataColumn<T>[];
  rows: T[];
  /** Identifiant stable d'une ligne — il est la clé React. */
  getRowId: (row: T) => string;
  /**
   * Rendu d'une ligne.
   *
   * Par défaut, une cellule par colonne. Un tableau qui a besoin d'une ligne
   * particulière — une case à cocher, une barre d'actions — fournit la sienne,
   * et reçoit la cellule de chaque colonne par `cell(key)`.
   */
  renderRow?: (context: { row: T; cell: (key: string) => React.ReactNode }) => React.ReactNode;
  /** Message affiché quand aucune ligne ne correspond. */
  emptyLabel?: string;
  className?: string;
  /**
   * Classes de mise en page.
   *
   * Le répertoire des emprunteurs s'aligne par **sous-grille** CSS : ses
   * colonnes sont des `grid-cols-subgrid`. Un tableau qui utilise cette
   * disposition passe ses classes ici — le moteur ne connaît pas la mise en
   * page, il ne fait que la porter.
   */
  tableClassName?: string;
  rowClassName?: string;
  headClassName?: string;
  cellClassName?: string;
}

/**
 * Le tableau.
 *
 * Il ne connaît **aucune** règle : le tri, le filtre et le groupement
 * viennent du moteur (`useDataTable`). Ce composant rend, et rien d'autre.
 */
export function DataTable<T>({
  tableId,
  columns,
  rows,
  getRowId,
  renderRow,
  emptyLabel = "Aucune ligne ne correspond aux filtres appliqués.",
  className,
  tableClassName,
  rowClassName,
  headClassName,
  cellClassName,
}: DataTableProps<T>) {
  const { state, groups, filteredCount, toggleSort } = useDataTable({
    tableId,
    columns,
    rows,
  });

  const cell = React.useCallback(
    (row: T, column: DataColumn<T>): React.ReactNode => {
      if (column.render) return column.render(row);
      const value = column.accessor?.(row);
      if (value === null || value === undefined) return null;
      // Une date s'affiche **en français** : `String(date)` produirait
      // « Thu Jan 15 2026 01:00:00 GMT+0100 (West Africa Time) » — en
      // anglais, en heure locale, et parfois au jour précédent.
      if (value instanceof Date) return formatCfcDate(value);
      return String(value);
    },
    [],
  );

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card shadow-xs", className)}>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow className={rowClassName}>
              {columns.map((column) => {
                const rule = state.sorts.find((sort) => sort.key === column.key);
                const rank = state.sorts.findIndex((sort) => sort.key === column.key) + 1;
                const sortable = column.sortable !== false && Boolean(column.accessor);

                return (
                  <TableHead
                    key={column.key}
                    scope="col"
                    // L'assistance technique doit entendre l'état du tri :
                    // sans `aria-sort`, la colonne triée est muette.
                    aria-sort={
                      !sortable
                        ? undefined
                        : rule?.dir === "asc"
                          ? "ascending"
                          : rule?.dir === "desc"
                            ? "descending"
                            : "none"
                    }
                    className={cn(
                      headClassName,
                      column.headerClassName,
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={(event) => toggleSort(column.key, event.shiftKey)}
                        aria-label={`Trier par ${column.label}`}
                        className="inline-flex items-center gap-1 text-left hover:text-foreground"
                      >
                        {column.label}
                        {rule ? (
                          <>
                            {rule.dir === "asc" ? (
                              <ArrowUp className="size-3" aria-hidden />
                            ) : (
                              <ArrowDown className="size-3" aria-hidden />
                            )}
                            {state.sorts.length > 1 ? (
                              <span className="font-mono text-[9px]">{rank}</span>
                            ) : null}
                          </>
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCount === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[120px] text-center">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <React.Fragment key={group.key || "all"}>
                  {state.groupBy ? (
                    <TableRow className={cn(rowClassName, "bg-muted/40")}>
                      <TableCell
                        colSpan={columns.length}
                        className="h-8 text-[11px] font-semibold text-foreground"
                      >
                        {group.label} · {group.rows.length}
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {group.rows.map((row) =>
                    renderRow ? (
                      <React.Fragment key={getRowId(row)}>
                        {renderRow({
                          row,
                          cell: (key) => {
                            const column = columns.find((candidate) => candidate.key === key);
                            return column ? cell(row, column) : null;
                          },
                        })}
                      </React.Fragment>
                    ) : (
                      <TableRow key={getRowId(row)} className={rowClassName}>
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={cn(
                              cellClassName,
                              column.cellClassName,
                              column.align === "right" && "text-right",
                              column.align === "center" && "text-center",
                            )}
                          >
                            {cell(row, column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ),
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export type { DataColumn };
export default DataTable;
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/components/data-table/data-table.test.tsx
```
Attendu : **3 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/components/data-table/data-table.tsx src/components/data-table/data-table.test.tsx
git commit -m "feat(data-table): le composant de tableau, en-têtes triables et groupes"
```

---

## Tâche 5 — La barre d'outils canonique

> **Point à trancher dans cette tâche :** la recherche porte sur la forme **ISO**
> des dates, parce que le moteur normalise une `Date` en ISO. Un agent qui tape
> « 15/01/2026 » ne trouve donc pas une colonne de date. La correction est
> d'élargir la recherche à la forme française — ou de l'assumer et de le dire.
> Ne laisse pas ce point passer sans décision explicite.

**Fichiers :**
- Modifier : `src/components/ui/data-table-toolbar.tsx` (réécriture)
- Modifier : `src/components/ui/data-table-faceted-filter.tsx` (type `FilterOption` déplacé)
- Créer : `src/components/ui/data-table-toolbar.test.tsx`

**Interfaces :**
- Consomme : `useDataTable` (tâche 3), `FacetOption`/`FacetDef` de `src/lib/data-table.ts`.
- Produit :
  - `DataTableToolbar<T>(props: DataTableToolbarProps<T>)` avec
    `{ tableId: string; columns: DataColumn<T>[]; rows: T[]; unitName?: string; onExport?: () => void; children?: React.ReactNode; className?: string }`
  - `DataTableFacetedFilter` — props **inchangées** (`title`, `options`, `selectedValues`, `onSelect`), mais `FilterOption` vient désormais de `@/lib/data-table`.

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/components/ui/data-table-toolbar.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTableStore } from "@/stores/data-table-store";

type Row = { id: string; name: string; phase: string };

const COLUMNS: DataColumn<Row>[] = [
  { key: "name", label: "Emprunteur", accessor: (row) => row.name },
  { key: "phase", label: "Phase", accessor: (row) => row.phase, filterable: true, groupable: true },
];

const ROWS: Row[] = [
  { id: "1", name: "ÉBAH", phase: "kyc_savings" },
  { id: "2", name: "FOTSO", phase: "committees" },
];

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("barre d'outils du tableau", () => {
  it("propose le regroupement par une colonne éligible", () => {
    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole("combobox", { name: /Regrouper par/ })).toBeInTheDocument();
  });

  it("n'offre que les colonnes marquées groupables", async () => {
    const user = userEvent.setup();
    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} />);

    await user.click(screen.getByRole("combobox", { name: /Regrouper par/ }));

    expect(await screen.findByRole("option", { name: "Phase" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Emprunteur" })).not.toBeInTheDocument();
  });

  it("affiche le compte filtré sur le total", () => {
    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} unitName="emprunteurs" />);

    expect(screen.getByText(/2 emprunteurs/)).toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/components/ui/data-table-toolbar.test.tsx
```
Attendu : échec — la barre actuelle ne connaît ni `tableId` ni le regroupement.

- [ ] **Étape 3 : réécrire la barre d'outils**

Remplacer entièrement `src/components/ui/data-table-toolbar.tsx` :

```tsx
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

/**
 * Barre d'outils du tableau — **canonique**.
 *
 * Elle porte la recherche, les facettes, le regroupement et les pastilles de
 * tri. Elle lit l'état dans le store : la table et sa barre d'outils sont
 * donc toujours d'accord, sans prop drilling ni duplication d'état.
 */
export interface DataTableToolbarProps<T> {
  tableId: string;
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

  const groupableColumns = columns.filter(
    (column) => column.groupable && column.accessor,
  );

  const hasActiveFilters =
    state.filters.some((filter) => filter.values.length > 0) ||
    Boolean(state.search.trim()) ||
    state.sorts.length > 0 ||
    state.groupBy !== null;

  const handleReset = () => {
    reset();
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
            value={state.search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 pl-8 pr-7 text-[12px]"
          />
          {state.search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
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
            onClick={handleReset}
            className="h-8 gap-1.5 px-2.5 text-[12px] text-subtle hover:text-foreground"
          >
            <span>Réinitialiser</span>
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
        <span className="caption-style whitespace-nowrap font-mono text-subtle">
          {filteredCount} {unitName}
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
```

Dans `src/components/ui/data-table-faceted-filter.tsx`, remplacer l'export local `FilterOption` par un type dérivé du module pur — le module `lib` ne connaît pas React :

```tsx
import type { FacetOption } from "@/lib/data-table";

/** Une option de facette : la valeur du module pur, plus l'icône d'affichage. */
export type FilterOption = FacetOption & {
  icon?: React.ComponentType<{ className?: string }>;
};
```

Le reste du fichier est inchangé.

- [ ] **Étape 4 : lancer les tests et vérifier qu'ils passent**

```
npx vitest run src/components/ui/data-table-toolbar.test.tsx src/components/clients/table/clients-table.test.tsx
```
Attendu : les **3** tests de la barre d'outils passés. Si `clients-table.test.tsx` échoue, c'est parce qu'il utilise encore l'ancienne barre : c'est l'objet de la tâche 6 — dans ce cas, passer à la tâche 6 avant de rejouer.

- [ ] **Étape 5 : committer**

```bash
git add src/components/ui/data-table-toolbar.tsx src/components/ui/data-table-faceted-filter.tsx src/lib/data-table.ts src/components/ui/data-table-toolbar.test.tsx
git commit -m "feat(data-table): la barre d'outils canonique — facettes, regroupement, tri"
```

---

## Tâche 6 — Migration de référence : le répertoire des emprunteurs

C'est la migration qui **démontre** le moteur et qui supprime les quatre doublons.

**Fichiers :**
- Modifier : `src/components/clients/table/clients-table.tsx`
- Modifier : `src/components/clients/table/table-columns.ts`
- Modifier : `src/components/clients/table/client-row.tsx`
- Supprimer : `src/stores/clients-store.ts`
- Supprimer : `src/lib/clients-filters.ts`
- Supprimer : `src/components/clients/toolbar/clients-toolbar.tsx`
- Supprimer : `src/components/_common/filter-menu.tsx`
- Modifier : `src/app/portail-cfc/clients/page.tsx`
- Modifier : `src/lib/clients-filters.test.ts` → supprimé (les règles sont désormais testées dans `src/lib/data-table.test.ts`)

**Interfaces :**
- Consomme : `DataTable`, `useDataTable`, `DataTableToolbar` (tâches 3–5).
- Produit : le répertoire des emprunteurs piloté par le moteur ; **plus aucun** store, filtre ni barre d'outils propre aux clients.

- [ ] **Étape 1 : écrire le test qui échoue**

Dans `src/components/clients/table/clients-table.test.tsx`, remplacer le contenu par :

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ClientsTable } from "@/components/clients/table/clients-table";
import { clientsData } from "@/domain/entities/client";
import { useDataTableStore } from "@/stores/data-table-store";

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("répertoire des emprunteurs", () => {
  it("filtre les lignes sur la recherche de la barre d'outils", async () => {
    const user = userEvent.setup();

    render(
      <ClientsTable
        clients={clientsData}
        selectedClientId=""
        onSelectClient={() => {}}
        onOpenKanban={() => {}}
        onOpenDuc={() => {}}
        onOpenEpargne={() => {}}
      />,
    );

    await user.type(screen.getByLabelText("Rechercher"), "fokam");

    expect(screen.queryByText("ABANDA Eric")).not.toBeInTheDocument();
    expect(screen.getByText("FOKAM Emmanuel")).toBeInTheDocument();
  });
});
```

> Les données viennent de `clientsData` (`@/domain/entities/client`) : c'est
> la source réelle, et elle garantit que le test reste typé.

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/components/clients/table/clients-table.test.tsx
```
Attendu : échec — il n'y a pas encore de barre d'outils dans le tableau, ni de recherche.

- [ ] **Étape 3 : réécrire le tableau des clients**

Remplacer `src/components/clients/table/table-columns.ts` par :

```ts
import type { DataColumn } from "@/components/data-table/types";
import type { ClientItem } from "@/domain/entities/client";

/**
 * Les colonnes du répertoire.
 *
 * La grille s'aligne par **sous-grille** CSS : huit colonnes de largeur
 * `max-content`, les lignes reprenant le découpage par `grid-cols-subgrid`.
 * Le `columnClass` est l'alignement de la colonne ; il est reporté dans
 * `cellClassName` pour que la ligne comme l'en-tête partagent la même grille.
 */
export const CLIENT_COLUMNS: DataColumn<ClientItem>[] = [
  {
    key: "name",
    label: "Emprunteur",
    accessor: (row) => row.name,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "agency",
    label: "Agence",
    accessor: (row) => row.agency,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "phase",
    label: "Phase",
    accessor: (row) => row.phase,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "status",
    label: "Statut",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "loanAmount",
    label: "Montant",
    accessor: (row) => row.loanAmount,
    cellClassName: "justify-end tabular-nums",
  },
  {
    key: "savingsCurrent",
    label: "Épargne",
    accessor: (row) => row.savingsCurrent,
    cellClassName: "justify-end tabular-nums",
  },
  {
    key: "completionPercent",
    label: "Avancement",
    accessor: (row) => row.completionPercent,
    cellClassName: "justify-center",
  },
  {
    // La colonne d'actions n'est ni triable ni filtrable : elle porte un
    // menu, pas une valeur.
    key: "action",
    label: "Action",
    sortable: false,
    cellClassName: "justify-center",
  },
];

/** La grille du répertoire : huit colonnes, alignées par sous-grille. */
export const CLIENT_TABLE_GRID_CLASS =
  "grid min-w-max grid-cols-[repeat(8,max-content)] justify-between";

export const CLIENT_TABLE_ROW_CLASS = "col-span-full grid grid-cols-subgrid";

export const CLIENT_TABLE_CELL_CLASS = "flex items-center";
```

Remplacer `src/components/clients/table/clients-table.tsx` par :

```tsx
"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { downloadCsv } from "@/lib/csv";

import { ClientRow } from "./client-row";
import {
  CLIENT_COLUMNS,
  CLIENT_TABLE_CELL_CLASS,
  CLIENT_TABLE_GRID_CLASS,
  CLIENT_TABLE_ROW_CLASS,
} from "./table-columns";
import type { ClientItem } from "@/domain/entities/client";

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-clients";

type ClientsTableProps = {
  clients: ClientItem[];
  selectedClientId: string;
  onSelectClient: (client: ClientItem) => void;
  onOpenKanban: (client: ClientItem) => void;
  onOpenDuc: (client: ClientItem) => void;
  onOpenEpargne: (client: ClientItem) => void;
};

/**
 * Le répertoire des emprunteurs.
 *
 * La table, sa barre d'outils et son export partagent le **même** moteur : le
 * tri, la recherche et les facettes sont ceux du portail entier, pas ceux de
 * cet écran.
 */
export function ClientsTable({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientsTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleExport = () => {
    downloadCsv(
      "emprunteurs-cfc.csv",
      [
        ["DUC", "Emprunteur", "Agence", "Phase", "Statut", "Montant", "Épargne", "Avancement %"],
        ...clients.map((client) => [
          client.ducId,
          client.name,
          client.agency,
          client.phase,
          client.status,
          client.loanAmount,
          client.savingsCurrent,
          client.completionPercent,
        ]),
      ],
    );
  };

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <DataTableToolbar
        tableId={TABLE_ID}
        columns={CLIENT_COLUMNS}
        rows={clients}
        unitName="emprunteurs"
        onExport={handleExport}
      />

      <DataTable
        tableId={TABLE_ID}
        columns={CLIENT_COLUMNS}
        rows={clients}
        getRowId={(client) => client.id}
        emptyLabel="Aucun emprunteur ne correspond aux filtres appliqués."
        tableClassName={CLIENT_TABLE_GRID_CLASS}
        rowClassName={CLIENT_TABLE_ROW_CLASS}
        cellClassName={CLIENT_TABLE_CELL_CLASS}
        renderRow={({ row, cell }) => (
          <ClientRow
            client={row}
            cell={cell}
            selected={selectedIds.includes(row.id)}
            active={row.id === selectedClientId}
            onToggle={(id) =>
              setSelectedIds((current) =>
                current.includes(id)
                  ? current.filter((selected) => selected !== id)
                  : [...current, id],
              )
            }
            onOpen={() => onSelectClient(row)}
            onOpenKanban={() => onOpenKanban(row)}
            onOpenDuc={() => onOpenDuc(row)}
            onOpenEpargne={() => onOpenEpargne(row)}
          />
        )}
      />
    </div>
  );
}
```

Remplacer `src/components/clients/table/client-row.tsx` par :

```tsx
"use client";

import {
  FileText,
  FolderOpen,
  Kanban as KanbanIcon,
  Landmark,
  MoreHorizontal,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { cn, getInitials } from "@/lib/utils";

import {
  CLIENT_TABLE_CELL_CLASS,
  CLIENT_TABLE_ROW_CLASS,
} from "./table-columns";
import type { ClientItem } from "@/domain/entities/client";

const STATUS_TONE: Record<ClientItem["status"], "green" | "neutral" | "red" | "teal" | "purple"> = {
  Conforme: "green",
  "En Examen": "neutral",
  "Pièces Manquantes": "red",
  Accordé: "teal",
  Mainlevée: "purple",
};

type ClientRowProps = {
  client: ClientItem;
  /** La cellule d'une colonne : la ligne ne lit plus le dossier, elle le reçoit. */
  cell: (key: string) => React.ReactNode;
  selected: boolean;
  active: boolean;
  onToggle: (id: string) => void;
  onOpen: () => void;
  onOpenKanban: () => void;
  onOpenDuc: () => void;
  onOpenEpargne: () => void;
};

/**
 * La ligne d'un emprunteur.
 *
 * Elle reçoit ses cellules du moteur : le tri, le filtre et le groupement
 * restent au tableau, la ligne ne fait que leshabiller.
 */
export function ClientRow({
  client,
  cell,
  selected,
  active,
  onToggle,
  onOpen,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientRowProps) {
  return (
    <TableRow
      role="row"
      data-active={active || selected}
      className={cn(
        CLIENT_TABLE_ROW_CLASS,
        "cursor-pointer",
        active && "bg-muted/60",
      )}
      onClick={onOpen}
    >
      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "gap-2", "justify-start")}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(client.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Sélectionner ${client.name}`}
          className="shrink-0"
        />
        <Avatar className={cn("size-7 shrink-0 rounded-md", client.avatarTone)}>
          <AvatarFallback className="text-[10px] font-bold">
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="flex min-w-0 flex-col items-start truncate text-left"
        >
          {cell("name")}
          <span className="truncate font-mono text-[10px] text-soft">{client.ducId}</span>
        </button>
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "text-xs text-muted-foreground", "justify-start")}
      >
        {cell("agency")}
      </TableCell>

      <TableCell role="cell" className={cn(CLIENT_TABLE_CELL_CLASS, "justify-start")}>
        <Tag tone="blue" size="sm">
          {cell("phase")}
        </Tag>
      </TableCell>

      <TableCell role="cell" className={cn(CLIENT_TABLE_CELL_CLASS, "justify-start")}>
        <Tag tone={STATUS_TONE[client.status]} size="sm">
          {cell("status")}
        </Tag>
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "text-xs font-medium text-foreground", "justify-end tabular-nums")}
      >
        {cell("loanAmount")}
      </TableCell>

      <TableCell
        role="cell"
        className={cn(CLIENT_TABLE_CELL_CLASS, "text-xs text-muted-foreground", "justify-end tabular-nums")}
      >
        {cell("savingsCurrent")}
      </TableCell>

      <TableCell role="cell" className={cn(CLIENT_TABLE_CELL_CLASS, "gap-2", "justify-center")}>
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={client.completionPercent}
          aria-label={`Avancement ${client.completionPercent} %`}
          className="h-1.5 w-16 overflow-hidden rounded-full bg-track"
        >
          <div
            className="h-full rounded-full bg-cfc-brown"
            style={{ width: `${client.completionPercent}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {cell("completionPercent")}
        </span>
      </TableCell>

      <TableCell role="cell" className={cn(CLIENT_TABLE_CELL_CLASS, "justify-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7"
              onClick={(event) => event.stopPropagation()}
              aria-label={`Actions pour ${client.name}`}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onOpen}>
              <FileText className="size-3.5" />
              Ouvrir la fiche
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenKanban}>
              <KanbanIcon className="size-3.5" />
              Tableau Kanban
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenDuc}>
              <FolderOpen className="size-3.5" />
              Dossier Unique (DUC)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenEpargne}>
              <Landmark className="size-3.5" />
              Carnet d&apos;épargne
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
```

- [ ] **Étape 4 : supprimer les doublons**

```bash
git rm src/stores/clients-store.ts src/lib/clients-filters.ts src/lib/clients-filters.test.ts
git rm src/components/clients/toolbar/clients-toolbar.tsx src/components/_common/filter-menu.tsx
```

Puis, dans `src/app/portail-cfc/clients/page.tsx`, retirer l'import et l'usage de `ClientsToolbar`.

Vérifier qu'aucun fichier ne référence encore les modules supprimés :

```
npx tsc --noEmit
```
Attendu : exit 0.

- [ ] **Étape 5 : lancer les tests et vérifier qu'ils passent**

```
npx vitest run src/components/clients/table/clients-table.test.tsx src/lib/data-table.test.ts
```
Attendu : **4** tests passés (1 pour les clients, 3 pour le moteur — adapter le compte au fichier de test réellement écrit).

- [ ] **Étape 6 : committer**

```bash
git add -A src/components/clients src/stores src/lib src/app/portail-cfc/clients src/components/_common
git commit -m "refactor(data-table): le répertoire des emprunteurs passe au moteur

Le store de tri, les filtres, la barre d'outils et le menu de filtre
propres aux clients sont supprimés : le moteur est désormais le seul
propriétaire du tri, de la recherche et des facettes."
```

---

## Tâche 7 — Migration des écrans déjà équipés

**Fichiers :**
- Modifier : `src/app/portail-cfc/actors/agency/page.tsx`
- Modifier : `src/app/portail-cfc/actors/agency/promoters/page.tsx`
- Modifier : `src/app/portail-cfc/actors/agency/diaspora/page.tsx`
- Modifier : `src/app/portail-cfc/actors/agency/mobile-money/page.tsx`

**Interfaces :**
- Consomme : `DataTable`, `DataTableToolbar` (tâches 4–5).
- Produit : quatre écrans qui partagent la barre d'outils et le moteur.

- [ ] **Étape 1 : choisir l'ordre de migration et l'annoncer**

Les quatre écrans sont migrés **dans l'ordre de la liste ci-dessus**, un par
commit, pour que chaque commit soit réversible seul.

- [ ] **Étape 2 : migrer `agency/page.tsx`**

Dans chaque écran, le tableau devient :

```tsx
const COLUMNS: DataColumn<Row>[] = [
  { key: "nom", label: "Nom", accessor: (row) => row.nom, filterable: true, groupable: true },
  { key: "montant", label: "Montant", accessor: (row) => row.montant, align: "right" },
];

<DataTableToolbar
  tableId="portail-cfc-agency"
  columns={COLUMNS}
  rows={ROWS}
  unitName="lignes"
/>

<DataTable
  tableId="portail-cfc-agency"
  columns={COLUMNS}
  rows={ROWS}
  getRowId={(row) => row.id}
  emptyLabel="Aucune ligne ne correspond aux filtres appliqués."
/>
```

Les `tableId` doivent être ** uniques** dans l'application. Recenser ceux déjà
utilisés avant d'en choisir un nouveau :

```
npx tsc --noEmit
```
et, pour chaque écran, vérifier que le `tableId` retenu n'apparaît nulle part
ailleurs :

```
rg "portail-cfc-agency" src
```

- [ ] **Étape 3 : migrer les trois écrans suivants**

Même opération, avec un `tableId` propre à chacun :
`portail-cfc-agency-promoters`, `portail-cfc-agency-diaspora`,
`portail-cfc-agency-mobile-money`.

- [ ] **Étape 4 : vérifier**

```
npm run typecheck
npm run lint
npm test
```
Attendu : typecheck 0, lint 0 sans avertissement, tous les tests passés.

- [ ] **Étape 5 : committer**

```bash
git add src/app/portail-cfc/actors/agency
git commit -m "refactor(data-table): les écrans de l'agence passent au moteur"
```

---

## Tâche 8 — Migration des onglets d'analytics

**Fichiers :**
- Modifier : `src/app/portail-cfc/analytics/_components/dossiers-duc-tab.tsx`
- Modifier : `src/app/portail-cfc/analytics/_components/epargnants-tab.tsx`
- Modifier : `src/app/portail-cfc/analytics/_components/simulations-tab.tsx`
- Modifier : `src/app/portail-cfc/analytics/_components/canaux-collecte-tab.tsx`
- Modifier : `src/app/portail-cfc/analytics/_components/top-pages.tsx`

**Interfaces :**
- Consomme : `DataTable`, `DataTableToolbar`.
- Produit : cinq tableaux d'analytics pilotés par le moteur.

- [ ] **Étape 1 : migrer `dossiers-duc-tab.tsx`**

Déclarer les colonnes en tête de fichier, avec leurs facettes :

```tsx
const COLUMNS: DataColumn<DossierRow>[] = [
  { key: "duc", label: "Dossier", accessor: (row) => row.duc, filterable: true },
  { key: "emprunteur", label: "Emprunteur", accessor: (row) => row.emprunteur, filterable: true, groupable: true },
  { key: "phase", label: "Phase", accessor: (row) => row.phase, filterable: true, groupable: true },
  { key: "montant", label: "Montant", accessor: (row) => row.montant, align: "right" },
];
```

Puis remplacer le `<Table>` par `<DataTable tableId="analytics-dossiers" … />`.

- [ ] **Étape 2 : migrer les quatre autres onglets**

Même opération, `tableId` distincts : `analytics-epargnants`,
`analytics-simulations`, `analytics-canaux`, `analytics-top-pages`.

- [ ] **Étape 3 : vérifier**

```
npm run typecheck && npm run lint && npm test
```
Attendu : 0 / 0 / tous les tests passés.

- [ ] **Étape 4 : committer**

```bash
git add src/app/portail-cfc/analytics
git commit -m "refactor(data-table): les onglets d'analytics passent au moteur"
```

---

## Tâche 9 — Migration des écrans par pôle

**Fichiers :** les 26 fichiers `page.tsx` de `src/app/portail-cfc/actors/**` qui contiennent un `<Table>`.

**Interfaces :**
- Consomme : `DataTable`, `DataTableToolbar`.
- Produit : tous les tableaux de pôle pilotés par le moteur.

- [ ] **Étape 1 : dresser la liste exacte**

```
rg -l "components/ui/table" src/app/portail-cfc/actors
```
La sortie est la liste à migrer. Ne pas migrer `kanban/_components/kanban.tsx` :
c'est une grille de colonnes, pas un tableau de lignes (voir tâche 10).

- [ ] **Étape 2 : migrer pôle par pôle**

Par pôle (`risk-engineering`, `notary-cadastre`, `credit-committees`,
`disbursements`, `mortgage-release`, `agency`), dans l'ordre :

1. Déclarer les colonnes avec leurs facettes.
2. Remplacer le `<Table>` par `<DataTable tableId="portail-cfc-<pole>-<ecran>" … />`.
3. Ajouter la `<DataTableToolbar>` au-dessus du tableau.
4. Vérifier que le `tableId` est unique.

```bash
rg "portail-cfc-risk-engineering-solvency" src
```

- [ ] **Étape 3 : vérifier après chaque pôle**

```
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 4 : committer par pôle**

```bash
git add src/app/portail-cfc/actors/risk-engineering
git commit -m "refactor(data-table): le pôle risques passe au moteur"
```

- [ ] **Étape 5 : recommencer pour les cinq pôles restants**

Un commit par pôle.

---

## Tâche 10 — Les tableaux qui restent, et le kanban qui sort du moteur

**Fichiers :**
- Modifier : `src/app/portail-cfc/clients/_components/client-savings-passbook.tsx`
- Modifier : `src/app/portail-cfc/settings/email/_components/email-deliveries-table.tsx`
- Modifier : `src/components/portail-client/duc-file-manager.tsx`
- Modifier : `src/app/portail-cfc/clients/[id]/_components/client-info-table.tsx` (si elle contient un tableau)
- Documenter : `src/app/portail-cfc/kanban/_components/kanban.tsx` — **hors moteur**, et pourquoi.

**Interfaces :**
- Consomme : `DataTable`, `DataTableToolbar`.
- Produit : les derniers tableaux pilotés par le moteur ; le kanban **explicitement** exclu et motivé dans son fichier.

- [ ] **Étape 1 : migrer le carnet d'épargne**

`client-savings-passbook.tsx` porte des sous-totaux par page : le moteur ne les
gère pas. La solution est de **calculer les sous-totaux dans les données** et de
les afficher dans la ligne d'en-tête de groupe, via `groupLabel` :

```tsx
const COLUMNS: DataColumn<SavingsRow>[] = [
  {
    key: "date",
    label: "Date",
    accessor: (row) => parseCfcDate(row.date),
    filterable: true,
    groupable: true,
    groupLabel: (value) => `Mois de ${formatCfcDate(new Date(value))}`,
    facetLabel: (value) => formatCfcDate(new Date(value)),
    render: (row) => row.date,
  },
  { key: "label", label: "Opération", accessor: (row) => row.label },
  { key: "amount", label: "Montant", accessor: (row) => row.amount, align: "right" },
];
```

> La date est **lue par le domaine** (`parseCfcDate`) et **affichée** par la
> colonne (`render`). Sans le helper, `accessor: (row) => row.date` trierait
> `15/01/2026` alphabétiquement — donc dans le désordre chronologique.

Si les sous-totaux ne peuvent pas être exprimés ainsi, la page **reste hors
moteur** et le dit dans un commentaire d'en-tête — même règle que le kanban.

- [ ] **Étape 2 : migrer les livraisons d'e-mail et le gestionnaire DUC**

Même opération que les pôles. `tableId` : `email-deliveries`, `duc-file-manager`.

- [ ] **Étape 3 : motiver l'exclusion du kanban**

En tête de `src/app/portail-cfc/kanban/_components/kanban.tsx` :

```tsx
/**
 * Le kanban **n'utilise pas** le moteur de table.
 *
 * C'est une grille de colonnes dans lesquelles on glisse des cartes, pas un
 * tableau de lignes : le tri, les facettes et le groupement n'y ont pas de
 * sens. Il garde donc son rendu propre — mais il en partage les conventions
 * (mêmes jetons, mêmes Hauteurs de ligne, même barre d'outils).
 */
```

- [ ] **Étape 4 : vérifier**

```
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 5 : committer**

```bash
git add -A src/app/portail-cfc src/components/portail-client
git commit -m "refactor(data-table): les derniers tableaux passent au moteur"
```

---

## Tâche 11 — La preuve par le smoke

**Fichiers :**
- Modifier : `scripts/smoke.mjs`

**Interfaces :**
- Consomme : le serveur de développement lancé sur `http://127.0.0.1:3000`.
- Produit : deux règles de smoke supplémentaires.

- [ ] **Étape 1 : lire le format des règles existantes**

```
rg -n "vérifications passées|function check|const rules" scripts/smoke.mjs
```
Reprendre **exactement** le format des règles déjà présentes.

- [ ] **Étape 2 : ajouter la règle « le moteur est présent »**

Une règle qui ouvre `/portail-cfc/clients` **avec une session réelle** et
vérifie que la barre d'outils canonique est là :

```js
// La barre d'outils du moteur — elle porte le regroupement et les facettes.
{
  const name = "le répertoire propose le regroupement du moteur";
  const html = await authenticatedGet("/portail-cfc/clients", adminCookie);
  const ok = html.includes("Regrouper par") && html.includes("Rechercher");
  record(name, ok, ok ? "" : "barre d'outils du moteur introuvable");
}
```

- [ ] **Étape 3 : ajouter la règle « le FAQ reste atteignable »**

```js
{
  const name = "la FAQ reste atteignable depuis l'en-tête public";
  const html = await publicGet("/faq");
  const ok = html.includes('href="/faq"');
  record(name, ok, ok ? "" : "lien vers la FAQ absent de l'en-tête");
}
```

- [ ] **Étape 4 : vérifier**

```
node scripts/smoke.mjs
```
Attendu : **60/60** vérifications passées (58 actuelles + 2 nouvelles).

- [ ] **Étape 5 : committer**

```bash
git add scripts/smoke.mjs
git commit -m "test(smoke): le moteur de table et la FAQ sont vérifiés"
```

---

## Validation finale

```bash
npm run typecheck     # exit 0
npm run lint          # exit 0, 0 avertissement
npm test              # tous les tests passés
npm run build         # exit 0 — le serveur de développement doit être arrêté
node scripts/smoke.mjs  # 60/60
```

Le build et le serveur de développement ne tournent **jamais** en même temps :
`.next` est partagé.

---

## Corrections après revue — tâches 1 et 2

Les blocs de code des tâches 1 et 2 ci-dessus décrivent ce qui avait été **planifié**. La revue de ces deux tâches a trouvé des défauts réels, corrigés depuis. **Ce qui suit est la vérité** : c'est la version qui a été committée, et c'est celle qu'il faut copier.

### Tâche 1 — l'état par défaut est gelé

`src/lib/data-table.ts` — l'état par défaut est un **singleton partagé** par tous les tableaux intacts. Il est gelé, pour qu'une mutation résiduelle échoue bruyamment au lieu de corrompre les 44 tableaux en silence :

```ts
export const DEFAULT_DATA_TABLE_STATE: DataTableState = {
  search: "",
  sorts: [],
  filters: [],
  groupBy: null,
};

Object.freeze(DEFAULT_DATA_TABLE_STATE.sorts);
Object.freeze(DEFAULT_DATA_TABLE_STATE.filters);
Object.freeze(DEFAULT_DATA_TABLE_STATE);
```

Le gel se fait **par instruction**, pas par cast : `Object.freeze([])` est de type `readonly never[]`, non assignable à `SortRule[]` (TS2352). Les types publics restent mutables — c'est ce qui permet d'écrire un test qui vérifie que la mutation **échoue**.

Deux autres corrections de la tâche 1 : les **dates** sont normalisées par `cellText` et comparées par horodatage (une colonne de date ne se trie plus silencieusement dans le désordre) ; les **valeurs vides restent en fin quelle que soit la direction**, la comparaison du vide étant sortie de l'inversion de signe.

### Tâche 2 — chaque tableau possède son propre état

`src/stores/data-table-store.ts` — l'état par défaut étant partagé, chaque entrée du store doit être **propriétaire de ses tableaux** :

```ts
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
```

Les cinq actions utilisent `ownState(state, tableId)` ; `reset` écrit `freshState()` ; `setFilter` recopie les valeurs fournies (`values: [...values]`), pour que l'état ne puisse pas changer sans `set()` — donc sans re-render.

`tableState()` **ne.alloue rien** : elle renvoie l'entrée stockée, ou la constante gelée. La référence doit rester **stable**, zustand 5 comparant les snapshots avec `Object.is`.

La ligne « Consomme » de la tâche 2 annonce `SortRule` : le code ne l'importe pas, et ne doit pas l'importer — le type transite par `DataTableState["sorts"]`, et un import de type inutilisé serait une erreur de lint.

### Tâche 3 — le contrat de colonne accepte la date, et elle s'affiche en français

La revue de la tâche 3 a trouvé que le contrat de colonne **ne pouvait pas exprimer la colonne de date** que le plan lui-même exigeait : `accessor` était typé `string | number | boolean | null | undefined`, alors que `parseCfcDate` renvoie une `Date` — vérifié par `tsc` : `TS2322`. Les tâches 4 à 11 étaient bloquées sur ce point.

`src/components/data-table/types.ts` :

```ts
  /**
   * Valeur de la cellule. Sans elle, la colonne n'est ni triable ni filtrable.
   *
   * Une **date** est une `Date` : c'est le moteur qui sait la trier
   * chronologiquement. Une date française en texte brut se trierait
   * alphabétiquement — donc dans le désordre.
   */
  accessor?: (row: T) => string | number | boolean | Date | null | undefined;
```

Deux garde-fous côté consommateur, discoveries par la même revue :

1. **Le rendu par défaut d'une date ne doit pas être `String(value)`** — cela produirait « Thu Jan 15 2026 01:00:00 GMT+0100 (West Africa Time) » : en anglais, en heure locale, et parfois au jour précédent. Une `Date` s'affiche par `formatCfcDate` (tâche 4).
2. **`formatCfcDate` refuse une date invalide** — sans garde, une date illisible s'afficherait « NaN/NaN/NaN » :

```ts
export function formatCfcDate(value: Date): string {
  // Une date invalide ne doit pas laisser fuir « NaN/NaN/NaN » à l'écran.
  if (!Number.isFinite(value.getTime())) return "";

  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${value.getUTCFullYear()}`;
}
```

Le hook renvoie aussi des **actions à identité stable** (`React.useCallback`) : un consommateur qui les place dans les dépendances d'un `useEffect` ne rejoue pas son effet à chaque rendu.

> Une réserve de la revue **réfutée** : la peur d'un `Date.UTC(50, …)` transformant « 0050 » en 1950. Le garde d'aller-retour de `parseCfcDate` la rejette déjà (`"01/01/0050"` → `null`) : aucune date muette n'est fausse.

---

## Ordre recommended
| Tâche | Contenu | Dépend de |
|---|---|---|
| 1 | Règles pures | — |
| 2 | Store unique | 1 |
| 3 | Contrat de colonne + hook | 1, 2 |
| 4 | Composant `DataTable` | 3 |
| 5 | Barre d'outils canonique | 3 |
| 6 | Migration du répertoire | 4, 5 |
| 7 | Écrans de l'agence | 4, 5 |
| 8 | Onglets d'analytics | 4, 5 |
| 9 | Écrans par pôle | 4, 5 |
| 10 | Derniers tableaux + kanban | 4, 5 |
| 11 | Smoke | 6–10 |

Les tâches 7, 8, 9 et 10 sont **indépendantes** entre elles : elles peuvent
être confiées à des agents distincts, en veillant à ce que les `tableId`
restent uniques.
