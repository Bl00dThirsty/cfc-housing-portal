/**
 * Règles des pièces jointes du fil de support.
 *
 * Ce module est **la** définition des types admis, de la taille maximale et
 * du nom de fichier sûr. Il est séparé de l'action serveur parce qu'un
 * fichier `"use server"` n'exporte que des fonctions asynchrones : les
 * constantes et les utilitaires y vivaient, et le module de build refusait de
 * les exporter.
 */

/** Coffre des pièces jointes du fil. */
export const SUPPORT_BUCKET = "support-attachments";

/** Taille maximale d'une pièce jointe : 10 Mo. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Types admis en pièce jointe. */
export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

/** Extensions admises, pour le fichier accepté. */
const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
];

/**
 * Nettoie un nom de fichier : il devient un segment de chemin sûr.
 *
 * Les accents sont retirés et les caractères hors alphanumérique remplacés :
 * le nom voyage dans l'URL du coffre, il ne doit rien.transport d'illisible.
 */
export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** Le type de la pièce jointe est-il admis ? */
export function isAllowedAttachmentType(mime: string, filename: string): boolean {
  const lower = filename.toLowerCase();
  const extensionOk = ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension));
  if (!extensionOk) return false;
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(mime);
}
