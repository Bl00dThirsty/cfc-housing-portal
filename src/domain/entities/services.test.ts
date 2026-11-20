import { describe, expect, it } from "vitest";

import {
  checklistStatusFor,
  markProvidedDocuments,
  type ChecklistItem,
} from "@/domain/entities/services";

function piece(docTypeCode: string, status: ChecklistItem["status"]): ChecklistItem {
  return {
    docTypeCode,
    documentId: null,
    label: docTypeCode,
    natureLabel: "Identité",
    issuingAuthority: null,
    required: true,
    stage: "ONBOARDING",
    stageLabel: "À l'inscription",
    status,
    uploadedAt: null,
  };
}

describe("l'état d'une pièce", () => {
  it("traduit les états techniques en états de checklist", () => {
    expect(checklistStatusFor("verified")).toBe("verified");
    expect(checklistStatusFor("in_review")).toBe("in_review");
    expect(checklistStatusFor("uploaded")).toBe("uploaded");
    expect(checklistStatusFor("rejected")).toBe("rejected");
    expect(checklistStatusFor(null)).toBe("missing");
  });
});

describe("les pièces déjà fournies", () => {
  it("marque « déjà fournie » une pièce fournie au KYC", () => {
    const marked = markProvidedDocuments(
      [piece("CNI_BIOMETRIQUE", "missing"), piece("BANK_RIB", "missing")],
      ["CNI_BIOMETRIQUE"],
    );

    expect(marked[0].status).toBe("deja_fournie");
    expect(marked[1].status).toBe("missing");
  });

  it("ne touche pas une pièce déjà dans un autre état", () => {
    const marked = markProvidedDocuments([piece("PAYSLIP", "uploaded")], ["PAYSLIP"]);

    expect(marked[0].status).toBe("uploaded");
  });

  it("ne demande jamais deux fois la même pièce", () => {
    const requirements = [piece("CNI_BIOMETRIQUE", "missing")];
    const marked = markProvidedDocuments(requirements, ["CNI_BIOMETRIQUE"]);

    expect(marked.filter((item) => item.status === "missing")).toHaveLength(0);
  });
});
