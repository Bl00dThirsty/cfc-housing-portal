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
