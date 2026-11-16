import { describe, expect, it } from "vitest";

import {
  advisorForSequence,
  CFC_CLIENT_ANCENNETE_MOIS,
  citizenKycBadge,
  DEMO_ADVISORS,
  missingRequiredFields,
  PRIOR_CLIENT_CASES,
  validateKycProfile,
  validateSignupInput,
  type SignupInput,
} from "@/domain/entities/kyc-profile";
import type { KycProfile } from "@/domain/entities/kyc";

const COMPLETE: KycProfile = {
  identity: {
    birthDate: "1985-04-12",
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
    profession: "Cadre bancaire",
    employer: "CFC",
    sector: "Banque",
    contractType: "CDI",
    hiredAt: "2019-06-01",
    incomeBand: "400 000 – 800 000",
    incomeOrigin: "salaire",
  },
  compliance: {
    politicallyExposed: false,
    pepReason: null,
    businessRelationship: "financement immobilier",
    taxResidence: "Cameroun",
    honourAttestation: true,
    honourMention: "Lu et approuvé",
    acceptedAt: null,
  },
};

describe("parcours — les cas « déjà client »", () => {
  it("propose exactement trois situations, dont une seule éligible", () => {
    expect(PRIOR_CLIENT_CASES).toHaveLength(3);
    expect(PRIOR_CLIENT_CASES.filter((c) => c.eligible)).toHaveLength(1);
  });

  it("exige six mois d'ancienneté CFC", () => {
    expect(CFC_CLIENT_ANCENNETE_MOIS).toBe(6);
  });
});

describe("parcours — les conseillers", () => {
  it("connaît quatre conseillers de démonstration, dont un inactif", () => {
    expect(DEMO_ADVISORS).toHaveLength(4);
    expect(DEMO_ADVISORS.filter((a) => a.active)).toHaveLength(3);
  });

  it("ne s'arrête jamais sur le conseiller inactif", () => {
    for (let index = 0; index < 12; index += 1) {
      expect(advisorForSequence(index).active).toBe(true);
    }
  });
});

describe("parcours — les champs bloquants", () => {
  it("ne signale aucun champ manquant quand le profil est complet", () => {
    expect(missingRequiredFields(COMPLETE)).toEqual([]);
  });

  it("signale la nationalité, le contrat et l'ancienneté", () => {
    const missing = missingRequiredFields({
      ...COMPLETE,
      identity: { ...COMPLETE.identity, nationality: null },
      employment: { ...COMPLETE.employment, contractType: null, hiredAt: null },
    });

    expect(missing).toContain("identity.nationality");
    expect(missing).toContain("employment.contractType");
    expect(missing).toContain("employment.hiredAt");
  });
});

describe("parcours — la validation", () => {
  it("refuse un mineur", () => {
    const result = validateKycProfile({
      ...COMPLETE,
      identity: { ...COMPLETE.identity, birthDate: "2015-01-01" },
    });
    expect(result.ok).toBe(false);
    expect(result.errors["identity.birthDate"]).toBeTruthy();
  });

  it("refuse une pièce d'identité expirée", () => {
    const result = validateKycProfile({
      ...COMPLETE,
      identity: { ...COMPLETE.identity, idDocumentExpiresAt: "2020-01-01" },
    });
    expect(result.errors["identity.idDocumentExpiresAt"]).toBeTruthy();
  });

  it("refuse une date d'embauche future", () => {
    const result = validateKycProfile({
      ...COMPLETE,
      employment: { ...COMPLETE.employment, hiredAt: "2099-01-01" },
    });
    expect(result.errors["employment.hiredAt"]).toBeTruthy();
  });

  it("accepte un profil valide", () => {
    expect(validateKycProfile(COMPLETE)).toEqual({ ok: true, errors: {} });
  });
});

describe("parcours — le badge KYC du citoyen", () => {
  it("projette les états internes sur les quatre valeurs affichées", () => {
    expect(citizenKycBadge("identity_capture")).toBe("incomplet");
    expect(citizenKycBadge("approval_pending")).toBe("soumis");
    expect(citizenKycBadge("approved")).toBe("verifie");
    expect(citizenKycBadge("active")).toBe("verifie");
    expect(citizenKycBadge("blocked")).toBe("rejete");
  });
});

const SIGNUP: SignupInput = {
  accountType: "particulier",
  fullName: "Awa Njoya",
  email: "awa.njoya@example.cm",
  phone: "+237 6 99 00 00 00",
  cniNumber: "AB123456",
  password: "motdepasse2026",
  passwordConfirm: "motdepasse2026",
  consent: true,
};

describe("parcours — l'inscription", () => {
  it("accepte une saisie valide", () => {
    expect(validateSignupInput(SIGNUP)).toEqual({ ok: true, errors: {} });
  });

  it("refuse une confirmation qui diverge", () => {
    const result = validateSignupInput({ ...SIGNUP, passwordConfirm: "autre-mot-de-passe" });

    expect(result.ok).toBe(false);
    expect(result.errors.passwordConfirm).toBeTruthy();
  });

  it("refuse un mot de passe trop court", () => {
    const result = validateSignupInput({ ...SIGNUP, password: "court", passwordConfirm: "court" });

    expect(result.errors.password).toBeTruthy();
  });

  it("refuse un e-mail invalide", () => {
    const result = validateSignupInput({ ...SIGNUP, email: "pas-un-email" });

    expect(result.errors.email).toBeTruthy();
  });

  it("refuse un téléphone invalide", () => {
    const result = validateSignupInput({ ...SIGNUP, phone: "123" });

    expect(result.errors.phone).toBeTruthy();
  });

  it("refuse une CNI invalide", () => {
    const result = validateSignupInput({ ...SIGNUP, cniNumber: "AB" });

    expect(result.errors.cniNumber).toBeTruthy();
  });

  it("refuse un consentement absent", () => {
    const result = validateSignupInput({ ...SIGNUP, consent: false });

    expect(result.errors.consent).toBeTruthy();
  });

  it("refuse un compte entreprise, qui n'est pas ouvert", () => {
    const result = validateSignupInput({ ...SIGNUP, accountType: "entreprise" });

    expect(result.errors.accountType).toBeTruthy();
  });
});
