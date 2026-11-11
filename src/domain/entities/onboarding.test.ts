import { describe, expect, it } from "vitest";

import {
  EMPTY_DRAFT,
  isAdult,
  isValidCameroonPhone,
  isValidCni,
  isValidEmail,
  normalisePhone,
  parseAmount,
  validateStep,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return { ...EMPTY_DRAFT, ...overrides };
}

const validAccount = draft({
  email: "abanda.eric@cfc.cm",
  phone: "+237 6 99 00 00 01",
  affiliation: "first_time",
});

const validProfile = draft({
  fullName: "ABANDA Eric",
  birthDate: "1988-04-12",
  cniNumber: "AB123456",
  address: {
    placeId: "1",
    label: "Akwa, Douala, Cameroun",
    shortLabel: "Akwa, Douala",
    kind: "neighbourhood",
    lat: 4.05,
    lon: 9.7,
    osmType: "node",
    osmId: "1",
    postcode: null,
    countryCode: "cm",
    source: "nominatim",
  },
  monthlyIncome: "850 000",
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("abanda.eric@cfc.cm")).toBe(true);
  });

  it("rejects an address without a domain", () => {
    expect(isValidEmail("abanda.eric")).toBe(false);
    expect(isValidEmail("abanda.eric@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidCameroonPhone", () => {
  it("accepts the local and the international form", () => {
    expect(isValidCameroonPhone("+237 6 99 00 00 01")).toBe(true);
    expect(isValidCameroonPhone("699000001")).toBe(true);
    expect(isValidCameroonPhone("237699000001")).toBe(true);
  });

  it("rejects a foreign or malformed number", () => {
    expect(isValidCameroonPhone("+33 6 12 34 56 78")).toBe(false);
    expect(isValidCameroonPhone("69900")).toBe(false);
    expect(isValidCameroonPhone("")).toBe(false);
  });
});

describe("normalisePhone", () => {
  it("prefixes the Cameroonian code", () => {
    expect(normalisePhone("699000001")).toBe("+237 699000001");
  });

  it("keeps an already normalised number", () => {
    expect(normalisePhone("+237 6 99 00 00 01")).toBe("+237 6 99 00 00 01");
  });
});

describe("isValidCni", () => {
  it("accepts a plausible identifier", () => {
    expect(isValidCni("AB123456")).toBe(true);
  });

  it("rejects a too short or too long identifier", () => {
    expect(isValidCni("AB12")).toBe(false);
    expect(isValidCni("A".repeat(21))).toBe(false);
  });
});

describe("isAdult", () => {
  const reference = new Date("2026-11-11");

  it("accepts an adult", () => {
    expect(isAdult("1988-04-12", reference)).toBe(true);
  });

  it("rejects a minor", () => {
    expect(isAdult("2015-01-01", reference)).toBe(false);
  });

  it("refuses the day before the eighteenth birthday", () => {
    expect(isAdult("2008-11-12", reference)).toBe(false);
    expect(isAdult("2008-11-11", reference)).toBe(true);
  });

  it("rejects an empty or invalid date", () => {
    expect(isAdult("", reference)).toBe(false);
    expect(isAdult("not-a-date", reference)).toBe(false);
  });
});

describe("parseAmount", () => {
  it("reads a formatted amount", () => {
    expect(parseAmount("850 000")).toBe(850000);
  });

  it("returns zero for an empty value", () => {
    expect(parseAmount("")).toBe(0);
  });
});

describe("validateStep", () => {
  it("accepts a complete account step", () => {
    expect(validateStep("account", validAccount).valid).toBe(true);
  });

  it("lists every account problem at once", () => {
    const result = validateStep("account", draft());
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it("requires a service", () => {
    expect(validateStep("service", draft()).valid).toBe(false);
    expect(
      validateStep("service", draft({ serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE" }))
        .valid,
    ).toBe(true);
  });

  it("accepts a complete profile", () => {
    expect(validateStep("profile", validProfile).valid).toBe(true);
  });

  it("rejects a profile without an address", () => {
    const result = validateStep("profile", draft({ ...validProfile, address: null }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Renseignez votre adresse de résidence.");
  });

  it("rejects a profile without income", () => {
    const result = validateStep("profile", draft({ ...validProfile, monthlyIncome: "" }));
    expect(result.valid).toBe(false);
  });

  it("rejects a minor in the profile", () => {
    const result = validateStep("profile", draft({ ...validProfile, birthDate: "2015-01-01" }));
    expect(result.valid).toBe(false);
  });

  it("always accepts the documents step", () => {
    expect(validateStep("documents", draft()).valid).toBe(true);
  });
});
