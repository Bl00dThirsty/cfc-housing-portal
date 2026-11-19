import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server/actions/admin-workflow", () => ({ saveWorkflowProcessAction: vi.fn(), saveWorkflowStepAction: vi.fn(), setWorkflowStepOrderAction: vi.fn() }));

import { WorkflowDirectory } from "@/components/settings/workflow-directory";
import type { WorkflowPhase, WorkflowProcess, WorkflowStep } from "@/domain/entities/admin-workflow";

const processes: WorkflowProcess[] = [{ code: "CRD", label: "Crédit habitat", family: "realisation", chainOrder: 4, pilots: ["DCR"], priority: "prioritaire", activeStepCount: 2 }];
const phases: WorkflowPhase[] = [{ code: "kyc_savings", label: "Instruction et épargne", sortOrder: 10 }, { code: "risk_bet", label: "Évaluation technique", sortOrder: 20 }];
const steps: WorkflowStep[] = [
  { code: "CRD-01", processCode: "CRD", label: "Analyse initiale", phase: "kyc_savings", lane: "agence", external: false, slaDays: 3, sortOrder: 100 },
  { code: "CRD-04", processCode: "CRD", label: "Étude technique BET", phase: "risk_bet", lane: "partenaires", external: true, slaDays: 10, sortOrder: 400 },
];

describe("admin workflow directory", () => {
  it("keeps step search results when switching view modes", async () => {
    const user = userEvent.setup();
    render(<WorkflowDirectory processes={processes} steps={steps} phases={phases} />);
    await user.type(screen.getByRole("textbox", { name: "Rechercher les étapes" }), "bet");
    expect(screen.getByText("Étude technique BET")).toBeInTheDocument();
    expect(screen.queryByText("Analyse initiale")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vue en grille" }));
    expect(screen.getByText("Étude technique BET")).toBeInTheDocument();
    expect(screen.queryByText("Analyse initiale")).not.toBeInTheDocument();
  });
});
