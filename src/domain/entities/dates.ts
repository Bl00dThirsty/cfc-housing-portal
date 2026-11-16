/**
 * Les dates de la plateforme.
 *
 * Les données CFC sont écrites en français : `15/01/2026`. Une telle chaîne
 * se trie **alphabétiquement**, donc dans le désordre chronologique — c'est
 * le piège. Ce module est le **seul** lieu où une date **française** est lue.
 *
 * La `Date` produite est à **minuit UTC** : deux dates de jours différents ne
 * peuvent pas se chevaucher, quelle que soit l'heure locale du poste.
 */

const FRENCH_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Lit une date française `JJ/MM/AAAA`.
 *
 * Renvoie `null` si la date est absente ou illisible : une date illisible
 * n'est pas une date, et se masquerait sinon dans un tri.
 */
export function parseCfcDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = FRENCH_DATE.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  // Une date inexistante (`31/02/2026`) est rejetée : `Date.UTC` déborde.
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

/** Écrit une date au format français `JJ/MM/AAAA`. */
export function formatCfcDate(value: Date): string {
  // Une date invalide ne doit pas laisser fuir « NaN/NaN/NaN » à l'écran.
  if (!Number.isFinite(value.getTime())) return "";

  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${value.getUTCFullYear()}`;
}
