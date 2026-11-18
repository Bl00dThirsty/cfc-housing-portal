import { describe, expect, it } from "vitest";

import {
  DEFAULT_PHONE_ISO,
  detectCountryIso,
  digitsOf,
  formatNational,
  formatNationalInput,
  formatPhone,
  isValidPhone,
  toE164,
} from "@/domain/entities/phone";

/**
 * Le téléphone — les règles pures.
 *
 * Les plans de numérotation sont ceux de `libphonenumber-js` : ces tests
 * vérifient que le module les **applique** correctement, et non qu'il les
 * réécrit. Ce que l'utilisateur ne doit pas subir : un numéro collé depuis
 * un autre appareil doit rester lisible, un numéro national doit être stocké
 * dans une forme unique, et un numéro faux doit être refusé — pas enregistré
 * quand même.
 */

describe("digitsOf", () => {
  it("ne garde que les chiffres", () => {
    expect(digitsOf("+237 6 99 00 00 01")).toBe("237699000001");
  });

  it("accepte une saisie vide", () => {
    expect(digitsOf("")).toBe("");
  });
});

describe("toE164", () => {
  it("préfixe le numéro national camerounais", () => {
    expect(toE164("699000001")).toBe("+237699000001");
    expect(toE164("6 99 00 00 01")).toBe("+237699000001");
  });

  it("nettoie un numéro déjà international", () => {
    expect(toE164("+237 6 99 00 00 01")).toBe("+237699000001");
  });

  it("retire le préfixe local d'un numéro français", () => {
    expect(toE164("06 12 34 56 78", "FR")).toBe("+33612345678");
  });

  it("conserve le zéro d'un numéro ivoirien", () => {
    expect(toE164("07 07 07 07 07", "CI")).toBe("+2250707070707");
  });

  it("ne rend rien d'une saisie illisible", () => {
    expect(toE164("")).toBe("");
    expect(toE164("pas un numéro")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("accepte un mobile camerounais", () => {
    expect(isValidPhone("699000001")).toBe(true);
    expect(isValidPhone("+237 6 99 00 00 01")).toBe(true);
  });

  it("accepte une fixe camerounaise", () => {
    expect(isValidPhone("233 42 11 22")).toBe(true);
  });

  it("accepte un numéro français", () => {
    expect(isValidPhone("+33 6 12 34 56 78")).toBe(true);
    expect(isValidPhone("06 12 34 56 78", "FR")).toBe(true);
  });

  it("refuse un numéro trop court ou trop long", () => {
    expect(isValidPhone("69900")).toBe(false);
    expect(isValidPhone("6990000012")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });

  it("refuse un préfixe qui n'existe pas dans le plan", () => {
    expect(isValidPhone("+237 5 00 00 00 01")).toBe(false);
  });

  it("refuse un numéro national qui n'appartient pas au pays attendu", () => {
    // « 06 12 34 56 78 » n'est pas un plan camerounais.
    expect(isValidPhone("06 12 34 56 78", "CM")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("regroupe les chiffres du numéro international", () => {
    expect(formatPhone("+237699000001")).toBe("+237 6 99 00 00 01");
    expect(formatPhone("+33612345678")).toBe("+33 6 12 34 56 78");
    expect(formatPhone("+12025550143")).toBe("+1 202 555 0143");
  });

  it("rend une saisie vide", () => {
    expect(formatPhone("")).toBe("");
  });
});

describe("formatNational", () => {
  it("rend le numéro dans la forme du pays", () => {
    expect(formatNational("+237699000001")).toBe("6 99 00 00 01");
    expect(formatNational("+33612345678", "FR")).toBe("06 12 34 56 78");
  });
});

describe("formatNationalInput", () => {
  it("regroupe la saisie au fil de la frappe", () => {
    const result = formatNationalInput("699000001");

    expect(result.display).toBe("6 99 00 00 01");
    expect(result.iso).toBe(DEFAULT_PHONE_ISO);
  });

  it("reconnaît un indicatif collé et retire l'indicatif", () => {
    const result = formatNationalInput("+237 6 99 00 00 01");

    expect(result.display).toBe("6 99 00 00 01");
    expect(result.iso).toBe("CM");
  });

  it("bascule sur le pays d'un numéro étranger collé", () => {
    const result = formatNationalInput("+33 6 12 34 56 78");

    expect(result.iso).toBe("FR");
    expect(result.display).toBe("06 12 34 56 78");
  });

  it("conserve la frappe au-delà du plan, mais le numéro reste invalide", () => {
    const result = formatNationalInput("699000001999");

    // La saisie n'est jamais tronquée sous les yeux de l'utilisateur…
    expect(result.display).toBe("699000001999");
    // …mais un numéro hors plan n'est pas un numéro.
    expect(isValidPhone("699000001999")).toBe(false);
    expect(toE164("699000001999")).toBe("");
  });
});

describe("detectCountryIso", () => {
  it("reconnaît les indicatifs les plus longs d'abord", () => {
    expect(detectCountryIso("+2250707070707")).toBe("CI");
    expect(detectCountryIso("+237699000001")).toBe("CM");
    expect(detectCountryIso("+2348031234567")).toBe("NG");
  });
});
