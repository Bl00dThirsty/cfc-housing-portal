import { describe, expect, it } from "vitest";

import {
  buildClosure,
  buildVersionDraft,
  computeNextVersion,
  isCurrentVersion,
  isVersionEffective,
  versionsToClose,
  type VersionedTemplate,
} from "@/server/email/versioning";

/**
 * Logique de versionnement des modèles.
 *
 * Règle vérifiée ici : un modèle expédié n'est **jamais** réécrit. L'édition
 * ferme la version courante et ouvre une version nouvelle ; l'historique
 * reste intact.
 */

const NOW = new Date("2026-03-01T10:00:00.000Z");

function version(overrides: Partial<VersionedTemplate> = {}): VersionedTemplate {
  return {
    code: "WELCOME",
    version: 1,
    effective_from: "2026-01-01T00:00:00.000Z",
    effective_to: null,
    is_active: true,
    deleted_at: null,
    ...overrides,
  };
}

describe("computeNextVersion", () => {
  it("attribue 1 pour un catalogue vide", () => {
    expect(computeNextVersion([])).toBe(1);
  });

  it("attribue le maximum connu + 1", () => {
    expect(computeNextVersion([{ version: 1 }, { version: 3 }])).toBe(4);
  });

  it("ne réutilise jamais un numéro : les versions fermées comptent", () => {
    const versions = [{ version: 1 }, { version: 2 }];
    expect(computeNextVersion(versions)).toBe(3);
  });
});

describe("isVersionEffective", () => {
  it("reconnait une version ouverte et commencée", () => {
    expect(isVersionEffective(version(), NOW)).toBe(true);
  });

  it("rejette une version qui n'a pas encore commencé", () => {
    expect(
      isVersionEffective(version({ effective_from: "2026-04-01T00:00:00.000Z" }), NOW),
    ).toBe(false);
  });

  it("rejette une version fermée", () => {
    expect(
      isVersionEffective(version({ effective_to: "2026-02-01T00:00:00.000Z" }), NOW),
    ).toBe(false);
  });

  it("rejette une version dont la date de début est illisible", () => {
    expect(isVersionEffective(version({ effective_from: "pas-une-date" }), NOW)).toBe(false);
  });
});

describe("isCurrentVersion", () => {
  it("exige une version effective, active et non supprimée", () => {
    expect(isCurrentVersion(version(), NOW)).toBe(true);
    expect(isCurrentVersion(version({ is_active: false }), NOW)).toBe(false);
    expect(isCurrentVersion(version({ deleted_at: "2026-02-01T00:00:00.000Z" }), NOW)).toBe(false);
    expect(
      isCurrentVersion(version({ effective_to: "2026-02-01T00:00:00.000Z" }), NOW),
    ).toBe(false);
  });
});

describe("versionsToClose", () => {
  it("ne ferme que les versions ouvertes et effective", () => {
    const open = version({ version: 1 });
    const future = version({ version: 2, effective_from: "2026-06-01T00:00:00.000Z" });
    const closed = version({ version: 3, effective_to: "2026-02-01T00:00:00.000Z" });

    expect(versionsToClose([open, future, closed], NOW)).toEqual([open]);
  });

  it("ne ferme pas une version supprimée", () => {
    const deleted = version({ deleted_at: "2026-02-01T00:00:00.000Z" });

    expect(versionsToClose([deleted], NOW)).toEqual([]);
  });
});

describe("buildVersionDraft", () => {
  it("prépare la version suivante, ouverte à l'instant de publication", () => {
    const draft = buildVersionDraft([{ version: 1 }, { version: 2 }], "WELCOME", NOW);

    expect(draft).toEqual({
      code: "WELCOME",
      version: 3,
      effective_from: NOW.toISOString(),
      effective_to: null,
    });
  });
});

describe("buildClosure", () => {
  it("pose la borne haute de la version fermée", () => {
    const current = version({ version: 1 });
    const closed = buildClosure(current, NOW);

    expect(closed.effective_to).toBe(NOW.toISOString());
    // Le contenu n'est pas modifié : seule la fenêtre de validité change.
    expect(closed.effective_from).toBe(current.effective_from);
    expect(closed.version).toBe(1);
    expect(closed.is_active).toBe(true);
  });
});
