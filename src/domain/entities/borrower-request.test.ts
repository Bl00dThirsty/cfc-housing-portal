import { describe, expect, it } from "vitest";

import {
  canWithdrawBorrowerRequest,
  borrowerRequestStatusLabel,
  selectAgencyForBorrower,
  mapBorrowerRequestRows,
} from "@/domain/entities/borrower-request";

describe("borrower request lifecycle", () => {
  it.each(["kyc", "service", "documents"]) (
    "allows withdrawal while the request is still in %s",
    (state) => expect(canWithdrawBorrowerRequest(state)).toBe(true),
  );

  it.each(["suspension", "en_examen", "active", "closed", null]) (
    "does not allow withdrawal after draft state %s",
    (state) => expect(canWithdrawBorrowerRequest(state)).toBe(false),
  );

  it("maps persisted workflow codes to borrower-facing French labels", () => {
    expect(borrowerRequestStatusLabel("en_examen")).toBe("En cours d’examen");
    expect(borrowerRequestStatusLabel("unknown_state")).toBe("unknown_state");
    expect(borrowerRequestStatusLabel(null)).toBe("État indisponible");
  });

  it("does not offer withdrawal once the dossier is closed", () => {
    expect(canWithdrawBorrowerRequest("documents", "closed")).toBe(false);
    expect(borrowerRequestStatusLabel("documents", "closed")).toBe("Demande clôturée");
  });
});

describe("borrower request read model", () => {
  it("maps every request independently using labels resolved from the service catalogue", () => {
    const requests = mapBorrowerRequestRows(
      [
        {
          id: "request-1",
          duc_code: "DUC-2026-00001",
          status: "open",
          service_code: "HOME_LOAN",
          onboarding_state: "documents",
          completion_percent: 45,
          created_at: "2026-11-01T10:00:00Z",
          updated_at: "2026-11-02T10:00:00Z",
        },
        {
          id: "request-2",
          duc_code: "DUC-2026-00002",
          status: "open",
          service_code: "NEW_CATALOGUE_ENTRY",
          onboarding_state: "service",
          completion_percent: null,
          created_at: "2026-11-03T10:00:00Z",
          updated_at: "2026-11-03T10:00:00Z",
        },
      ],
      new Map([["HOME_LOAN", "Prêt foncier classique"]]),
    );

    expect(requests).toEqual([
      expect.objectContaining({ id: "request-1", serviceLabel: "Prêt foncier classique", completionPercent: 45 }),
      expect.objectContaining({ id: "request-2", serviceLabel: null, completionPercent: null }),
    ]);
  });
});

describe("borrower agency routing", () => {
  const agencies = [
    { id: "agency-littoral-secondary", code: "LIT-02", region: "Littoral (Douala)", isDiasporaDesk: false },
    { id: "agency-centre", code: "CTR-01", region: "Centre", isDiasporaDesk: false },
    { id: "agency-littoral-primary", code: "LIT-01", region: "Littoral", isDiasporaDesk: false },
    { id: "agency-diaspora", code: "DIA-01", region: "Centre", isDiasporaDesk: true },
  ];

  it("routes a resident by matching a real routable region and uses a stable agency code tie-break", () => {
    const agency = selectAgencyForBorrower({
      agencies,
      borrowerRegion: "Littoral",
      isDiaspora: false,
      routableRegions: ["Littoral"],
    });

    expect(agency?.id).toBe("agency-littoral-primary");
  });

  it("routes a non-resident only through a configured diaspora desk with an active regional manager", () => {
    const agency = selectAgencyForBorrower({
      agencies,
      borrowerRegion: null,
      isDiaspora: true,
      routableRegions: ["Centre"],
    });

    expect(agency?.id).toBe("agency-diaspora");
  });

  it("returns no agency when persisted geography cannot be assigned", () => {
    expect(
      selectAgencyForBorrower({
        agencies,
        borrowerRegion: "Nord",
        isDiaspora: false,
        routableRegions: ["Littoral", "Centre"],
      }),
    ).toBeNull();
  });
});
