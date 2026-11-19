import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ClientDucManager } from "./client-duc-manager";
import type { ClientItem } from "@/domain/entities/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./duc-upload-dialog", () => ({ DucUploadDialog: () => null }));
vi.mock("./duc-document-viewer-dialog", () => ({ DucDocumentViewerDialog: () => null }));

const client = {
  id: "dossier-1",
  ducId: "DUC-CENTRE-001",
  name: "Client de test",
  documents: [
    {
      id: "document-cni",
      name: "Carte nationale d'identité",
      category: "Identité",
      status: "Validé",
      date: "18 nov. 2026",
      ref: "CNI",
      fileName: "cni.pdf",
      fileSize: "240 Ko",
    },
    {
      id: "document-bulletin",
      name: "Bulletin de salaire",
      category: "Revenus",
      status: "En attente",
      date: "17 nov. 2026",
      ref: "BULLETIN",
      fileName: "salaire.pdf",
      fileSize: "180 Ko",
    },
  ],
} as ClientItem;

describe("cabinet documentaire DUC", () => {
  it("bascule les pièces autorisées en grille sans perdre la recherche", async () => {
    const user = userEvent.setup();

    render(<ClientDucManager client={client} />);

    await user.type(screen.getByLabelText("Rechercher une pièce du DUC"), "bulletin");
    await user.click(screen.getByRole("button", { name: "Vue en grille" }));

    const cards = screen.getByRole("list", { name: "Pièces du DUC en grille" });
    expect(cards).toHaveTextContent("Bulletin de salaire");
    expect(cards).not.toHaveTextContent("Carte nationale d'identité");
  });
});
