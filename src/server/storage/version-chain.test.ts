import { describe, expect, it } from "vitest";

import { planVersionChain, selectLiveDocument, type VersionedDocument } from "@/server/storage/version-chain";

/**
 * Chaînage des versions d'une pièce.
 *
 * Règle vérifiée ici : un second dépôt du **même** type de document pour le
 * **même** dossier supersède la pièce vivante — il ne la duplique pas. Les
 * versions s'enchaînent sans jamais perdre l'archive.
 */

const DOSSIER_ID = "8fa32a7c-3e02-4c60-ad5e-1e6b85458439";
const AUTRE_DOSSIER_ID = "00000000-0000-4000-8000-000000000000";

function document(overrides: Partial<VersionedDocument> = {}): VersionedDocument {
  return {
    id: "doc-1",
    dossierId: DOSSIER_ID,
    docTypeCode: "CNI_BIOMETRIQUE",
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

describe("planVersionChain", () => {
  it("ouvre la chaîne en version 1 quand aucune pièce n'existe", () => {
    expect(planVersionChain(null)).toEqual({ version: 1, supersedesId: null });
  });

  it("supersède la pièce vivante et incrémente la version", () => {
    expect(planVersionChain(document({ id: "doc-1", version: 1 }))).toEqual({
      version: 2,
      supersedesId: "doc-1",
    });
  });

  it("enchaîne les versions successives", () => {
    const first = planVersionChain(document({ id: "doc-1", version: 1 }));
    const second = planVersionChain(document({ id: "doc-2", version: first.version }));

    expect(second).toEqual({ version: 3, supersedesId: "doc-2" });
  });
});

describe("selectLiveDocument", () => {
  it("ne trouve rien dans un dossier vide", () => {
    expect(selectLiveDocument([], DOSSIER_ID, "CNI_BIOMETRIQUE")).toBeNull();
  });

  it("ignore les pièces archivées", () => {
    const archived = document({ id: "doc-1", deletedAt: "2026-01-11T14:07:55.000Z" });
    expect(selectLiveDocument([archived], DOSSIER_ID, "CNI_BIOMETRIQUE")).toBeNull();
  });

  it("retient la pièce vivante du même couple (dossier, type)", () => {
    const other = document({ id: "doc-2", docTypeCode: "PASSPORT" });
    const otherDossier = document({ id: "doc-3", dossierId: AUTRE_DOSSIER_ID });
    const live = document({ id: "doc-4" });

    expect(selectLiveDocument([other, otherDossier, live], DOSSIER_ID, "CNI_BIOMETRIQUE")).toBe(
      live,
    );
  });

  it("retient la version la plus haute", () => {
    const older = document({ id: "doc-1", version: 1 });
    const newer = document({ id: "doc-2", version: 3 });

    expect(selectLiveDocument([older, newer], DOSSIER_ID, "CNI_BIOMETRIQUE")).toBe(newer);
  });

  it("conduit au supersession et non à la duplication", () => {
    const live = selectLiveDocument(
      [document({ id: "doc-1", version: 1 })],
      DOSSIER_ID,
      "CNI_BIOMETRIQUE",
    );
    const plan = planVersionChain(live);

    expect(plan.supersedesId).toBe("doc-1");
    expect(plan.version).toBe(2);
  });
});
