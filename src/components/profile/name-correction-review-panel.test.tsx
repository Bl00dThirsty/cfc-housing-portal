import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { decideCitizenNameCorrectionActionMock } = vi.hoisted(() => ({
  decideCitizenNameCorrectionActionMock: vi.fn(),
}));

vi.mock("@/server/actions/profile", () => ({
  decideCitizenNameCorrectionAction: decideCitizenNameCorrectionActionMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { NameCorrectionReviewPanel } from "./name-correction-review-panel";

const request = {
  id: "request-1",
  requestedFullName: "Aline M. Nguemo",
  reason: "Mon acte de naissance comporte mon nom complet.",
  createdAtLabel: "20 novembre 2026",
};

describe("NameCorrectionReviewPanel", () => {
  beforeEach(() => {
    decideCitizenNameCorrectionActionMock.mockReset();
    decideCitizenNameCorrectionActionMock.mockResolvedValue({
      ok: true,
      message: "La correction a été approuvée.",
    });
  });

  it("requires an explanatory reason before rejecting a legal-name correction", async () => {
    const user = userEvent.setup();
    render(<NameCorrectionReviewPanel currentName="Aline Nguemo" request={request} canDecide />);

    await user.click(screen.getByRole("button", { name: "Refuser la demande" }));
    await user.click(screen.getByRole("button", { name: "Confirmer le refus" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Ajoutez un motif précis d’au moins 10 caractères.");
    expect(decideCitizenNameCorrectionActionMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Motif de refus/), "Le justificatif ne confirme pas cette identité.");
    await user.click(screen.getByRole("button", { name: "Confirmer le refus" }));

    expect(decideCitizenNameCorrectionActionMock).toHaveBeenCalledWith({
      requestId: "request-1",
      decision: "rejected",
      reviewNote: "Le justificatif ne confirme pas cette identité.",
    });
  });

  it("shows the current and requested names before approving the correction", async () => {
    const user = userEvent.setup();
    render(<NameCorrectionReviewPanel currentName="Aline Nguemo" request={request} canDecide />);

    expect(screen.getByText("Aline Nguemo")).toBeInTheDocument();
    expect(screen.getByText("Aline M. Nguemo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approuver la correction" }));

    expect(decideCitizenNameCorrectionActionMock).toHaveBeenCalledWith({
      requestId: "request-1",
      decision: "approved",
      reviewNote: "",
    });
  });

  it("keeps review read-only when the persisted decision capability is absent", () => {
    render(<NameCorrectionReviewPanel currentName="Aline Nguemo" request={request} canDecide={false} />);

    expect(screen.getByRole("status")).toHaveTextContent("ne permet pas de la traiter");
    expect(screen.queryByRole("button", { name: "Approuver la correction" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refuser la demande" })).not.toBeInTheDocument();
  });
});
