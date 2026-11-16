/**
 * Les points de rupture du circuit de crédit.
 *
 * Ils viennent du diagramme en couloirs de la cartographie CFC (PR-01). Le
 * demandeur a le droit de savoir **pourquoi** son dossier attend : un délai
 * vient du titre foncier, pas de l'instruction.
 *
 * ⚠️ Ce sont des **faits de la cartographie** : ils appartiennent au
 *    domaine, et l'écran ne les réécrit pas.
 */
export const STEP_RUPTURES: Record<string, readonly string[]> = {
  "CRD-03": ["Support papier et ressaisies"],
  "CRD-04": ["Délégation aux bureaux d'études"],
  "CRD-08": ["Navettes agence–siège", "Niveaux de validation multiples"],
  "GAR-01": ["Délais externes (titre foncier, hypothèque)"],
  "CRD-12": ["Inspections de chantier non outillées"],
  "CRD-13": ["Inspections de chantier non outillées"],
};

/** Les points de rupture d'une étape — une copie, jamais le tableau d'origine. */
export function rupturesForStep(code: string): string[] {
  return [...(STEP_RUPTURES[code] ?? [])];
}

/** L'étape porte-t-elle un point de rupture ? */
export function hasRupture(code: string): boolean {
  return (STEP_RUPTURES[code]?.length ?? 0) > 0;
}
