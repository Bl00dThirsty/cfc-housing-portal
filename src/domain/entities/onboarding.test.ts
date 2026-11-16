import { describe, expect, it } from "vitest";

import {
  EMPTY_DRAFT,
  isAdult,
  isValidCni,
  parseAmount,
  resumeStepId,
  validateStep,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return { ...EMPTY_DRAFT, ...overrides };
}

const validProfile = draft({
  fullName: "ABANDA Eric",
  birthDate: "1988-04-12",
  cniNumber: "AB123456",
  phone: "+237 6 99 00 00 01",
  affiliation: "first_time",
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
  it("accepte un dossier complet", () => {
    expect(validateStep("profile", validProfile).valid).toBe(true);
  });

  it("liste tous les problèmes du dossier d'un coup", () => {
    const result = validateStep("profile", draft());
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
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

  it("attaches each refusal to its field", () => {
    const result = validateStep("profile", draft());

    expect(result.fields.fullName).toBe("Renseignez votre nom complet.");
    expect(result.fields.phone).toBe("Renseignez un numéro de téléphone valide.");
    expect(result.fields.affiliation).toBe("Indiquez votre situation bancaire.");
  });

  it("attaches the address refusal to the address", () => {
    const result = validateStep("profile", draft({ ...validProfile, address: null }));

    expect(result.fields.address).toBe("Renseignez votre adresse de résidence.");
  });
});

describe("resumeStepId", () => {
  it("commence par le dossier", () => {
    expect(resumeStepId(EMPTY_DRAFT)).toBe("profile");
  });

  it("passe au service quand le dossier est posé", () => {
    expect(resumeStepId(validProfile)).toBe("service");
  });

  it("passe aux pièces quand le service est choisi", () => {
    expect(
      resumeStepId(
        draft({ ...validProfile, serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE" }),
      ),
    ).toBe("documents");
  });
});
