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

  // --- garde-fous ajoutés au brief -------------------------------------
  // Ils verrouillent les comportements que le rendu promet et que les tests
  // du brief n'exercent pas : la date et le booléen **en français**, le
  // libellé de groupe, la ligne fournie par l'écran, le rang de priorité
  // annoncé, et l'absence de double conteneur de défilement.

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

  it("affiche un booléen en français", () => {
    const columns: DataColumn<{ id: string; paid: boolean }>[] = [
      {
        key: "paid",
        label: "Payé",
        accessor: (row) => row.paid,
      },
    ];

    render(
      <DataTable
        tableId="boolean-table"
        columns={columns}
        rows={[
          { id: "1", paid: true },
          { id: "2", paid: false },
        ]}
        getRowId={(row) => row.id}
      />,
    );

    // Jamais « true » ni « false » : ce sont des mots français.
    expect(screen.getByText("Oui")).toBeInTheDocument();
    expect(screen.getByText("Non")).toBeInTheDocument();
  });

  it("affiche un en-tête par groupe", () => {
    act(() => {
      useDataTableStore.getState().setGroupBy("test-table", "phase");
    });

    renderTable();

    expect(screen.getByText("committees · 2")).toBeInTheDocument();
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
    // L'en-tête, puis les trois lignes fournies par l'écran.
    expect(rows).toHaveLength(4);
    expect(within(rows[1]).getByText("NGUEMA")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Action")).toBeInTheDocument();
    // La colonne « Phase » n'est pas rendue : l'écran a choisi ses colonnes.
    expect(within(rows[1]).queryByText("committees")).not.toBeInTheDocument();
  });

  it("annonce le rang de priorité quand le tri est multi-colonnes", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: /Emprunteur/ }));
    // `shift` maintenu : le second tri s'ajoute au premier.
    await user.keyboard("{Shift>}");
    await user.click(screen.getByRole("button", { name: /Phase/ }));
    await user.keyboard("{/Shift}");

    // Sans lui, le lecteur d'écran entendrait « 2 » sans savoir ce que ce
    // chiffre désigne.
    expect(
      screen.getByRole("button", { name: "Trier par Phase (priorité 2)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Trier par Emprunteur (priorité 1)" }),
    ).toBeInTheDocument();
  });

  it("ne dédouble pas le conteneur de défilement", () => {
    renderTable();

    // `Table` porte déjà son propre conteneur : un second `overflow-auto`
    // donnerait deux barres de défilement sur les écrans migrés.
    expect(document.querySelectorAll(".overflow-auto")).toHaveLength(1);
  });
});
