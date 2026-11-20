import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { decideDossierDocumentActionMock } = vi.hoisted(() => ({
  decideDossierDocumentActionMock: vi.fn(),
}));

vi.mock("@/server/actions/dossiers", () => ({
  decideDossierDocumentAction: decideDossierDocumentActionMock,
}));

import { DucDocumentDecisionActions } from "./duc-document-decision-actions";

describe("DucDocumentDecisionActions", () => {
  beforeEach(() => {
    decideDossierDocumentActionMock.mockReset();
    decideDossierDocumentActionMock.mockResolvedValue({
      ok: true,
      eventType: "DOCUMENT_VALIDATED",
      message: "Pièce validée : l’emprunteur est prévenu.",
    });
  });

  it("requires and submits a reason when rejecting a document", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <DucDocumentDecisionActions
        documentId="document-1"
        canValidate={false}
        canReject
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rejeter la pièce" }));
    await user.click(screen.getByRole("button", { name: "Confirmer le rejet" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Indiquez le motif du rejet.");
    expect(decideDossierDocumentActionMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Motif du rejet *"), "La pièce est illisible.");
    await user.click(screen.getByRole("button", { name: "Confirmer le rejet" }));

    expect(decideDossierDocumentActionMock).toHaveBeenCalledWith({
      documentId: "document-1",
      decision: "rejected",
      note: "La pièce est illisible.",
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("submits validation only when the stage policy permits it", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <DucDocumentDecisionActions
        documentId="document-2"
        canValidate
        canReject={false}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Valider la pièce" }));

    expect(decideDossierDocumentActionMock).toHaveBeenCalledWith({
      documentId: "document-2",
      decision: "validated",
    });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Rejeter la pièce" })).not.toBeInTheDocument();
  });
});
