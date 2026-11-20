import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DossierQueueView } from "@/components/portail-cfc/dossier-queue-view";
import type { OperationalDossier } from "@/domain/entities/operational-dossier";

const dossiers: OperationalDossier[] = [
  {
    id: "dossier-centre",
    ducCode: "DUC-CENTRE-001",
    region: "Centre",
    agency: "Yaoundé",
    phaseCode: "KYC",
    status: "Ouvert",
    updatedAt: "2026-11-18T12:00:00.000Z",
    isDiaspora: false,
  },
  {
    id: "dossier-littoral",
    ducCode: "DUC-LITTORAL-002",
    region: "Littoral",
    agency: "Douala",
    phaseCode: "INSTRUCTION",
    status: "En cours",
    updatedAt: "2026-11-17T12:00:00.000Z",
    isDiaspora: true,
  },
];

describe("file opérationnelle", () => {
  it("garde le même périmètre de recherche en vue grille et en vue liste", async () => {
    const user = userEvent.setup();

    render(
      <DossierQueueView dossiers={dossiers} title="Dossiers" description="File régionale" />,
    );

    await user.type(screen.getByLabelText("Rechercher dans les dossiers affichés"), "douala");
    await user.click(screen.getByRole("button", { name: "Vue en grille" }));

    const cards = screen.getByRole("list", { name: "Dossiers en grille" });
    expect(cards).toHaveTextContent("DUC-LITTORAL-002");
    expect(cards).not.toHaveTextContent("DUC-CENTRE-001");
  });
});
