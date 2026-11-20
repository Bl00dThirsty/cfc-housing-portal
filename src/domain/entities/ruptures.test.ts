import { describe, expect, it } from "vitest";

import {
  hasRupture,
  rupturesForStep,
  STEP_RUPTURES,
} from "@/domain/entities/ruptures";

describe("les points de rupture", () => {
  it("connait les six points de rupture de la cartographie", () => {
    expect(Object.keys(STEP_RUPTURES)).toHaveLength(6);
  });

  it("nomme le point de rupture d'une étape", () => {
    expect(rupturesForStep("CRD-03")).toEqual(["Support papier et ressaisies"]);
    expect(rupturesForStep("GAR-01")).toEqual([
      "Délais externes (titre foncier, hypothèque)",
    ]);
  });

  it("renvoie une liste vide pour une étape sans rupture", () => {
    expect(rupturesForStep("CRD-01")).toEqual([]);
    expect(hasRupture("CRD-01")).toBe(false);
  });

  it("sait dire si une étape porte une rupture", () => {
    expect(hasRupture("CRD-08")).toBe(true);
  });

  it("ne rend jamais le tableau du domaine", () => {
    const ruptures = rupturesForStep("CRD-08");
    ruptures.push("ajout");

    expect(STEP_RUPTURES["CRD-08"]).toHaveLength(2);
  });
});
