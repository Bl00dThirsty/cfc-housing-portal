import { describe, expect, it } from "vitest";

import {
  actorRoleLabel,
  eventLabel,
  factKey,
} from "@/domain/entities/processes";

describe("libellés des événements du dossier", () => {
  it("restitue le libellé fonctionnel d'un événement connu", () => {
    expect(eventLabel("KYC_APPROVED")).toBe("Décision KYC approuvée");
  });

  it("conserve un libellé lisible pour un événement inconnu", () => {
    expect(eventLabel("new.workflow_event")).toBe("new workflow event");
  });

  it("déduplique un fait selon son document et son destinataire", () => {
    const first = factKey({
      eventType: "DOCUMENT_REQUESTED",
      dossierId: "dossier-a",
      recipientUserId: "user-a",
      payload: { doc_type_code: "CNI" },
    });
    const otherDocument = factKey({
      eventType: "DOCUMENT_REQUESTED",
      dossierId: "dossier-a",
      recipientUserId: "user-a",
      payload: { doc_type_code: "PLAN" },
    });
    const otherRecipient = factKey({
      eventType: "DOCUMENT_REQUESTED",
      dossierId: "dossier-a",
      recipientUserId: "user-b",
      payload: { doc_type_code: "CNI" },
    });

    expect(first).not.toBe(otherDocument);
    expect(first).not.toBe(otherRecipient);
  });
});

describe("rôle dans le journal", () => {
  it("traduit un rôle connu", () => {
    expect(actorRoleLabel("GESTIONNAIRE")).toBe("Gestionnaire");
  });

  it("ne devine pas un rôle inconnu", () => {
    expect(actorRoleLabel("ROLE_INCONNU")).toBe("Acteur");
  });
});
