import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import type { DataColumn } from "@/components/data-table/types";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
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

  // --- garde-fous ajoutés au brief -------------------------------------
  // Ils verrouillent les comportements que le rendu promet et que les tests
  // du brief n'exercent pas : la recherche, la date saisie en français, le
  // libellé français d'une facette booléenne, la réinitialisation et la
  // pastille de tri.

  it("affiche l'invite de recherche de l'écran", () => {
    render(
      <DataTableToolbar
        tableId="t"
        columns={COLUMNS}
        rows={ROWS}
        searchPlaceholder="Rechercher par emprunteur, N° DUC ou agence..."
      />,
    );

    expect(screen.getByLabelText("Rechercher")).toHaveAttribute(
      "placeholder",
      "Rechercher par emprunteur, N° DUC ou agence...",
    );
  });

  it("retombe sur l'invite générique quand l'écran n'en donne pas", () => {
    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByLabelText("Rechercher")).toHaveAttribute(
      "placeholder",
      "Rechercher…",
    );
  });

  it("filtre les lignes sur la recherche", async () => {
    const user = userEvent.setup();
    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} unitName="emprunteurs" />);

    await user.type(screen.getByLabelText("Rechercher"), "ÉBAH");

    expect(screen.getByText(/^1 emprunteur$/)).toBeInTheDocument();
  });

  it("retrouve une date saisie en forme française", async () => {
    const user = userEvent.setup();
    const columns: DataColumn<{ id: string; date: Date }>[] = [
      { key: "date", label: "Date", accessor: (row) => row.date },
    ];
    const rows = [
      { id: "1", date: new Date(Date.UTC(2026, 0, 15)) },
      { id: "2", date: new Date(Date.UTC(2026, 1, 20)) },
    ];

    render(<DataTableToolbar tableId="dates" columns={columns} rows={rows} unitName="dossiers" />);

    // La forme **affichée** par le tableau : elle doit trouver la date.
    await user.type(screen.getByLabelText("Rechercher"), "15/01/2026");

    expect(screen.getByText(/^1 dossier$/)).toBeInTheDocument();
    // Le champ garde ce que l'agent a tapé.
    expect(screen.getByLabelText("Rechercher")).toHaveValue("15/01/2026");
    // Et le store porte **la même** requête : la saisie n'est jamais
    // normalisée — c'est la comparaison du moteur qui s'élargit.
    expect(useDataTableStore.getState().byTable.dates?.search).toBe("15/01/2026");
  });

  it("affiche le libellé français des facettes d'une colonne booléenne", async () => {
    const user = userEvent.setup();
    const columns: DataColumn<{ id: string; paid: boolean }>[] = [
      {
        key: "paid",
        label: "Payé",
        accessor: (row) => row.paid,
        filterable: true,
        facetLabel: (value) => (value === "true" ? "Oui" : "Non"),
      },
    ];
    const rows = [
      { id: "1", paid: true },
      { id: "2", paid: false },
    ];

    render(<DataTableToolbar tableId="bool" columns={columns} rows={rows} />);

    await user.click(screen.getByRole("button", { name: /Payé/ }));

    expect(await screen.findByRole("menuitem", { name: /Oui/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Non/ })).toBeInTheDocument();
    // Jamais la valeur brute : « true » et « false » ne sont pas du français.
    expect(screen.queryByText("true")).not.toBeInTheDocument();
    expect(screen.queryByText("false")).not.toBeInTheDocument();
  });

  it("réinitialise la recherche et les facettes", async () => {
    const user = userEvent.setup();
    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} unitName="emprunteurs" />);

    await user.type(screen.getByLabelText("Rechercher"), "ÉBAH");
    expect(screen.getByText(/^1 emprunteur$/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Réinitialiser/ }));

    expect(screen.getByText(/^2 emprunteurs$/)).toBeInTheDocument();
    expect(screen.getByLabelText("Rechercher")).toHaveValue("");
  });

  it("affiche la pastille de tri", () => {
    act(() => {
      useDataTableStore.getState().toggleSort("t", "phase", false);
    });

    render(<DataTableToolbar tableId="t" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByText(/Phase ↑/)).toBeInTheDocument();
  });
});
