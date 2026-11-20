import { describe, expect, it } from "vitest";

import {
  DEFAULT_UPLOAD_RULES,
  EXTENSIONS_BY_MIME,
  MAX_UPLOAD_SIZE_BYTES,
  fileExtension,
  formatBytes,
  hasConsistentExtension,
  sanitizeFilename,
  validateUploadCandidate,
} from "@/server/storage/validation";

/**
 * Règles de validation d'un dépôt.
 *
 * Règle vérifiée ici : un fichier non conforme est **rejeté avant tout
 * envoi**. La validation est une fonction pure : elle ne dépend ni du
 * réseau, ni de la base, ni du navigateur.
 */

const PDF = { name: "cni.pdf", mimeType: "application/pdf", sizeBytes: 1024 };

describe("validateUploadCandidate", () => {
  it("accepte un PDF conforme et normalise son nom", () => {
    const result = validateUploadCandidate(PDF);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mimeType).toBe("application/pdf");
    expect(result.value.sizeBytes).toBe(1024);
    expect(result.value.filename).toBe("cni.pdf");
  });

  it("refuse un type MIME non supporté", () => {
    const result = validateUploadCandidate({
      name: "notes.txt",
      mimeType: "text/plain",
      sizeBytes: 12,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unsupported_type");
  });

  it("refuse un fichier trop volumineux", () => {
    const result = validateUploadCandidate({
      ...PDF,
      sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("file_too_large");
  });

  it("accepte un fichier exactement à la limite", () => {
    const result = validateUploadCandidate({
      ...PDF,
      sizeBytes: MAX_UPLOAD_SIZE_BYTES,
    });

    expect(result.ok).toBe(true);
  });

  it("refuse un fichier vide", () => {
    const result = validateUploadCandidate({ ...PDF, sizeBytes: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("empty_file");
  });

  it("refuse une extension incohérente avec le type MIME", () => {
    const result = validateUploadCandidate({
      name: "cni.png",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("extension_mismatch");
  });

  it("refuse un fichier sans extension", () => {
    const result = validateUploadCandidate({
      name: "cni",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("extension_mismatch");
  });

  it("applique les règles transmises plutôt que celles par défaut", () => {
    const result = validateUploadCandidate(PDF, {
      allowedMimeTypes: ["image/png"],
      maxSizeBytes: 1024,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unsupported_type");
  });

  it("conserve le type MIME en minuscules", () => {
    const result = validateUploadCandidate({ ...PDF, mimeType: "APPLICATION/PDF" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mimeType).toBe("application/pdf");
  });
});

describe("sanitizeFilename", () => {
  it("retire les accents", () => {
    expect(sanitizeFilename("Certificat de résidence.pdf")).toBe("certificat-de-residence.pdf");
  });

  it("supprime les séparateurs de chemin", () => {
    expect(sanitizeFilename("../../etc/passwd.pdf")).toBe("passwd.pdf");
  });

  it("remplace les caractères exotiques", () => {
    expect(sanitizeFilename("pièce n°1 (copie).pdf")).toBe("piece-n1-copie.pdf");
  });

  it("borne la longueur du nom", () => {
    const name = sanitizeFilename(`${"a".repeat(300)}.pdf`);
    expect(name.length).toBeLessThanOrEqual(120);
  });

  it("retombe sur un nom neutre quand il ne reste rien d'exploitable", () => {
    expect(sanitizeFilename("???")).toBe("document");
  });

  it("préserve l'extension", () => {
    expect(sanitizeFilename("Scan_2026.PNG")).toBe("scan_2026.png");
  });
});

describe("fileExtension / hasConsistentExtension", () => {
  it("extrait l'extension en minuscules", () => {
    expect(fileExtension("Rapport Final.PDF")).toBe(".pdf");
    expect(fileExtension("rapport")).toBe("");
    expect(fileExtension(".gitignore")).toBe("");
  });

  it("associe les extensions aux types MIME", () => {
    expect(EXTENSIONS_BY_MIME["image/jpeg"]).toContain(".jpeg");
    expect(hasConsistentExtension("photo.jpeg", "image/jpeg")).toBe(true);
    expect(hasConsistentExtension("photo.gif", "image/jpeg")).toBe(false);
    expect(hasConsistentExtension("photo.jpg", "application/pdf")).toBe(false);
  });
});

describe("formatBytes", () => {
  it("formate les tailles à la française", () => {
    expect(formatBytes(0)).toBe("0 o");
    expect(formatBytes(512)).toBe("512 o");
    expect(formatBytes(1024)).toBe("1 Ko");
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 Mo");
  });
});

describe("DEFAULT_UPLOAD_RULES", () => {
  it("refuse les formats hors du coffre", () => {
    expect(DEFAULT_UPLOAD_RULES.allowedMimeTypes).toEqual([
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]);
  });

  it("borne la taille à 10 Mio", () => {
    expect(DEFAULT_UPLOAD_RULES.maxSizeBytes).toBe(10 * 1024 * 1024);
  });
});
