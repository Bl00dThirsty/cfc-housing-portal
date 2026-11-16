/**
 * Règles de validation d'un dépôt de document — **module pur**.
 *
 * Aucune I/O, aucun accès réseau, aucune dépendance à un framework : ce
 * module est appelé par le navigateur (avant tout envoi) **et** par le serveur
 * (avant toute écriture). C'est cette duplication volontaire qui rend la
 * règle opposable des deux côtés : le navigateur refuse un fichier que le
 * serveur refuserait de toute façon.
 *
 * Les valeurs par défaut reprennent les contraintes de la base :
 * `public.dossier_documents.mime_type` (PDF, JPEG, PNG), `size_bytes`
 * (20 Mio max) et `ref.document_type.accepted_mime` / `max_size_bytes`.
 */

/** Types MIME acceptés par le coffre `dossier-docs`. */
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Taille maximale par défaut d'un dépôt (10 Mio — borne du référentiel). */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/** Longueur maximale du nom de fichier conservé dans le chemin de stockage. */
export const MAX_FILENAME_LENGTH = 120;

/** Extensions admises pour un type MIME donné. */
export const EXTENSIONS_BY_MIME: Readonly<Record<string, readonly string[]>> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

/** Règles appliquées à un dépôt. */
export interface UploadRules {
  /** Types MIME acceptés. */
  allowedMimeTypes: readonly string[];
  /** Taille maximale acceptée, en octets. */
  maxSizeBytes: number;
}

/** Règles par défaut, alignées sur la contrainte `dossier_documents`. */
export const DEFAULT_UPLOAD_RULES: UploadRules = {
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
};

/** Motifs de rejet, stables (exposés à l'interface et aux tests). */
export type UploadValidationCode =
  | "empty_file"
  | "unsupported_type"
  | "file_too_large"
  | "extension_mismatch"
  | "invalid_filename";

export interface UploadValidationError {
  /** Motif machine. */
  code: UploadValidationCode;
  /** Message destiné à l'agent ou à l'emprunteur. */
  message: string;
}

/** Caractéristique d'un fichier telle que vue par la validation. */
export interface UploadCandidate {
  /** Nom d'origine, tel que fourni par le navigateur. */
  name: string;
  /** Type MIME déclaré par le navigateur. */
  mimeType: string;
  /** Taille en octets. */
  sizeBytes: number;
}

/** Valeur validée, normalisée. */
export interface ValidatedUpload {
  /** Nom de fichier normalisé (sûr pour un chemin de stockage). */
  filename: string;
  /** Type MIME accepté. */
  mimeType: string;
  /** Taille en octets. */
  sizeBytes: number;
}

export type UploadValidationResult =
  | { ok: true; value: ValidatedUpload }
  | { ok: false; error: UploadValidationError };

/** Extension en minuscules, point compris (`.pdf`), ou chaîne vide. */
export function fileExtension(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot).toLowerCase();
}

/**
 * Normalise un nom de fichier pour un chemin de stockage.
 *
 * Les accents sont retirés, tout caractère hors `[a-z0-9._-]` devient `-`,
 * les séparateurs de chemin sont supprimés et la longueur est bornée. Le
 * nom reste lisible ; il n'est jamais interpreté.
 */
export function sanitizeFilename(name: string): string {
  const base = (name.split(/[\\/]/).pop() ?? "").trim();
  const withoutAccents = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

  const extension = fileExtension(withoutAccents);
  const stem = extension ? withoutAccents.slice(0, -extension.length) : withoutAccents;

  const safeStem = stem
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "")
    .replace(/[-.]+$/, "")
    .slice(0, Math.max(1, MAX_FILENAME_LENGTH - extension.length));

  const safeExtension = extension.replace(/[^a-z0-9.]/g, "");
  const safe = `${safeStem}${safeExtension}`;

  return safe.length > 1 ? safe : "document";
}

/** Le nom de fichier contient-il une extension cohérente avec son type MIME ? */
export function hasConsistentExtension(name: string, mimeType: string): boolean {
  const extensions = EXTENSIONS_BY_MIME[mimeType];
  if (!extensions) return false;
  const extension = fileExtension(name);
  if (!extension) return false;
  return extensions.includes(extension);
}

/**
 * Valide un fichier candidat **avant** tout envoi.
 *
 * L'ordre des contrôles est significatif : un type non supporté est rejeté
 * avant la taille, un nom inexploitable après l'extension — les motifs
 * renvoyés ne se recouvrent pas.
 */
export function validateUploadCandidate(
  candidate: UploadCandidate,
  rules: UploadRules = DEFAULT_UPLOAD_RULES,
): UploadValidationResult {
  const mimeType = candidate.mimeType.toLowerCase().trim();

  if (!rules.allowedMimeTypes.includes(mimeType)) {
    return {
      ok: false,
      error: {
        code: "unsupported_type",
        message: `Format non accepté (${candidate.mimeType || "inconnu"}). Formats admis : ${rules.allowedMimeTypes
          .map((type) => type.split("/")[1].toUpperCase())
          .join(", ")}.`,
      },
    };
  }

  if (!Number.isFinite(candidate.sizeBytes) || candidate.sizeBytes <= 0) {
    return {
      ok: false,
      error: { code: "empty_file", message: "Le fichier est vide : rien à déposer." },
    };
  }

  if (candidate.sizeBytes > rules.maxSizeBytes) {
    return {
      ok: false,
      error: {
        code: "file_too_large",
        message: `Fichier trop volumineux (${formatBytes(candidate.sizeBytes)}). Maximum autorisé : ${formatBytes(
          rules.maxSizeBytes,
        )}.`,
      },
    };
  }

  if (!hasConsistentExtension(candidate.name, mimeType)) {
    return {
      ok: false,
      error: {
        code: "extension_mismatch",
        message: `L'extension du fichier ne correspond pas au format ${mimeType
          .split("/")[1]
          .toUpperCase()} (extensions admises : ${EXTENSIONS_BY_MIME[mimeType].join(", ")}).`,
      },
    };
  }

  const filename = sanitizeFilename(candidate.name);
  if (!filename || filename === "document") {
    return {
      ok: false,
      error: {
        code: "invalid_filename",
        message: "Le nom du fichier est inexploitable : renommez-le avant dépôt.",
      },
    };
  }

  return { ok: true, value: { filename, mimeType, sizeBytes: candidate.sizeBytes } };
}

/** Taille lisible (français, unités binaires). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, "");
  return `${rounded} ${units[unit]}`;
}
