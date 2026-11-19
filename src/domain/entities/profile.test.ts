import { describe, expect, it } from "vitest";

import { validateOwnProfileInput } from "./profile";

describe("validateOwnProfileInput", () => {
  it("trims a valid display name and normalizes a Cameroon phone number", () => {
    expect(
      validateOwnProfileInput({ fullName: "  Awa Njoya  ", phone: "6 99 00 00 01" }),
    ).toEqual({ ok: true, value: { fullName: "Awa Njoya", phone: "+237699000001" } });
  });

  it("allows an empty contact phone to clear it", () => {
    expect(validateOwnProfileInput({ fullName: "Awa Njoya", phone: "" })).toEqual({
      ok: true,
      value: { fullName: "Awa Njoya", phone: null },
    });
  });

  it("rejects empty or unreasonably long names and invalid phone numbers", () => {
    expect(validateOwnProfileInput({ fullName: "  ", phone: "699" })).toMatchObject({
      ok: false,
      errors: {
        fullName: "Renseignez un nom de 2 à 160 caractères.",
        phone: "Renseignez un numéro de téléphone valide ou laissez le champ vide.",
      },
    });

    expect(validateOwnProfileInput({ fullName: "A".repeat(161), phone: "" })).toMatchObject({
      ok: false,
      errors: { fullName: "Renseignez un nom de 2 à 160 caractères." },
    });
  });
});
