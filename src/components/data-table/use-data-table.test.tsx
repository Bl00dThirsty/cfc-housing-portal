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
});
