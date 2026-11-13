import { describe, expect, it } from "vitest";

import {
  applyFilters,
  applyGrouping,
  applySearch,
  applySorts,
  buildFacets,
  cellText,
  DEFAULT_DATA_TABLE_STATE,
  distinctValues,
  toggleSort,
} from "@/lib/data-table";

type Row = { name: string; phase: string; amount: number | null };

const ROWS: Row[] = [
  { name: "ÉBAH", phase: "kyc_savings", amount: 1200 },
  { name: "FOTSO", phase: "kyc_savings", amount: 3400 },
  { name: "NGUEMA", phase: "committees", amount: null },
  { name: "ABENA", phase: "committees", amount: 800 },
];

type DatedRow = { name: string; due: Date };

const DATED_ROWS: DatedRow[] = [
  { name: "FOTSO", due: new Date("2026-03-01T00:00:00.000Z") },
  { name: "ÉBAH", due: new Date("2026-01-15T00:00:00.000Z") },
  { name: "NGUEMA", due: new Date("2026-02-01T00:00:00.000Z") },
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

  it("ignore une valeur non textuelle au lieu d'échouer", () => {
    // Un accesseur mal typé (nombre ou date au lieu de chaîne) ne doit pas
    // faire tomber la recherche : la valeur est ramenée à sa forme textuelle.
    const loose = (row: Row) =>
      [row.name, row.amount, new Date("2026-01-15T00:00:00.000Z")] as unknown as string[];

    expect(applySearch(ROWS, "1200", loose).map((row) => row.name)).toEqual(["ÉBAH"]);
    expect(applySearch(ROWS, "2026-01-15", loose)).toHaveLength(4);
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

  it("place les valeurs nulles en fin de liste, même en descendant", () => {
    const sorted = applySorts(ROWS, [{ key: "amount", dir: "desc" }], (row) => row.amount);
    // Les valeurs vides ne sont jamais inversées avec le reste : elles
    // restent en fin, quelle que soit la direction du tri.
    expect(sorted.map((row) => row.name)).toEqual(["FOTSO", "ÉBAH", "ABENA", "NGUEMA"]);
  });

  it("trie une colonne de dates", () => {
    const ascending = applySorts(DATED_ROWS, [{ key: "due", dir: "asc" }], (row) => row.due);
    expect(ascending.map((row) => row.name)).toEqual(["ÉBAH", "NGUEMA", "FOTSO"]);

    const descending = applySorts(DATED_ROWS, [{ key: "due", dir: "desc" }], (row) => row.due);
    expect(descending.map((row) => row.name)).toEqual(["FOTSO", "NGUEMA", "ÉBAH"]);
  });

  it("trie une colonne de dates au format ISO", () => {
    const ascending = applySorts(
      DATED_ROWS,
      [{ key: "due", dir: "asc" }],
      (row) => row.due.toISOString(),
    );
    expect(ascending.map((row) => row.name)).toEqual(["ÉBAH", "NGUEMA", "FOTSO"]);
  });

  it("conserve l'ordre d'origine à valeur égale", () => {
    const sorted = applySorts(ROWS, [{ key: "phase", dir: "asc" }], (row) => row.phase);
    // `committees` avant `kyc_savings` ; à l'intérieur de chaque groupe de
    // valeurs égales, l'ordre d'origine est conservé (NGUEMA avant ABENA,
    // ÉBAH avant FOTSO) : le tri est stable.
    expect(sorted.map((row) => row.name)).toEqual(["NGUEMA", "ABENA", "ÉBAH", "FOTSO"]);
  });

  it("ne mute pas le tableau qu'il reçoit", () => {
    const input = [...ROWS];
    applySorts(input, [{ key: "amount", dir: "desc" }], (row) => row.amount);
    expect(input.map((row) => row.name)).toEqual(["ÉBAH", "FOTSO", "NGUEMA", "ABENA"]);
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

  it("remplace l'ensemble des tris au clic simple", () => {
    // Un clic simple sur une colonne déjà triée inverse sa direction et
    // abandonne le tri secondaire.
    const sorts = toggleSort(
      [
        { key: "phase", dir: "desc" },
        { key: "name", dir: "asc" },
      ],
      "phase",
      false,
    );
    expect(sorts).toEqual([{ key: "phase", dir: "asc" }]);
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

  it("liste les valeurs distinctes d'une colonne", () => {
    const columns = [{ key: "phase", accessor: (row: Row) => row.phase }];
    expect(distinctValues(columns, ROWS, "phase")).toEqual(["committees", "kyc_savings"]);
  });

  it("ne liste aucune valeur pour une colonne sans accesseur", () => {
    expect(distinctValues([{ key: "phase" }], ROWS, "phase")).toEqual([]);
  });

  it("démarre sans recherche, sans tri, sans filtre, sans groupe", () => {
    expect(DEFAULT_DATA_TABLE_STATE).toEqual({
      search: "",
      sorts: [],
      filters: [],
      groupBy: null,
    });
  });

  it("met en forme la valeur d'une cellule", () => {
    expect(cellText("ÉBAH")).toBe("ÉBAH");
    expect(cellText(1200)).toBe("1200");
    expect(cellText(true)).toBe("true");
    expect(cellText(null)).toBe("");
    expect(cellText(undefined)).toBe("");
  });

  it("met une date en forme ISO", () => {
    expect(cellText(new Date("2026-01-15T10:00:00.000Z"))).toBe("2026-01-15T10:00:00.000Z");
    expect(cellText(new Date("n'importe quoi"))).toBe("");
  });
});
