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
