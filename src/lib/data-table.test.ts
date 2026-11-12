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
    // `committees` avant `kyc_savings` ; à l'intérieur de chaque groupe de
    // valeurs égales, l'ordre d'origine est conservé (NGUEMA avant ABENA,
    // ÉBAH avant FOTSO) : le tri est stable.
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
