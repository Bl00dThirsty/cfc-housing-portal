import { describe, expect, it } from "vitest";

import {
  STORAGE_BUCKET,
  STORAGE_ROOT,
  buildStoragePath,
  formatStorageTimestamp,
  isPathInDossier,
  isPathInDocType,
  storageFileName,
  storageFolder,
} from "@/server/storage/paths";

/**
 * Convention de nommage des objets du coffre.
 *
 * Règle vérifiée ici : le chemin commence par le dossier, puis le type de
 * document, puis l'horodatage — deux dépôts du même fichier ne s'écrasent
 * jamais et un dossier effacé n'atteint jamais les pièces d'un autre.
 */

const DOSSIER_ID = "8fa32a7c-3e02-4c60-ad5e-1e6b85458439";
const DATE = new Date("2026-01-11T14:07:55.000Z");

describe("buildStoragePath", () => {
  it("suit la convention dossier / type / horodatage-nom", () => {
    const path = buildStoragePath({
      dossierId: DOSSIER_ID,
      docTypeCode: "CNI_BIOMETRIQUE",
      filename: "cni.pdf",
      timestamp: DATE,
    });

    expect(path).toBe(
      `dossier/${DOSSIER_ID}/CNI_BIOMETRIQUE/20260111-140755-cni.pdf`,
    );
  });

  it("normalise le nom de fichier", () => {
    const path = buildStoragePath({
      dossierId: DOSSIER_ID,
      docTypeCode: "CNI_BIOMETRIQUE",
      filename: "Certificat de résidence.pdf",
      timestamp: DATE,
    });

    expect(path.endsWith("-certificat-de-residence.pdf")).toBe(true);
  });

  it("distingue deux dépôts du même fichier par l'horodatage", () => {
    const first = buildStoragePath({
      dossierId: DOSSIER_ID,
      docTypeCode: "CNI_BIOMETRIQUE",
      filename: "cni.pdf",
      timestamp: new Date("2026-01-11T14:07:55.000Z"),
    });
    const second = buildStoragePath({
      dossierId: DOSSIER_ID,
      docTypeCode: "CNI_BIOMETRIQUE",
      filename: "cni.pdf",
      timestamp: new Date("2026-01-11T15:42:01.000Z"),
    });

    expect(first).not.toBe(second);
  });

  it("refuse un identifiant de dossier qui n'en est pas un", () => {
    expect(() =>
      buildStoragePath({
        dossierId: "../../etc",
        docTypeCode: "CNI_BIOMETRIQUE",
        filename: "cni.pdf",
      }),
    ).toThrow(TypeError);
  });

  it("refuse un code de type de document exotique", () => {
    expect(() =>
      buildStoragePath({
        dossierId: DOSSIER_ID,
        docTypeCode: "cni/biometrique",
        filename: "cni.pdf",
      }),
    ).toThrow(TypeError);
  });
});

describe("formatStorageTimestamp", () => {
  it("formate en UTC, compact et triable", () => {
    expect(formatStorageTimestamp(DATE)).toBe("20260111-140755");
  });

  it("ne déborde pas sur le jour suivant", () => {
    expect(formatStorageTimestamp(new Date("2026-12-31T23:59:59.000Z"))).toBe("20261231-235959");
  });
});

describe("storageFolder / storageFileName", () => {
  it("isole le dossier et le type", () => {
    expect(storageFolder(DOSSIER_ID, "CNI_BIOMETRIQUE")).toBe(
      `dossier/${DOSSIER_ID}/CNI_BIOMETRIQUE`,
    );
  });

  it("extrait le nom de l'objet", () => {
    expect(storageFileName(`dossier/${DOSSIER_ID}/C1/20260111-140755-cni.pdf`)).toBe(
      "20260111-140755-cni.pdf",
    );
  });
});

describe("isPathInDossier / isPathInDocType", () => {
  const path = buildStoragePath({
    dossierId: DOSSIER_ID,
    docTypeCode: "CNI_BIOMETRIQUE",
    filename: "cni.pdf",
    timestamp: DATE,
  });

  it("reconnaît le dossier propriétaire", () => {
    expect(isPathInDossier(path, DOSSIER_ID)).toBe(true);
    expect(isPathInDossier(path, "00000000-0000-4000-8000-000000000000")).toBe(false);
  });

  it("reconnaît le type de document", () => {
    expect(isPathInDocType(path, "CNI_BIOMETRIQUE")).toBe(true);
    expect(isPathInDocType(path, "PASSPORT")).toBe(false);
  });
});

describe("constantes du coffre", () => {
  it("pointe vers le seau privé des pièces", () => {
    expect(STORAGE_BUCKET).toBe("dossier-docs");
    expect(STORAGE_ROOT).toBe("dossier");
  });
});
