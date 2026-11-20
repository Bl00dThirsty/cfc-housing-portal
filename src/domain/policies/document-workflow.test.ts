import { describe, expect, it } from "vitest";

import { resolveDocumentDecisionOptions } from "./document-workflow";

const validContext = {
  role: "RISQUES_BET" as const,
  capabilities: ["document:validate", "document:reject"] as const,
  documentStatus: "uploaded",
  chemiseCode: "C2",
  documentTypeChemiseCode: "C2",
  documentTypeCode: "PLAN_ARCHI",
  dossierServiceCode: "CREDIT_IMMOBILIER",
  currentPhaseCode: "TECHNIQUE",
  dossierInScope: true,
  today: "2026-11-20",
  stages: [{ stageCode: "BET_REVIEW", phaseCode: "TECHNIQUE" }],
  requirements: [{
    serviceCode: "CREDIT_IMMOBILIER",
    stageCode: "BET_REVIEW",
    docTypeCode: "PLAN_ARCHI",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    deletedAt: null,
  }],
  policies: [
    { stageCode: "BET_REVIEW", roleCode: "RISQUES_BET", action: "validate" as const, enabled: true, deletedAt: null },
    { stageCode: "BET_REVIEW", roleCode: "RISQUES_BET", action: "reject" as const, enabled: true, deletedAt: null },
  ],
};

describe("resolveDocumentDecisionOptions", () => {
  it("exposes only decisions granted for the document's active service stage", () => {
    const options = resolveDocumentDecisionOptions({
      ...validContext,
      policies: [validContext.policies[0]],
    });

    expect(options).toEqual({ canValidate: true, canReject: false });
  });

  it("hides decisions when the document is outside the active stage or dossier scope", () => {
    expect(resolveDocumentDecisionOptions({
      ...validContext,
      currentPhaseCode: "NOTARY",
    })).toEqual({ canValidate: false, canReject: false });

    expect(resolveDocumentDecisionOptions({
      ...validContext,
      dossierInScope: false,
    })).toEqual({ canValidate: false, canReject: false });
  });

  it("requires the persisted capability as well as the matching enabled stage policy", () => {
    expect(resolveDocumentDecisionOptions({
      ...validContext,
      capabilities: ["document:validate"],
    })).toEqual({ canValidate: true, canReject: false });

    expect(resolveDocumentDecisionOptions({
      ...validContext,
      capabilities: [],
    })).toEqual({ canValidate: false, canReject: false });
  });

  it("reserves KYC document decisions for the assigned manager scope", () => {
    expect(resolveDocumentDecisionOptions({
      ...validContext,
      role: "ADMIN",
      chemiseCode: "C1",
      documentTypeChemiseCode: "C1",
      documentTypeCode: "CNI",
      requirements: [{
        serviceCode: "CREDIT_IMMOBILIER",
        stageCode: "BET_REVIEW",
        docTypeCode: "CNI",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
        deletedAt: null,
      }],
      policies: [
        { stageCode: "BET_REVIEW", roleCode: "ADMIN", action: "validate", enabled: true, deletedAt: null },
        { stageCode: "BET_REVIEW", roleCode: "ADMIN", action: "reject", enabled: true, deletedAt: null },
      ],
    })).toEqual({ canValidate: false, canReject: false });
  });

  it("does not offer decisions for completed, expired, or superseded policy rows", () => {
    expect(resolveDocumentDecisionOptions({
      ...validContext,
      documentStatus: "validated",
    })).toEqual({ canValidate: false, canReject: false });

    expect(resolveDocumentDecisionOptions({
      ...validContext,
      requirements: [{ ...validContext.requirements[0], effectiveTo: "2026-11-19" }],
    })).toEqual({ canValidate: false, canReject: false });
  });
});
