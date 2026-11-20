import { describe, expect, it } from "vitest";
import { filterWorkflowSteps, type WorkflowStep } from "@/domain/entities/admin-workflow";

const steps: WorkflowStep[] = [
  { code: "CRD-01", processCode: "CRD", label: "Entretien et analyse", phase: "kyc_savings", lane: "agence", external: false, slaDays: 3, sortOrder: 100 },
  { code: "CRD-04", processCode: "CRD", label: "Étude technique BET", phase: "risk_bet", lane: "partenaires", external: true, slaDays: 10, sortOrder: 400 },
];

describe("filterWorkflowSteps", () => {
  it("combines phase, process and text filters", () => {
    expect(filterWorkflowSteps(steps, { processCode: "CRD", phase: "risk_bet", query: "bet" }).map((step) => step.code)).toEqual(["CRD-04"]);
    expect(filterWorkflowSteps(steps, { phase: "committees" })).toEqual([]);
  });

  it("can isolate steps without a phase", () => {
    expect(filterWorkflowSteps([{ ...steps[0], phase: null }, ...steps], { phase: "unassigned" })).toHaveLength(1);
  });
});
