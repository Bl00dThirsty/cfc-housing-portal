import { describe, expect, it } from "vitest";

import { roleHeaderConfigFor, visibleQuickActions } from "@/config/rbac/role-header";

/**
 * L'en-tête — la configuration par rôle.
 *
 * Un en-tête identique pour les rôles ne dit rien de l'endroit où l'agent
 * se trouve. Et une action rapide qu'un rôle ne peut pas accomplir ne doit
 * jamais lui être offerte.
 */
describe("en-tête — la configuration par rôle", () => {
  it("nomme le pôle du guichet", () => {
    expect(roleHeaderConfigFor("GUICHET").contextLabel).toBe("Agence commerciale");
  });

  it("donne au citoyen son propre libellé", () => {
    expect(roleHeaderConfigFor("CITIZEN").contextLabel).toBe("Espace citoyen");
  });

  it("n'offre pas de recherche au citoyen", () => {
    expect(roleHeaderConfigFor("CITIZEN").search).toBeUndefined();
  });

  it("scope la recherche de l'agent à son pôle", () => {
    const config = roleHeaderConfigFor("RISQUES_BET");
    expect(config.search?.placeholder).toContain("rapport");
    expect(config.search?.scope).toBe("G3");
  });

  it("ne propose au guichet que les actions qu'il peut accomplir", () => {
    const actions = visibleQuickActions("GUICHET");
    const labels = actions.map((action) => action.label);

    expect(labels).toContain("Enrôler un emprunteur");
    // Le comité n'appartient pas au guichet.
    expect(labels).not.toContain("Dossier en délibération");
  });

  it("donne au comité son action d'arbitrage", () => {
    const labels = visibleQuickActions("COMITE").map((action) => action.label);
    expect(labels).toContain("Dossier en délibération");
  });
});
