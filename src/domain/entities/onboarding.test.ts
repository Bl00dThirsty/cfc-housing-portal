import { describe, expect, it } from "vitest";

import {
  EMPTY_DRAFT,
  EMPTY_KYC_PROFILE,
  parseAmount,
  resumeStepId,
  validateStep,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";
import type { KycProfile } from "@/domain/entities/kyc";

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return { ...EMPTY_DRAFT, ...overrides };
}

/** Un profil complet : il ne manque rien. */
const COMPLETE_PROFILE: KycProfile = {
  identity: {
    birthDate: "1988-04-12",
    birthPlaceCity: "Douala",
    birthPlaceCountry: "Cameroun",
    nationality: "Cameroun",
    familyStatus: "marié(e)",
    idDocumentType: "CNI",
    idDocumentNumber: "AB123456",
    idDocumentIssuedAt: "2020-01-10",
    idDocumentExpiresAt: "2030-01-09",
    idDocumentIssuer: "Délégation",
    niu: "NIU-001",
  },
  residence: {
    country: "Cameroun",
    region: "Littoral",
    city: "Douala",
    neighbourhood: "Bonanjo",
    landmark: "Face pharmacie du Port",
    postalBox: null,
    occupationStatus: "propriétaire",
    emergencyContact: null,
  },
  employment: {
    status: "CDI",
    profession: "Ingénieur",
    employer: "SIC",
    sector: "BTP",
    contractType: "CDI",
    hiredAt: "2019-06-01",
    incomeBand: "800 000 – 1 500 000",
    incomeOrigin: "salaire",
    declaredIncome: 850000,
  },
  compliance: {
    politicallyExposed: false,
    pepReason: null,
    businessRelationship: "financement immobilier",
    taxResidence: "Cameroun",
    honourAttestation: true,
    honourMention: "Lu et approuvé",
    acceptedAt: null,
    dependants: 2,
    existingLoans: null,
  },
};

const validProfile = draft({
  fullName: "ABANDA Eric",
  phone: "+237 6 99 00 00 01",
  affiliation: "first_time",
  profile: COMPLETE_PROFILE,
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
    expect(validateStep("kyc", validProfile).valid).toBe(true);
  });

  it("liste tous les problèmes du dossier d'un coup", () => {
    const result = validateStep("kyc", draft());

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("exige un service", () => {
    expect(validateStep("service", draft()).valid).toBe(false);
    expect(
      validateStep("service", draft({ serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE" }))
        .valid,
    ).toBe(true);
  });

  it("refuse un profil sans ville de résidence déclarée", () => {
    const result = validateStep(
      "kyc",
      draft({
        ...validProfile,
        profile: {
          ...COMPLETE_PROFILE,
          residence: { ...COMPLETE_PROFILE.residence, city: null },
        },
      }),
    );

    expect(result.valid).toBe(false);
  });

  it("refuse un profil sans revenu déclaré", () => {
    const result = validateStep(
      "kyc",
      draft({
        ...validProfile,
        profile: {
          ...COMPLETE_PROFILE,
          employment: { ...COMPLETE_PROFILE.employment, declaredIncome: null },
        },
      }),
    );

    expect(result.valid).toBe(false);
  });

  it("refuse un mineur dans le profil", () => {
    const result = validateStep(
      "kyc",
      draft({
        ...validProfile,
        profile: {
          ...COMPLETE_PROFILE,
          identity: { ...COMPLETE_PROFILE.identity, birthDate: "2015-01-01" },
        },
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.fields["identity.birthDate"]).toBeTruthy();
  });

  it("accepte toujours l'étape des pièces", () => {
    expect(validateStep("documents", draft()).valid).toBe(true);
  });

  it("attache chaque refus à son champ", () => {
    const result = validateStep("kyc", draft());

    expect(result.fields.phone).toBe("Renseignez un numéro de téléphone valide.");
    expect(result.fields.affiliation).toBe("Indiquez votre situation bancaire.");
    expect(result.fields["identity.nationality"]).toBe("Ce champ est obligatoire.");
  });
});

describe("resumeStepId", () => {
  it("commence par le dossier", () => {
    expect(resumeStepId(EMPTY_DRAFT)).toBe("kyc");
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

describe("le profil vide", () => {
  it("ne vaut aucun champ", () => {
    expect(
      Object.values(EMPTY_KYC_PROFILE.identity).every((value) => value === null),
    ).toBe(true);
    expect(EMPTY_KYC_PROFILE.compliance.politicallyExposed).toBe(false);
    expect(EMPTY_KYC_PROFILE.compliance.dependants).toBe(0);
  });
});
