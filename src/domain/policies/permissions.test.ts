import { describe, expect, it } from "vitest";

import { hasCapability } from "./permissions";
import { isStaffRole } from "./capabilities";

describe("permissions d’administration des e-mails", () => {
  it("sépare la gestion des messages du paramétrage du catalogue", () => {
    expect(hasCapability("ADMIN", "email:read")).toBe(true);
    expect(hasCapability("ADMIN", "email:send")).toBe(true);
    expect(hasCapability("ADMIN", "email:manage")).toBe(true);
    expect(hasCapability("GESTIONNAIRE", "email:manage")).toBe(false);
  });

  it("uses the database grant set when a role has live permissions", () => {
    expect(
      hasCapability("GUICHET", "savings:reverse", ["savings:reverse"]),
    ).toBe(true);
    expect(
      hasCapability("GESTIONNAIRE", "dossier:create", ["dossier:read"]),
    ).toBe(false);
  });

  it("recognizes the specialist roles stored by the database role catalogue", () => {
    expect(isStaffRole("ANALYSTE")).toBe(true);
    expect(isStaffRole("PMO")).toBe(true);
    expect(isStaffRole("RECOUVREMENT")).toBe(true);
    expect(isStaffRole("ARCHIVISTE")).toBe(true);
    expect(isStaffRole("AUDIT")).toBe(true);
    expect(isStaffRole("CITIZEN")).toBe(false);
  });
});
