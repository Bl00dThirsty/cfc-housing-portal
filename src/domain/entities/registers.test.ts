import { describe, expect, it } from "vitest";

import { REGISTER_KEYS, REGISTER_LABELS, validateRegisterInput } from "./registers";

describe("register taxonomy", () => {
  it("exposes exactly the five stub domains", () => {
    expect(REGISTER_KEYS).toEqual([
      "promoters",
      "bet-experts",
      "notary-offices",
      "subsidies",
      "recovery",
    ]);
  });

  it("has a French label for every register", () => {
    for (const key of REGISTER_KEYS) {
      expect(REGISTER_LABELS[key].title.length).toBeGreaterThan(3);
    }
  });

  it("rejects a short label and accepts a valid promoter", () => {
    const bad = validateRegisterInput("promoters", { label: "A" });
    expect(bad.ok).toBe(false);
    const good = validateRegisterInput("promoters", {
      label: "Promotion Saint-Paul",
      region: "Centre",
      status: "active",
    });
    expect(good.ok).toBe(true);
  });
});
