import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { OperationalRegisterView } from "@/components/portail-cfc/operational-register-view";
import type { OperationalRegisterRecord } from "@/domain/entities/operational-register";

const records: OperationalRegisterRecord[] = [
  {
    id: "record-one",
    dossierId: "dossier-one",
    dossierCode: "DUC-CENTRE-001",
    status: "En cours",
    occurredAt: "2026-11-18T12:00:00.000Z",
    fields: [{ label: "Agence", value: "Yaoundé" }],
  },
  {
    id: "record-two",
    dossierId: "dossier-two",
    dossierCode: "DUC-LITTORAL-002",
    status: "Validé",
    occurredAt: "2026-11-17T12:00:00.000Z",
    fields: [{ label: "Agence", value: "Douala" }],
  },
];

describe("registre opérationnel", () => {
  it("conserve les mêmes résultats filtrés en mode grille", async () => {
    const user = userEvent.setup();

    render(
      <OperationalRegisterView title="Registre" description="Registre métier" records={records} />,
    );

    await user.type(screen.getByLabelText("Rechercher dans le registre"), "douala");
    await user.click(screen.getByRole("button", { name: "Vue en grille" }));

    const cards = screen.getByRole("list", { name: "Enregistrements en grille" });
    expect(cards).toHaveTextContent("DUC-LITTORAL-002");
    expect(cards).not.toHaveTextContent("DUC-CENTRE-001");
  });
});
