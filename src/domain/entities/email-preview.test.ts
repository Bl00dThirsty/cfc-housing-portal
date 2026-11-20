import { describe, expect, it } from "vitest";

import { emailPreviewValues } from "@/domain/entities/email-preview";

describe("email template preview values", () => {
  it("uses only operator-entered values and leaves other fields empty", () => {
    expect(
      emailPreviewValues(["prenom", "email"], { prenom: "Valeur saisie" }),
    ).toEqual({ prenom: "Valeur saisie", email: "" });
  });
});
