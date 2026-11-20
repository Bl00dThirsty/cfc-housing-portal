import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ClientItem } from "@/domain/entities/client";
import { ClientKanban } from "./client-kanban";

const client = {
  id: "dossier-1",
  name: "Awa Njoya",
  ducId: "DUC-0001",
  avatarTone: "bg-primary/10",
  status: "Ouvert",
  phaseCode: "configured_phase",
  phase: "Libellé de la phase",
  officer: "—",
  documents: [],
  visas: [],
} as unknown as ClientItem;

describe("ClientKanban", () => {
  it("uses phase labels supplied by the Supabase catalogue", () => {
    render(
      <ClientKanban
        client={client}
        phases={[
          { code: "configured_phase", label: "Phase configurée dans Supabase", sortOrder: 10 },
          { code: "another_phase", label: "Autre phase du catalogue", sortOrder: 20 },
        ]}
      />,
    );

    expect(screen.getByText("Phase configurée dans Supabase")).toBeInTheDocument();
    expect(screen.getByText("Autre phase du catalogue")).toBeInTheDocument();
    expect(screen.queryByText("Épargne & KYC")).not.toBeInTheDocument();
  });

  it("shows an explicit state when the phase catalogue has no entries", () => {
    render(<ClientKanban client={client} phases={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Le catalogue des étapes du dossier ne contient aucune phase.");
  });
});
