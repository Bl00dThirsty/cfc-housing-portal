/**
 * Le dossier unique client — son état et son vocabulaire.
 *
 * L'état du dossier est un **vocabulaire fermé** : la base en impose la
 * liste (migration 021), et le domaine en donne la traduction française.
 * Un état inconnu reste affiché tel quel — il signale un défaut de données
 * plutôt que de le masquer.
 *
 * Module pur : aucun import React, Supabase ou serveur.
 */

/** Les états possibles d'un dossier. */
export const DOSSIER_STATUSES = ["open", "on_hold", "closed"] as const;

/** État d'un dossier. */
export type DossierStatus = (typeof DOSSIER_STATUSES)[number];

/** Traduction française des états du dossier. */
export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  open: "En cours",
  on_hold: "En attente",
  closed: "Clos",
};

/**
 * Libellé lisible d'un état de dossier.
 *
 * `null` si l'état est absent ; l'état brut s'il n'est pas dans le
 * vocabulaire — l'inconnu doit se voir.
 */
export function dossierStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  return DOSSIER_STATUS_LABELS[status as DossierStatus] ?? status;
}
