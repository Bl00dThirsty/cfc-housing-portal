import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BorrowerRequestPortfolio } from "@/components/portail-client/borrower-request-portfolio";
import type {
  BorrowerRequestCardModel,
  BorrowerRequestsResult,
} from "@/domain/entities/borrower-request";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  start: vi.fn(),
  withdraw: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/server/actions/borrower-requests", () => ({
  startBorrowRequestAction: mocks.start,
  withdrawBorrowRequestAction: mocks.withdraw,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

function request(overrides: Partial<BorrowerRequestCardModel> = {}): BorrowerRequestCardModel {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    ducCode: "CFC-2026-DUC-00101",
    serviceLabel: "Prêt foncier classique",
    state: "documents",
    dossierStatus: "open",
    statusLabel: "Pièces à fournir",
    completionPercent: 40,
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-02T10:00:00.000Z",
    canWithdraw: true,
    ...overrides,
  };
}

function successResult(...requests: BorrowerRequestCardModel[]): BorrowerRequestsResult {
  return { ok: true, requests };
}

describe("borrower request portfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a useful empty state and starts the first persisted request", async () => {
    const user = userEvent.setup();
    mocks.start.mockResolvedValue({
      ok: true,
      dossierId: "00000000-0000-4000-8000-000000000201",
      dossierCode: "CFC-2026-DUC-00201",
    });

    render(<BorrowerRequestPortfolio result={successResult()} />);
    expect(screen.getByText("Aucune demande n’est encore ouverte")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Nouvelle demande/ }));

    expect(mocks.start).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith("/onboarding?dossier=00000000-0000-4000-8000-000000000201");
  });

  it("renders multiple independent requests with their own detail and resume links", () => {
    render(
      <BorrowerRequestPortfolio
        result={successResult(
          request(),
          request({
            id: "00000000-0000-4000-8000-000000000102",
            ducCode: "CFC-2026-DUC-00102",
            serviceLabel: "Prêt diaspora",
            state: "en_examen",
            statusLabel: "En cours d’examen",
            canWithdraw: false,
          }),
        )}
      />,
    );

    expect(screen.getByText("CFC-2026-DUC-00101")).toBeInTheDocument();
    expect(screen.getByText("CFC-2026-DUC-00102")).toBeInTheDocument();
    expect(screen.getByText("Prêt foncier classique")).toBeInTheDocument();
    expect(screen.getByText("Prêt diaspora")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Détails/ })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Reprendre/ })).toHaveAttribute(
      "href",
      "/onboarding?dossier=00000000-0000-4000-8000-000000000101",
    );
    expect(screen.getAllByText("40 %")).toHaveLength(2);
    expect(screen.getByText("En cours d’examen")).toBeInTheDocument();
  });

  it("requires confirmation before withdrawing and refreshes the persisted portfolio", async () => {
    const user = userEvent.setup();
    mocks.withdraw.mockResolvedValue({ ok: true, message: "Brouillon clôturé." });
    render(<BorrowerRequestPortfolio result={successResult(request())} />);

    await user.click(screen.getByRole("button", { name: /Clôturer le brouillon/ }));
    expect(screen.getByText(/Son numéro et son historique resteront conservés/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Clôturer$/ }));

    expect(mocks.withdraw).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000101");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
