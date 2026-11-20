import { describe, expect, it } from "vitest";

import {
  ARREARS_PHASES,
  arrearsPhaseFor,
  isStillAmenable,
  phaseByStage,
  requiresCentralRisksDeclaration,
} from "@/domain/workflows/recovery";
import {
  DROIT_ACQUIS_MONTHS,
  canCloseOrExtend,
  canConvertToHousingLoan,
  computeDroitAcquis,
  meetsApportTarget,
  savingsProgress,
  type SavingsAccountState,
} from "@/domain/calculations/savings";

describe("échelle de recouvrement", () => {
  it("place un impayé de zéro mois en échéance", () => {
    expect(arrearsPhaseFor(0).stage).toBe("current");
  });

  it("relance amiablement sous trois mois", () => {
    expect(arrearsPhaseFor(1).stage).toBe("relance_amiable");
    expect(arrearsPhaseFor(2).stage).toBe("relance_amiable");
  });

  it("bascule en restructuration à trois mois", () => {
    expect(arrearsPhaseFor(3).stage).toBe("restructuring");
    expect(arrearsPhaseFor(6).stage).toBe("restructuring");
  });

  it("bascule en contentieux au-delà de six mois", () => {
    expect(arrearsPhaseFor(7).stage).toBe("contentieux");
    expect(arrearsPhaseFor(24).stage).toBe("contentieux");
  });

  it("traite un impayé négatif comme une échéance courante", () => {
    expect(arrearsPhaseFor(-1).stage).toBe("current");
  });

  it("exige une déclaration à la Centrale des risques au-delà de six mois", () => {
    expect(requiresCentralRisksDeclaration(6)).toBe(false);
    expect(requiresCentralRisksDeclaration(7)).toBe(true);
  });

  it("ferme la voie amiable après six mois", () => {
    expect(isStillAmenable(3)).toBe(true);
    expect(isStillAmenable(6)).toBe(true);
    expect(isStillAmenable(7)).toBe(false);
  });

  it("donne un délai et des obligations à chaque phase", () => {
    for (const phase of ARREARS_PHASES) {
      expect(phase.slaDays).toBeGreaterThan(0);
      expect(phase.obligations.length).toBeGreaterThan(0);
      expect(phase.procedures.length).toBeGreaterThan(0);
    }
  });

  it("cite les procédures du manuel dans chaque phase", () => {
    expect(phaseByStage("relance_amiable").procedures).toEqual(["REC-02", "REC-08"]);
    expect(phaseByStage("restructuring").procedures).toEqual(["REC-03", "CRD-05"]);
    expect(phaseByStage("closed").procedures).toEqual(["REC-09", "REC-10", "GAR-05"]);
  });

  it("levée sur une phase inconnue", () => {
    expect(() => phaseByStage("inconnu" as never)).toThrow();
  });
});

function account(overrides: Partial<SavingsAccountState> = {}): SavingsAccountState {
  return {
    openedAt: "2026-01-15",
    monthsPaid: 6,
    totalPaid: 900_000,
    targetAmount: 2_000_000,
    passbookType: "A",
    closed: false,
    ...overrides,
  };
}

describe("droit acquis de l'épargne-logement", () => {
  it("n'est pas acquis avant une année de versements", () => {
    const droit = computeDroitAcquis(account({ monthsPaid: 6 }));
    expect(droit.acquired).toBe(false);
    expect(droit.monthsRemaining).toBe(6);
    expect(droit.acquiredAmount).toBe(0);
    expect(droit.acquisitionDate).toBeNull();
  });

  it("est acquis au terme de douze mois", () => {
    expect(DROIT_ACQUIS_MONTHS).toBe(12);
    const droit = computeDroitAcquis(account({ monthsPaid: 12, totalPaid: 1_800_000 }));
    expect(droit.acquired).toBe(true);
    expect(droit.monthsRemaining).toBe(0);
    expect(droit.acquiredAmount).toBe(1_800_000);
    expect(droit.acquisitionDate).toBe("2027-01-15");
  });

  it("ne devient jamais négatif en cas de dépassement", () => {
    expect(computeDroitAcquis(account({ monthsPaid: 24 })).monthsRemaining).toBe(0);
  });
});

describe("conversion de l'épargne en prêt", () => {
  it("exige le droit acquis et l'apport atteint", () => {
    expect(canConvertToHousingLoan(account({ monthsPaid: 12, totalPaid: 2_000_000 }))).toBe(true);
  });

  it("refuse un dossier sans droit acquis", () => {
    expect(canConvertToHousingLoan(account({ monthsPaid: 3, totalPaid: 2_000_000 }))).toBe(false);
  });

  it("refuse un dossier dont l'apport n'est pas atteint", () => {
    expect(canConvertToHousingLoan(account({ monthsPaid: 12, totalPaid: 500_000 }))).toBe(false);
  });

  it("refuse un compte clôturé", () => {
    expect(
      canConvertToHousingLoan(account({ monthsPaid: 12, totalPaid: 2_000_000, closed: true })),
    ).toBe(false);
  });

  it("autorise la clôture ou la prorogation tant que le compte est ouvert", () => {
    expect(canCloseOrExtend(account())).toBe(true);
    expect(canCloseOrExtend(account({ closed: true }))).toBe(false);
  });
});

describe("apport et progression", () => {
  it("compare le cumul versé à l'apport attendu", () => {
    expect(meetsApportTarget(account({ totalPaid: 2_000_000 }), 2_000_000)).toBe(true);
    expect(meetsApportTarget(account({ totalPaid: 1_999_999 }), 2_000_000)).toBe(false);
  });

  it("borne la progression à 100 %", () => {
    expect(savingsProgress(account({ totalPaid: 1_000_000 }))).toBe(50);
    expect(savingsProgress(account({ totalPaid: 3_000_000 }))).toBe(100);
  });

  it("renvoie zéro quand l'apport attendu est nul", () => {
    expect(savingsProgress(account({ targetAmount: 0 }))).toBe(0);
  });
});
