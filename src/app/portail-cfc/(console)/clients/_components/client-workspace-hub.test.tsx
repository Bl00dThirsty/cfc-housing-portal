import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ClientWorkspaceHub } from "@/app/portail-cfc/(console)/clients/_components/client-workspace-hub";
import { useDataTableStore } from "@/stores/data-table-store";

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("espace emprunteurs", () => {
  it("affiche un état vide lorsque la base ne retourne aucun dossier", () => {
    render(<ClientWorkspaceHub clients={[]} />);

    expect(screen.getByText("Aucun dossier accessible")).toBeInTheDocument();
    expect(screen.getByText(/nouveaux dossiers apparaîtront ici/)).toBeInTheDocument();
  });
});
