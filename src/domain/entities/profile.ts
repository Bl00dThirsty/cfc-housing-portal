import { isValidPhone, toE164 } from "./phone";

export type OwnProfileInput = {
  fullName: string;
  phone: string;
};

export type ValidOwnProfile = {
  fullName: string;
  phone: string | null;
};

export type OwnProfileValidation =
  | { ok: true; value: ValidOwnProfile }
  | { ok: false; errors: Partial<Record<keyof OwnProfileInput, string>> };

/** Validate only the contact fields users may maintain from their own profile. */
export function validateOwnProfileInput(input: OwnProfileInput): OwnProfileValidation {
  const fullName = input.fullName.trim();
  const phoneInput = input.phone.trim();
  const errors: Partial<Record<keyof OwnProfileInput, string>> = {};

  if (fullName.length < 2 || fullName.length > 160) {
    errors.fullName = "Renseignez un nom de 2 à 160 caractères.";
  }

  if (phoneInput && !isValidPhone(phoneInput)) {
    errors.phone = "Renseignez un numéro de téléphone valide ou laissez le champ vide.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      fullName,
      phone: phoneInput ? toE164(phoneInput) : null,
    },
  };
}
