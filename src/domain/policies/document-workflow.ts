import type { Capability, Role } from "./capabilities";

export type DocumentDecisionAction = "validate" | "reject";

export interface DocumentWorkflowRequirement {
  serviceCode: string;
  stageCode: string;
  docTypeCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  deletedAt: string | null;
}

export interface DocumentStageRolePolicy {
  stageCode: string;
  roleCode: string;
  action: DocumentDecisionAction;
  enabled: boolean;
  deletedAt: string | null;
}

export interface DocumentDecisionContext {
  role: Role;
  capabilities: readonly Capability[];
  documentStatus: string;
  chemiseCode: string;
  documentTypeChemiseCode: string | null;
  documentTypeCode: string;
  dossierServiceCode: string | null;
  currentPhaseCode: string | null;
  dossierInScope: boolean;
  today: string;
  stages: readonly { stageCode: string; phaseCode: string }[];
  requirements: readonly DocumentWorkflowRequirement[];
  policies: readonly DocumentStageRolePolicy[];
}

export interface DocumentDecisionOptions {
  canValidate: boolean;
  canReject: boolean;
}

const NO_DECISIONS: DocumentDecisionOptions = {
  canValidate: false,
  canReject: false,
};

const ACTION_CAPABILITY: Record<DocumentDecisionAction, Capability> = {
  validate: "document:validate",
  reject: "document:reject",
};

/**
 * Resolve the actions to display from the same persisted stage, service,
 * document, and role-policy facts that the database decision RPC enforces.
 * The RPC remains authoritative when any of these facts change after read.
 */
export function resolveDocumentDecisionOptions(
  context: DocumentDecisionContext,
): DocumentDecisionOptions {
  if (
    !context.dossierInScope ||
    !["uploaded", "under_review"].includes(context.documentStatus) ||
    !context.documentTypeCode ||
    !context.dossierServiceCode ||
    !context.currentPhaseCode ||
    !context.documentTypeChemiseCode ||
    context.documentTypeChemiseCode !== context.chemiseCode
  ) {
    return NO_DECISIONS;
  }

  if (context.chemiseCode === "C1" && context.role !== "GESTIONNAIRE") {
    return NO_DECISIONS;
  }

  const activeStageCodes = new Set(
    context.stages
      .filter((stage) => stage.phaseCode === context.currentPhaseCode)
      .map((stage) => stage.stageCode),
  );

  const eligibleStageCodes = new Set(
    context.requirements
      .filter((requirement) =>
        requirement.serviceCode === context.dossierServiceCode &&
        requirement.docTypeCode === context.documentTypeCode &&
        activeStageCodes.has(requirement.stageCode) &&
        requirement.effectiveFrom <= context.today &&
        (requirement.effectiveTo === null || requirement.effectiveTo >= context.today) &&
        requirement.deletedAt === null,
      )
      .map((requirement) => requirement.stageCode),
  );

  if (eligibleStageCodes.size === 0) return NO_DECISIONS;

  const isAllowed = (action: DocumentDecisionAction) =>
    context.capabilities.includes(ACTION_CAPABILITY[action]) &&
    context.policies.some((policy) =>
      policy.action === action &&
      policy.roleCode === context.role &&
      policy.enabled &&
      policy.deletedAt === null &&
      eligibleStageCodes.has(policy.stageCode),
    );

  return {
    canValidate: isAllowed("validate"),
    canReject: isAllowed("reject"),
  };
}
