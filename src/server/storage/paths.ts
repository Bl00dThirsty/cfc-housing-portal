/**
 * Convention de nommage des objets du coffre `dossier-docs` — **module pur**.
 *
 * ```
 * dossier/<dossierId>/<docTypeCode>/<horodatage>-<nomSûr>
 * dossier/8fa3…-…/CNI_BIOMETRIQUE/20260111-140755-cni-biometrique.pdf
 * ```
 *
 * Trois propriétés, volontairement :
 * - le **dossier** ouvre le chemin : un dossier effacé n'entraîne jamais
 *   qu'on touche au dossier d'un autre ;
 * - le **type de document** isole les versions d'une même pièce ;
 * - l'**horodatage** précède le nom : deux dépôts du même fichier ne
 *   s'écrasent jamais (`unique (storage_path)`), et l'ordre de dépôt reste
 *   lisible dans l'URL.
 */

import { sanitizeFilename } from "./validation";

/** Nom du bucket privé (cf. migration `20260101000014_storage_buckets.sql`). */
export const STORAGE_BUCKET = "dossier-docs";

/** Racine des objets du coffre : un dossier, et rien d'autre. */
export const STORAGE_ROOT = "dossier";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOC_TYPE_PATTERN = /^[A-Z0-9_]{1,64}$/;

/** Entrées de construction d'un chemin de stockage. */
export interface StoragePathInput {
  /** Identifiant du dossier (`public.dossiers.id`). */
  dossierId: string;
  /** Code du type de document (`ref.document_type.code`). */
  docTypeCode: string;
  /** Nom de fichier d'origine. */
  filename: string;
  /** Instant du dépôt (par défaut : maintenant). */
  timestamp?: Date;
}

/**
 * Horodatage compact et triable : `AAAAMMJJ-HHMMSS` (UTC).
 *
 * L'UTC évite que deux dépôts fait à une minute d'écart dans deux fuseaux
 * se chevauchent.
 */
export function formatStorageTimestamp(date: Date = new Date()): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
  );
}

/** Dossier parent d'un objet : `dossier/<dossierId>/<docTypeCode>`. */
export function storageFolder(dossierId: string, docTypeCode: string): string {
  assertDossierId(dossierId);
  assertDocTypeCode(docTypeCode);
  return `${STORAGE_ROOT}/${dossierId}/${docTypeCode}`;
}

/** Nom de l'objet, sans son dossier parent. */
export function storageFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

/**
 * Construit le chemin de stockage d'un document.
 *
 * Le nom de fichier est normalisé : accents retirés, caractères exotiques
 * remplacés, longueur bornée. Deux fichiers de noms différents ne peuvent
 * pas produire le même chemin.
 */
export function buildStoragePath(input: StoragePathInput): string {
  const timestamp = formatStorageTimestamp(input.timestamp ?? new Date());
  const safeName = sanitizeFilename(input.filename);
  return `${storageFolder(input.dossierId, input.docTypeCode)}/${timestamp}-${safeName}`;
}

/** Le chemin appartient-il au dossier attendu ? (garde-fou de confinement) */
export function isPathInDossier(path: string, dossierId: string): boolean {
  return path.startsWith(`${STORAGE_ROOT}/${dossierId}/`);
}

/** Le chemin est-il celui du type de document attendu ? */
export function isPathInDocType(path: string, docTypeCode: string): boolean {
  return path.startsWith(`${STORAGE_ROOT}/`) && path.includes(`/${docTypeCode}/`);
}

function assertDossierId(dossierId: string): void {
  if (!UUID_PATTERN.test(dossierId)) {
    throw new TypeError(`Identifiant de dossier invalide : ${dossierId}`);
  }
}

function assertDocTypeCode(docTypeCode: string): void {
  if (!DOC_TYPE_PATTERN.test(docTypeCode)) {
    throw new TypeError(`Code de type de document invalide : ${docTypeCode}`);
  }
}
