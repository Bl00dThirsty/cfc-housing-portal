import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { DataTable, type DataColumn } from "@/components/data-table/data-table";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDataTableStore } from "@/stores/data-table-store";

type Row = { id: string; name: string; phase: string };

const COLUMNS: DataColumn<Row>[] = [
  { key: "name", label: "Emprunteur", accessor: (row) => row.name },
  { key: "phase", label: "Phase", accessor: (row) => row.phase, groupable: true },
];

const ROWS: Row[] = [
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

    await user.click(screen.getByRole("button", { name: /Emprunteur/ }));

    const body = screen.getAllByRole("row")[1];
    expect(within(body).getByText("ÉBAH")).toBeInTheDocument();
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

  // --- garde-fous ajoutés au brief -------------------------------------
  // Ils verrouillent trois comportements que le rendu du tableau promet et
  // que les trois tests du brief ne couvrent pas : la date **française**,
  // l'en-tête de groupe et la ligne fournie par l'écran.

  it("affiche une date en français", () => {
    const columns: DataColumn<{ id: string; date: Date }>[] = [
      {
        key: "date",
        label: "Date",
        accessor: (row) => row.date,
      },
    ];

    render(
      <DataTable
        tableId="date-table"
        columns={columns}
        rows={[{ id: "1", date: new Date(Date.UTC(2026, 0, 15)) }]}
        getRowId={(row) => row.id}
      />,
    );

    // Jamais « Thu Jan 15 2026 … » : la date est un texte français.
    expect(screen.getByText("15/01/2026")).toBeInTheDocument();
  });

  it("affiche un en-tête par groupe", () => {
    act(() => {
      useDataTableStore.getState().setGroupBy("test-table", "phase");
    });

    renderTable();

    expect(screen.getByText("committees · 1")).toBeInTheDocument();
    expect(screen.getByText("kyc_savings · 1")).toBeInTheDocument();
  });

  it("laisse l'écran fournir sa propre ligne", () => {
    render(
      <DataTable
        tableId="custom-table"
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(row) => row.id}
        renderRow={({ cell }) => (
          <TableRow>
            <TableCell>{cell("name")}</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        )}
      />,
    );

    const rows = screen.getAllByRole("row");
    // L'en-tête, puis les deux lignes fournies par l'écran.
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("ÉBAH")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Action")).toBeInTheDocument();
    // La colonne « Phase » n'est pas rendue : l'écran a choisi ses colonnes.
    expect(within(rows[1]).queryByText("kyc_savings")).not.toBeInTheDocument();
  });
});
