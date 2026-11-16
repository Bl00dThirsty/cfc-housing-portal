import { describe, expect, it } from "vitest";

import { INITIAL_MOCK_APPLICATIONS } from "@/domain/data/mock-data";
import { type ClientDocument, clientsData, getDocumentPdf } from "@/domain/entities/client";
import type { DocumentCategory, DocumentItem, DocumentStatus } from "@/domain/entities/types";

/**
 * Garde-fou de la taxonomie documentaire unifiée (Task 3).
 * `DocumentItem` (portail) et `ClientDocument` (back-office DUC) doivent
 * partager EXACTEMENT le même vocabulaire français.
 */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const categoriesMatch: Equals<ClientDocument["category"], DocumentItem["category"]> = true;
const statusesMatch: Equals<ClientDocument["status"], DocumentItem["status"]> = true;

const CANONICAL_CATEGORIES: readonly DocumentCategory[] = [
  "Identité",
  "Revenus",
  "Foncier",
  "Technique",
  "Finances",
  "Assurance",
];

const CANONICAL_STATUSES: readonly DocumentStatus[] = [
  "Manquant",
  "En attente",
  "Téléversé",
  "En cours",
  "Validé",
  "Rejeté",
  "Expiré",
];

describe("taxonomie documentaire canonique", () => {
  it("DocumentItem et ClientDocument partagent exactement le même vocabulaire", () => {
    expect(categoriesMatch).toBe(true);
    expect(statusesMatch).toBe(true);
  });

  it("les pièces clients n'emploient que le vocabulaire canonique", () => {
    for (const client of clientsData) {
      for (const doc of client.documents) {
        expect(CANONICAL_CATEGORIES).toContain(doc.category);
        expect(CANONICAL_STATUSES).toContain(doc.status);
      }
    }
  });

  it("les dossiers de crédit n'emploient que le vocabulaire canonique", () => {
    for (const application of INITIAL_MOCK_APPLICATIONS) {
      for (const doc of application.documents) {
        expect(CANONICAL_CATEGORIES).toContain(doc.category);
        expect(CANONICAL_STATUSES).toContain(doc.status);
      }
    }
  });
});

describe("getDocumentPdf", () => {
  it("résout chaque catégorie canonique vers son PDF officiel", () => {
    expect(getDocumentPdf({ name: "Pièce", category: "Identité" }).url).toBe(
      "/documents/cni-etat-civil.pdf"
    );
    expect(getDocumentPdf({ name: "Pièce", category: "Revenus" }).url).toBe(
      "/documents/bulletin-paie-salaire.pdf"
    );
    expect(getDocumentPdf({ name: "Pièce", category: "Finances" }).url).toBe(
      "/documents/bulletin-paie-salaire.pdf"
    );
    expect(getDocumentPdf({ name: "Pièce", category: "Foncier" }).url).toBe(
      "/documents/titre-foncier-cfc.pdf"
    );
    expect(getDocumentPdf({ name: "Pièce", category: "Technique" }).url).toBe(
      "/documents/expertise-technique-bet.pdf"
    );
    expect(getDocumentPdf({ name: "Pièce", category: "Assurance" }).url).toBe(
      "/documents/police-assurance-convention.pdf"
    );
  });

  it("honore une URL de fichier explicite", () => {
    expect(getDocumentPdf({ name: "x", fileUrl: "/custom.pdf", fileSize: "1 Mo" })).toEqual({
      url: "/custom.pdf",
      size: "1 Mo",
    });
  });
});
