/**
 * Logique de versionnement des modèles d'e-mail.
 *
 * Un modèle expédié **n'est jamais réécrit**. Éditer un modèle ferme la
 * version courante (`effective_to`) et ouvre une version nouvelle. Ce module
 * porte la décision — quelle version est en vigueur, laquelle fermer, quel
 * numéro attribuer — sous forme **pure**, afin qu'elle soit vérifiable sans
 * base de données.
 *
 * La fermeture et l'insertion sont réalisées atomiquement par la fonction
 * `private.publish_email_template` (migration 016) : ce module calcule, la
 * fonction exécute.
 */

/** Version d'un modèle, telle que stockée en base. */
export interface VersionedTemplate {
  code: string;
  version: number;
  /** Début de validité. */
  effective_from: string;
  /** Fin de validité (`null` : version courante). */
  effective_to: string | null;
  /** Le modèle est-il actif ? */
  is_active: boolean;
  /** Suppression logique (`null` : ligne vivante). */
  deleted_at?: string | null;
}

/** Version publiée — contenu et dates de validité. */
export interface TemplateVersionDraft {
  code: string;
  version: number;
  effective_from: string;
  effective_to: null;
}

/** Convertit une date ISO en `Date` (`null` si illisible). */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * La version est-elle dans sa période de validité à l'instant `at` ?
 *
 * Une version fermée (`effective_to` atteint ou dépassé) n'est plus en
 * vigueur ; une version qui n'a pas encore commencé ne l'est pas non plus.
 */
export function isVersionEffective(template: VersionedTemplate, at: Date = new Date()): boolean {
  const from = toDate(template.effective_from);
  if (!from || from.getTime() > at.getTime()) return false;

  const to = toDate(template.effective_to);
  if (to && to.getTime() <= at.getTime()) return false;

  return true;
}

/**
 * La version est-elle la version **courante** du catalogue ?
 *
 * Elle doit être effective, active et non supprimée.
 */
export function isCurrentVersion(template: VersionedTemplate, at: Date = new Date()): boolean {
  if (template.deleted_at) return false;
  if (!template.is_active) return false;
  return isVersionEffective(template, at);
}

/**
 * Prochain numéro de version : le plus grand numéro connu **+ 1**.
 *
 * Les versions fermées comptent : l'historique fait foi, on ne réutilise
 * jamais un numéro.
 */
export function computeNextVersion(
  versions: readonly Pick<VersionedTemplate, "version">[],
): number {
  return versions.reduce((max, item) => Math.max(max, item.version), 0) + 1;
}

/**
 * Versions à fermer lors de la publication d'une version nouvelle.
 *
 * Seules les versions **sans** `effective_to` et déjà effective sont closes :
 * l'historique reste intact.
 */
export function versionsToClose(
  versions: readonly VersionedTemplate[],
  at: Date = new Date(),
): VersionedTemplate[] {
  return versions.filter(
    (template) =>
      !template.effective_to &&
      !template.deleted_at &&
      isVersionEffective(template, at),
  );
}

/**
 * Prépare la version nouvelle : numéro attribué, ouverture à l'instant `at`.
 */
export function buildVersionDraft(
  existing: readonly Pick<VersionedTemplate, "version">[],
  code: string,
  at: Date = new Date(),
): TemplateVersionDraft {
  return {
    code,
    version: computeNextVersion(existing),
    effective_from: at.toISOString(),
    effective_to: null,
  };
}

/**
 * Prépare la fermeture d'une version : la borne haute est posée à `at`.
 */
export function buildClosure(
  template: VersionedTemplate,
  at: Date = new Date(),
): VersionedTemplate {
  return { ...template, effective_to: at.toISOString() };
}
