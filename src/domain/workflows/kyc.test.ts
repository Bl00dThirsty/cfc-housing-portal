import { describe, expect, it } from "vitest";

import {
  EDD_TRIGGERS,
  KYC_STATE_LABELS,
  KYC_TRANSITIONS,
  canTransition,
  enhancedDueDiligenceTriggers,
  isReadyForActivation,
  isTerminal,
  nextStates,
  rateRisk,
  requiresEnhancedDueDiligence,
  screeningIsCleared,
  type KycState,
} from "@/domain/workflows/kyc";

describe("canTransition", () => {
  it("follows the nominal path from pre-boarding to active", () => {
    const path: KycState[] = [
      "pre_boarding",
      "identity_capture",
      "document_verification",
      "screening_pending",
      "screening_cleared",
      "risk_rated",
      "approval_pending",
      "approved",
      "active",
    ];

    for (let index = 0; index < path.length - 1; index += 1) {
      expect(canTransition(path[index], path[index + 1])).toBe(true);
    }
  });

  it("never approves a dossier whose screening is pending", () => {
    expect(canTransition("screening_pending", "approved")).toBe(false);
    expect(canTransition("screening_pending", "risk_rated")).toBe(false);
    expect(canTransition("screening_pending", "approval_pending")).toBe(false);
  });

  it("routes a potential match to enhanced due diligence", () => {
    expect(canTransition("screening_potential_match", "enhanced_due_diligence")).toBe(true);
    expect(canTransition("screening_potential_match", "screening_cleared")).toBe(false);
  });

  it("allows blocking from every non-terminal state", () => {
    const states = Object.keys(KYC_TRANSITIONS) as KycState[];
    for (const state of states) {
      // Un dossier déjà bloqué ne se rebloque pas, et un dossier sorti est
      // hors du cycle de vie actif.
      if (state === "offboarded" || state === "exited" || state === "blocked") continue;
      expect(canTransition(state, "blocked")).toBe(true);
    }
  });

  it("does not allow blocking an already blocked dossier", () => {
    expect(canTransition("blocked", "blocked")).toBe(false);
  });

  it("rejects a transition from an exited dossier", () => {
    expect(canTransition("exited", "active")).toBe(false);
    expect(canTransition("offboarded", "active")).toBe(false);
  });

  it("rejects an unknown transition", () => {
    expect(canTransition("pre_boarding", "active")).toBe(false);
  });
});

describe("terminal states", () => {
  it("treats offboarded as terminal", () => {
    expect(isTerminal("offboarded")).toBe(true);
    expect(nextStates("offboarded")).toEqual([]);
  });

  it("does not treat active as terminal", () => {
    expect(isTerminal("active")).toBe(false);
  });
});

describe("screening gate", () => {
  it("is cleared only once the screening has been decided", () => {
    expect(screeningIsCleared("screening_pending")).toBe(false);
    expect(screeningIsCleared("screening_cleared")).toBe(true);
    expect(screeningIsCleared("enhanced_due_diligence")).toBe(true);
    expect(screeningIsCleared("risk_rated")).toBe(true);
  });
});

describe("enhanced due diligence", () => {
  it("triggers nothing for a plain face-to-face retail file", () => {
    expect(requiresEnhancedDueDiligence({})).toBe(false);
    expect(enhancedDueDiligenceTriggers({})).toEqual([]);
  });

  it("triggers for a non-resident", () => {
    expect(enhancedDueDiligenceTriggers({ nonResident: true })).toEqual([
      "NON_RESIDENT",
    ]);
  });

  it("collects every trigger at once", () => {
    const triggers = enhancedDueDiligenceTriggers({
      nonResident: true,
      pep: true,
      sourceOfFundsDoubt: true,
    });
    expect(triggers).toHaveLength(3);
    expect(triggers).toContain("NON_RESIDENT");
    expect(triggers).toContain("PEP");
    expect(triggers).toContain("SOURCE_OF_FUNDS_DOUBT");
  });

  it("gives a regulatory basis for every trigger", () => {
    for (const trigger of EDD_TRIGGERS) {
      expect(trigger.basis.length).toBeGreaterThan(10);
      expect(trigger.label.length).toBeGreaterThan(3);
    }
  });
});

describe("rateRisk", () => {
  it("rates a clean file LOW", () => {
    expect(rateRisk({})).toBe("LOW");
  });

  it("rates a sanctions hit HIGH whatever else", () => {
    expect(rateRisk({ sanctionsHit: true })).toBe("HIGH");
    expect(rateRisk({ sanctionsHit: true, complexTransaction: false })).toBe("HIGH");
  });

  it("rates a PEP HIGH", () => {
    expect(rateRisk({ pep: true })).toBe("HIGH");
  });

  it("rates a doubtful source of funds HIGH", () => {
    expect(rateRisk({ sourceOfFundsDoubt: true })).toBe("HIGH");
  });

  it("rates an unusual transaction STANDARD", () => {
    expect(rateRisk({ complexTransaction: true })).toBe("STANDARD");
  });

  it("rates a non-resident STANDARD", () => {
    expect(rateRisk({ nonResident: true })).toBe("STANDARD");
  });

  it("keeps risk and KYC state independent", () => {
    expect(rateRisk({})).toBe("LOW");
    expect(isReadyForActivation("approved")).toBe(true);
    expect(isReadyForActivation("active")).toBe(false);
  });
});

describe("labels", () => {
  it("gives a French label to every state", () => {
    for (const state of Object.keys(KYC_STATE_LABELS) as KycState[]) {
      expect(KYC_STATE_LABELS[state].length).toBeGreaterThan(2);
    }
  });

  it("covers every state of the machine", () => {
    for (const state of Object.keys(KYC_TRANSITIONS) as KycState[]) {
      expect(KYC_STATE_LABELS[state]).toBeDefined();
    }
  });
});
