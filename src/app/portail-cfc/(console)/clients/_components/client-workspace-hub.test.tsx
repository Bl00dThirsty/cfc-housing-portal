import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ClientWorkspaceHub } from "@/app/portail-cfc/(console)/clients/_components/client-workspace-hub";
import { useDataTableStore } from "@/stores/data-table-store";

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("espace emprunteurs", () => {
  it("ouvre la fiche de l'emprunteur dont on clique la ligne", async () => {
    const user = userEvent.setup();

    render(<ClientWorkspaceHub />);

    await user.click(screen.getByRole("button", { name: /^FOKAM Emmanuel/ }));

    const sheet = await screen.findByRole("dialog");

    // La fiche ouverte est bien celle de l'emprunteur cliqué : ni celle du
    // premier du jeu de données, ni celle d'un autre.
    expect(within(sheet).getByText("FOKAM Emmanuel")).toBeInTheDocument();
    expect(within(sheet).getByText("DUC-2026-04910")).toBeInTheDocument();
    expect(within(sheet).getByText("Situation du dossier")).toBeInTheDocument();
  });
});
