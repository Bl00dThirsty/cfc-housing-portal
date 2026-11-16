import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Le téléphone — **un seul** propriétaire de ses règles.
 *
 * Les plans de numérotation sont ceux de `libphonenumber-js` : ce module ne
 * les réécrit pas, il les **applique**. Un numéro camerounais, un numéro
 * français, un numéro ivoirien — les règles sont celles de l'infrastructure
 * téléphonique mondiale, pas les nôtres.
 *
 * Deux formes coexistent, et chacune a son rôle :
 *
 * - la forme **nationale** est ce que l'utilisateur tape : les chiffres de
 *   son numéro, dans son pays (`6 99 00 00 01`) ;
 * - la forme **internationale** est ce que la plateforme stocke :
 *   l'indicatif, puis les chiffres, sans séparateur (`+237699000001`).
 *
 * Le formatage n'est jamais stocké : il se fait à l'affichage. Une base qui
 * contient « +237 6 99 00 00 01 » et une autre « +237699000001 » décrivent le
 * même numéro.
 */

/** Le pays par défaut : le CFC est camerounais. */
export const DEFAULT_PHONE_ISO: CountryCode = "CM";

/** Ne garde que les chiffres d'une saisie. */
export function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * La forme stockée : l'indicatif, puis les chiffres.
 *
 * Une saisie sans indicatif est lue comme un numéro national du pays de
 * repli : c'est le cas de l'usager camerounais qui tape « 699 00 00 01 ».
 * Une saisie illisible — ou hors plan — ne donne **rien** : on ne devine pas
 * un numéro, et on n'enregistre pas un numéro qui n'en est pas un.
 */
export function toE164(
  value: string,
  fallbackIso: CountryCode = DEFAULT_PHONE_ISO,
): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  const parsed = parsePhoneNumberFromString(trimmed, fallbackIso);
  return parsed && parsed.isValid() ? parsed.number : "";
}

/**
 * Le numéro est-il conforme au plan de numérotation de son pays ?
 *
 * La longueur et les préfixes sont vérifiés : « 699 00 00 01 » est un mobile
 * camerounais, « 699 00 00 011 » ne l'est pas.
 */
export function isValidPhone(
  value: string,
  fallbackIso: CountryCode = DEFAULT_PHONE_ISO,
): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  const parsed = parsePhoneNumberFromString(trimmed, fallbackIso);
  return parsed ? parsed.isValid() : false;
}

/**
 * Le numéro affiché en international : « +237 6 99 00 00 01 ».
 */
export function formatPhone(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  const parsed = parsePhoneNumberFromString(trimmed);
  return parsed ? parsed.formatInternational() : "";
}

/**
 * Le numéro affiché dans la forme du pays : « 6 99 00 00 01 ».
 */
export function formatNational(
  value: string,
  fallbackIso: CountryCode = DEFAULT_PHONE_ISO,
): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  const parsed = parsePhoneNumberFromString(trimmed, fallbackIso);
  return parsed ? parsed.formatNational() : "";
}

/**
 * Le pays d'un numéro, d'après son indicatif.
 */
export function detectCountryIso(
  value: string,
  fallbackIso: CountryCode = DEFAULT_PHONE_ISO,
): CountryCode {
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallbackIso;

  const parsed = parsePhoneNumberFromString(trimmed, fallbackIso);
  return parsed?.country ?? fallbackIso;
}

/**
 * La saisie en cours, reformatée au fil de la frappe.
 *
 * Un indicatif collé depuis un autre appareil est reconnu : l'indicatif est
 * retiré, et le pays suivi — la saisie reste nationale.
 */
export function formatNationalInput(
  raw: string,
  fallbackIso: CountryCode = DEFAULT_PHONE_ISO,
): { display: string; national: string; iso: CountryCode } {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { display: "", national: "", iso: fallbackIso };
  }

  // Un numéro international collé : le pays est celui de son indicatif.
  if (trimmed.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(trimmed);
    if (parsed) {
      return {
        display: parsed.formatNational(),
        national: parsed.nationalNumber,
        iso: parsed.country ?? fallbackIso,
      };
    }
  }

  const formatter = new AsYouType(fallbackIso);
  const display = formatter.input(trimmed);

  return { display, national: digitsOf(display), iso: fallbackIso };
}
