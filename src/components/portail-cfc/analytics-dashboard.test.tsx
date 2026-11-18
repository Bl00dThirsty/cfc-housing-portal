import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AnalyticsDashboard } from "@/components/portail-cfc/analytics-dashboard";
import type { AnalyticsOverview } from "@/domain/entities/analytics-overview";

const overview: AnalyticsOverview = {
  dossiers: {
    total: 17,
    diaspora: 3,
    byPhase: [
      { code: "kyc_savings", label: "Épargne & KYC", count: 5 },
      { code: "committees", label: "Comités de crédit", count: 12 },
    ],
  },
  savings: {
    activeAccounts: 8,
    activeBalance: 1_250_000,
    pendingOperations: 2,
    byChannel: { agency: 4, mobile_money_mtn: 2 },
  },
  credit: {
    committeeSessions: 3,
    sessionsByStatus: { scheduled: 1, deliberated: 2 },
    loanOffers: 5,
    offersByStatus: { issued: 4, accepted: 1 },
  },
  notary: { instruments: 2, openOppositions: 1, activeInsurances: 6 },
  disbursements: {
    tranches: 4,
    amountTotal: 8_000_000,
    schedulesDue: 1,
    schedulesLate: 0,
    reconciliationMismatches: 0,
  },
};

describe("AnalyticsDashboard", () => {
  it("renders the aggregate values provided by the database query", () => {
    render(<AnalyticsDashboard overview={overview} />);

    expect(screen.getByText("Pilotage opérationnel CFC")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("Comités de crédit")).toBeInTheDocument();
    expect(screen.getByText("1 250 000 FCFA")).toBeInTheDocument();
    expect(screen.queryByText("ABANDA Eric")).not.toBeInTheDocument();
  });

  it("explains that simulation analytics are unavailable while simulations are not persisted", async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard overview={overview} />);
    await user.click(screen.getByRole("tab", { name: "Simulations" }));

    expect(screen.getByText("Mesure des simulations non disponible")).toBeInTheDocument();
    expect(screen.getByText(/ne conserve pas les saisies personnelles/i)).toBeInTheDocument();
  });

  it("shows actual collection channels from the rollup", async () => {
    const user = userEvent.setup();
    render(<AnalyticsDashboard overview={overview} />);
    await user.click(screen.getByRole("tab", { name: "Canaux" }));

    expect(screen.getByText("Agence")).toBeInTheDocument();
    expect(screen.getByText("MTN MoMo")).toBeInTheDocument();
  });
});
