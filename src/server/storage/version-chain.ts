/**
 * Règle de chaînage des versions — **module pur**.
 *
 * Une pièce n'est jamais dupliquée : un dépôt du même `doc_type_code` pour
 * le même dossier **supersède** la pièce vivante et la laisse en archive
 * (`deleted_at`), la nouvelle portant `supersedes_id` et `version + 1`.
 *
 * La règle est ici, sous forme de fonction pure : elle est testable sans
 * base, et c'est elle qui décide — la base ne fait qu'exécuter.
 */

/** Document destiné à la chaîne de versions. */
export interface VersionedDocument {
  /** Identifiant du document. */
  id: string;
  /** Dossier propriétaire. */
  dossierId: string;
  /** Type de document (`ref.document_type.code`). */
  docTypeCode: string;
  /** Numéro de version courante. */
  version: number;
  /** Date de suppression logique (`null` si la pièce est vivante). */
  deletedAt?: string | null;
}

/** Décision de chaînage. */
export interface VersionChainPlan {
  /** Version à écrire sur la nouvelle pièce. */
  version: number;
  /** Pièce que la nouvelle version supersède (`null` pour la première). */
  supersedesId: string | null;
}

/**
 * Décide de la version à écrire.
 *
 * - aucune pièce vivante du même type : version 1, sans supersession ;
 * - une pièce vivante : version suivante, la précédente est supersédée.
 */
export function planVersionChain(existing: VersionedDocument | null): VersionChainPlan {
  if (!existing) {
    return { version: 1, supersedesId: null };
  }
  return { version: existing.version + 1, supersedesId: existing.id };
}

/**
 * Retient, parmi des documents, la pièce vivante d'un couple
 * (dossier, type de document).
 *
 * `deleted_at` filtre les archives ; à version égale, la plus grande version
 * gagne (la dernière écriture l'emporte).
 */
export function selectLiveDocument(
  documents: readonly VersionedDocument[],
  dossierId: string,
  docTypeCode: string,
): VersionedDocument | null {
  const live = documents.filter(
    (document) =>
      document.dossierId === dossierId &&
      document.docTypeCode === docTypeCode &&
      !document.deletedAt,
  );
  if (live.length === 0) return null;

  return live.reduce((best, candidate) => (candidate.version > best.version ? candidate : best));
}
