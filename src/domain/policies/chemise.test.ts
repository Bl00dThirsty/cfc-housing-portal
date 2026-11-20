import { describe, expect, it } from "vitest";
import { canReadChemise, canWriteChemise } from "./chemise";

describe("identity chemise access", () => {
  it("keeps full KYC evidence out of the system administrator view", () => {
    expect(canReadChemise("ADMIN", "C1")).toBe(false);
    expect(canWriteChemise("ADMIN", "C1")).toBe(false);
  });

  it("allows the assigned-manager role to handle C1 subject to dossier scope", () => {
    expect(canReadChemise("GESTIONNAIRE", "C1")).toBe(true);
    expect(canWriteChemise("GESTIONNAIRE", "C1")).toBe(true);
  });

  it("keeps a citizen's access limited to their own C1 documents", () => {
    expect(canReadChemise("CITIZEN", "C1")).toBe(true);
    expect(canReadChemise("CITIZEN", "C2")).toBe(false);
    expect(canWriteChemise("CITIZEN", "C1")).toBe(true);
    expect(canWriteChemise("CITIZEN", "C3")).toBe(false);
  });
});
