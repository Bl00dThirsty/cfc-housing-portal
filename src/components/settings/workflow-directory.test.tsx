import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { setDocumentStageRolePolicyActionMock, setDocumentStagePhaseActionMock } = vi.hoisted(() => ({
  setDocumentStageRolePolicyActionMock: vi.fn(),
  setDocumentStagePhaseActionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server/actions/admin-workflow", () => ({
  saveWorkflowProcessAction: vi.fn(), saveWorkflowStepAction: vi.fn(), setWorkflowStepOrderAction: vi.fn(),
  setDocumentStageRolePolicyAction: setDocumentStageRolePolicyActionMock,
  setDocumentStagePhaseAction: setDocumentStagePhaseActionMock,
}));

import { WorkflowDirectory } from "@/components/settings/workflow-directory";
import type { DocumentStagePhase, DocumentStageRolePolicy, WorkflowPhase, WorkflowProcess, WorkflowRoleOption, WorkflowStep } from "@/domain/entities/admin-workflow";

const processes: WorkflowProcess[] = [{ code: "CRD", label: "Crédit habitat", family: "realisation", chainOrder: 4, pilots: ["DCR"], priority: "prioritaire", activeStepCount: 2 }];
const phases: WorkflowPhase[] = [{ code: "kyc_savings", label: "Instruction et épargne", sortOrder: 10 }, { code: "risk_bet", label: "Évaluation technique", sortOrder: 20 }];
const steps: WorkflowStep[] = [
  { code: "CRD-01", processCode: "CRD", label: "Analyse initiale", phase: "kyc_savings", lane: "agence", external: false, slaDays: 3, sortOrder: 100 },
  { code: "CRD-04", processCode: "CRD", label: "Étude technique BET", phase: "risk_bet", lane: "partenaires", external: true, slaDays: 10, sortOrder: 400 },
];
const documentStages: DocumentStagePhase[] = [{ stageCode: "CREDIT_FILE", phaseCode: "risk_bet", label: "Instruction et expertise crédit", sortOrder: 30 }];
const documentPolicies: DocumentStageRolePolicy[] = [{ stageCode: "CREDIT_FILE", roleCode: "RISQUES_BET", action: "upload", enabled: true }];
const roles: WorkflowRoleOption[] = [{ code: "RISQUES_BET", label: "Analyste Risques & BET" }];

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

  it("shows persisted document-stage rules and lets workflow admins change them", async () => {
    const user = userEvent.setup();
    setDocumentStageRolePolicyActionMock.mockResolvedValue({ ok: true });
    render(<WorkflowDirectory
      processes={processes}
      steps={steps}
      phases={phases}
      documentStages={documentStages}
      documentPolicies={documentPolicies}
      roles={roles}
    />);
    expect(screen.getByText("Instruction et expertise crédit")).toBeInTheDocument();
    const uploadSwitch = screen.getByRole("switch", { name: "Autoriser Analyste Risques & BET à déposer des pièces pour Instruction et expertise crédit" });
    expect(uploadSwitch).toHaveAttribute("aria-checked", "true");
    await user.click(uploadSwitch);
    expect(setDocumentStageRolePolicyActionMock).toHaveBeenCalledWith({
      stageCode: "CREDIT_FILE", roleCode: "RISQUES_BET", action: "upload", enabled: false,
    });
  });
});
