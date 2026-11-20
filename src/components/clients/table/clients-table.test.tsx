import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ClientsTable } from "@/components/clients/table/clients-table";
import type { ClientItem } from "@/domain/entities/client";
import { useDataTableStore } from "@/stores/data-table-store";

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

const clients: ClientItem[] = ["ABANDA Eric", "FOKAM Emmanuel"].map((name, index) => ({
  id: `test-${index}`,
  ducId: `DUC-TEST-${index}`,
  name,
  avatarTone: "",
  email: "test@example.cm",
  phone: "—",
  region: "Centre",
  agency: "Agence de test",
  profession: "—",
  employer: "—",
  projectType: "—",
  loanAmount: "—",
  savingsTarget: "—",
  savingsCurrent: "—",
  savingsPercent: 0,
  monthlyIncome: "—",
  monthlyPayment: "—",
  debtRatio: "—",
  landTitle: "—",
  durationYears: 0,
  rate: "—",
  accountNumber: "—",
  notaryAssigned: "—",
  betAssigned: "—",
  officer: "—",
  phase: "Épargne & KYC",
  status: "Ouvert",
  lastActivity: "—",
  completionPercent: 0,
  documents: [],
  visas: [],
}));

function renderTable() {
  return render(
    <ClientsTable
      clients={clients}
      selectedClientId=""
      onSelectClient={() => {}}
      onOpenKanban={() => {}}
      onOpenDuc={() => {}}
      onOpenEpargne={() => {}}
    />,
  );
}

describe("répertoire des emprunteurs", () => {
  it("filtre les lignes sur la recherche de la barre d'outils", async () => {
    const user = userEvent.setup();

    renderTable();

    await user.type(screen.getByLabelText("Rechercher"), "fokam");

    expect(screen.queryByText("ABANDA Eric")).not.toBeInTheDocument();
    expect(screen.getByText("FOKAM Emmanuel")).toBeInTheDocument();
  });

  it("affiche le nom de l'emprunteur avec la typographie de la colonne", () => {
    renderTable();

    // Le nom ne doit pas hériter de la taille du tableau (14 px) : il porte
    // la sienne, comme les autres cellules de la ligne.
    const name = screen.getByRole("button", { name: /^ABANDA Eric/ }).firstElementChild;

    expect(name).toHaveClass("text-xs", "font-medium");
  });

  it("bascule l'état de sélection d'une ligne", async () => {
    const user = userEvent.setup();

    renderTable();

    const checkbox = screen.getByLabelText("Sélectionner ABANDA Eric");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("sélectionne toutes les lignes visibles, puis les désélectionne", async () => {
    const user = userEvent.setup();

    renderTable();

    await user.click(screen.getByRole("button", { name: "Tout sélectionner" }));

    expect(screen.getByLabelText("Sélectionner ABANDA Eric")).toBeChecked();
    expect(screen.getByLabelText("Sélectionner FOKAM Emmanuel")).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Tout désélectionner" }));

    expect(screen.getByLabelText("Sélectionner ABANDA Eric")).not.toBeChecked();
  });

  it("désactive la sélection quand aucune ligne n'est visible", async () => {
    const user = userEvent.setup();

    renderTable();

    await user.type(screen.getByLabelText("Rechercher"), "zzzz");

    expect(screen.getByRole("button", { name: "Tout sélectionner" })).toBeDisabled();
  });

  it("affiche l'état vide quand aucune ligne ne correspond", async () => {
    const user = userEvent.setup();

    renderTable();

    await user.type(screen.getByLabelText("Rechercher"), "zzzz");

    expect(
      screen.getByText("Aucun emprunteur ne correspond aux filtres appliqués."),
    ).toBeInTheDocument();
  });

  it("bascule vers la grille sans perdre le résultat de recherche", async () => {
    const user = userEvent.setup();

    renderTable();

    await user.type(screen.getByLabelText("Rechercher"), "fokam");
    await user.click(screen.getByRole("button", { name: "Vue en grille" }));

    const cards = screen.getByRole("list", { name: "Emprunteurs en grille" });
    expect(cards).toHaveTextContent("FOKAM Emmanuel");
    expect(cards).not.toHaveTextContent("ABANDA Eric");
  });
});
