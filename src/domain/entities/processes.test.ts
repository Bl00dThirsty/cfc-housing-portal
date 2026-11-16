import { describe, expect, it } from "vitest";

import {
  CREDIT_PROCESS_STEPS,
  PROCESSES,
  PROCESS_PHASE_LABELS,
  PROCESS_RUPTURES,
  RECOVERY_PROCESS_STEPS,
  SAVINGS_PROCESS_STEPS,
  processByCode,
  stepByCode,
  stepsForPhase,
  type CreditPhase,
} from "@/domain/entities/processes";

const PHASES: CreditPhase[] = [
  "kyc_savings",
  "risk_bet",
  "committees",
  "notary_mortgage",
  "disbursements",
  "closing_release",
];

describe("cartographie des processus", () => {
  it("couvre les six processus prioritaires de la mission", () => {
    const prioritaires = PROCESSES.filter((p) => p.priority === "prioritaire").map((p) => p.code);
    expect(prioritaires.sort()).toEqual(["ARC", "CPT", "CRD", "GAR", "REC"]);
  });

  it("place la chaîne de valeur client dans l'ordre de la cartographie", () => {
    const chain = PROCESSES.filter((p) => p.chainOrder !== null)
      .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0))
      .map((p) => p.code);
    expect(chain).toEqual(["ACC", "CLT", "CPT", "CRD", "GAR", "REC"]);
  });

  it("rattache le recouvrement à la DRAC", () => {
    expect(processByCode("REC")?.pilote).toContain("DRAC");
  });

  it("rattache l'archivage à la SDI et à la SDPA", () => {
    expect(processByCode("ARC")?.pilote).toEqual(["SDPA", "SDI"]);
  });

  it("rattache le crédit à la DCR", () => {
    expect(processByCode("CRD")?.pilote).toEqual(["DCR"]);
  });
});

describe("étapes du circuit de crédit", () => {
  it("couvre les treize procédures du diagramme en couloirs", () => {
    expect(CREDIT_PROCESS_STEPS).toHaveLength(13);
  });

  it("respecte l'ordre des codes de procédure", () => {
    const codes = CREDIT_PROCESS_STEPS.map((step) => step.code);
    expect(codes).toEqual([
      "CRD-01", "CRD-02", "CRD-03", "CRD-04", "CRD-06", "CRD-07", "CRD-08",
      "CRD-09", "CRD-10", "GAR-01", "CRD-11", "CRD-12", "CRD-13",
    ]);
  });

  it("rattache le BET à une étape externe", () => {
    const bet = stepByCode("CRD-04");
    expect(bet?.external).toBe(true);
    expect(bet?.lane).toBe("partenaires");
  });

  it("rattache les garanties au notaire et à la conservation foncière", () => {
    const garanties = stepByCode("GAR-01");
    expect(garanties?.external).toBe(true);
    expect(garanties?.phase).toBe("notary_mortgage");
  });

  it("place la décision d'octroi dans la phase comités", () => {
    expect(stepByCode("CRD-08")?.phase).toBe("committees");
  });

  it("place les déblocages dans la phase disbursements", () => {
    expect(stepByCode("CRD-12")?.phase).toBe("disbursements");
    expect(stepByCode("CRD-13")?.phase).toBe("disbursements");
  });

  it("donne au moins une étape à chaque phase du circuit", () => {
    for (const phase of PHASES) {
      expect(stepsForPhase(phase).length).toBeGreaterThan(0);
      expect(PROCESS_PHASE_LABELS[phase].length).toBeGreaterThan(3);
    }
  });
});

describe("circuit de recouvrement", () => {
  it("couvre les douze procédures plus la mainlevée", () => {
    const codes = RECOVERY_PROCESS_STEPS.map((step) => step.code);
    expect(codes).toContain("REC-01");
    expect(codes).toContain("REC-12");
    expect(codes).toContain("REC-05");
    expect(codes).toContain("GAR-05");
  });

  it("place l'ATD et le prélèvement automatique côté partenaires", () => {
    const atd = RECOVERY_PROCESS_STEPS.find((step) => step.code === "REC-12");
    expect(atd?.external).toBe(true);
    expect(atd?.lane).toBe("partenaires");
  });

  it("déclare la créance à la Centrale des risques du côté BEAC", () => {
    const centrale = RECOVERY_PROCESS_STEPS.find((step) => step.code === "REC-05");
    expect(centrale?.external).toBe(true);
  });
});

describe("circuit de l'épargne-logement", () => {
  it("ouvre le compte avec un carnet A ou B", () => {
    const ouverture = SAVINGS_PROCESS_STEPS.find((step) => step.code === "CLT-04");
    expect(ouverture?.label).toMatch(/carnet A ou B/);
  });

  it("conditionne les droits acquis à une période d'un an", () => {
    const remuneration = SAVINGS_PROCESS_STEPS.find((step) => step.code === "OPE-02");
    expect(remuneration?.label).toMatch(/≥ 1 an/);
  });
});

describe("points de rupture", () => {
  it("documente les quatre irritants de l'épargne-logement", () => {
    const epargne = PROCESS_RUPTURES.filter((r) => r.code.startsWith("CPT-"));
    expect(epargne).toHaveLength(4);
    expect(epargne.some((r) => r.label.includes("1987"))).toBe(true);
  });

  it("documente les six irritants du crédit", () => {
    expect(PROCESS_RUPTURES.filter((r) => r.code.startsWith("CRD-"))).toHaveLength(6);
  });

  it("associe un levier d'amélioration à chaque rupture", () => {
    for (const rupture of PROCESS_RUPTURES) {
      expect(rupture.lever.length).toBeGreaterThan(5);
    }
  });
});
