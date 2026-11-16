"use client";

import { toast } from "sonner";

/**
 * Le retour d'action — **un seul** propriétaire.
 *
 * Tous les appels serveur de l'application répondent déjà par
 * `{ ok: true }` ou `{ ok: false, error }`. Ce module traduit cette
 * convention en signal visible : un toast de succès, un toast d'erreur.
 *
 * Un toast est **transitoire** : il accompagne l'état d'erreur affiché à
 * l'écran, il ne le remplace jamais.
 */
export function reportAction(
  result: { ok: true } | { ok: false; error: string },
  successMessage?: string,
): boolean {
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }

  if (successMessage) toast.success(successMessage);
  return true;
}

/** Signale un refus qui ne vient pas d'un appel serveur. */
export function reportError(error: string): void {
  toast.error(error);
}

/**
 * Le retour d'action, dans la variante `{ ok, message }`.
 *
 * Le catalogue des modèles d'e-mail porte un message **unique** : il vaut
 * pour la réussite comme pour le refus. Ce helper le dit tel quel, sans
 * avoir à réécrire la même chaîne des deux côtés.
 */
export function reportOutcome(
  result: { ok: boolean; message: string },
  successMessage?: string,
): boolean {
  if (!result.ok) {
    toast.error(result.message);
    return false;
  }

  toast.success(successMessage ?? result.message);
  return true;
}
