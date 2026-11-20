import { describe, expect, it } from "vitest";

import { safeEmailDeliveryPayload } from "./payload";

describe("safeEmailDeliveryPayload", () => {
  it("never persists a one-time invitation, login or recovery URL", () => {
    for (const templateCode of ["STAFF_INVITATION", "MAGIC_LINK", "RESET_PASSWORD"]) {
      expect(safeEmailDeliveryPayload(templateCode, {
        lien: "https://portal.example/auth/confirm?token_hash=secret",
        prenom: "Awa",
        date: "19 novembre 2026",
      })).toEqual({ prenom: "Awa", date: "19 novembre 2026" });
    }
  });

  it("keeps ordinary business-message variables available for audit and retry", () => {
    expect(safeEmailDeliveryPayload("DOCUMENT_REQUESTED", {
      lien: "https://portal.example/portail-client/demandes",
      document: "Titre foncier",
    })).toEqual({
      lien: "https://portal.example/portail-client/demandes",
      document: "Titre foncier",
    });
  });
});
