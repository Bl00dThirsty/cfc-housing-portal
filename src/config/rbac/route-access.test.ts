import { describe, expect, it } from "vitest";

import {
  ACCESS_DENIED_PATH,
  canAgentOpenRoute,
  isCommonAgentRoute,
} from "@/config/rbac/route-access";

/**
 * La navigation est la seule description des écrans d'un pôle : ce qu'un
 * agent voit dans le menu est exactement ce qu'il peut ouvrir. Ces
 * vérifications protègent cette équivalence.
 */
describe("contrôle d'accès aux routes de la console", () => {
  it("ouvre à un agent les écrans de son rôle", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/clients")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/actors/agency")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/actors/agency/kyc-validation")).toBe(true);

    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/actors/notary-cadastre")).toBe(true);
    expect(canAgentOpenRoute("COMITE", "/portail-cfc/actors/credit-committees")).toBe(true);
    expect(canAgentOpenRoute("DIASPORA", "/portail-cfc/actors/agency/diaspora")).toBe(true);
    expect(canAgentOpenRoute("RISQUES_BET", "/portail-cfc/actors/risk-engineering")).toBe(true);
  });

  it("refuse à un agent les écrans d'un autre pôle", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/analytics")).toBe(false);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/settings/catalogue")).toBe(false);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/kanban")).toBe(false);

    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/analytics")).toBe(false);
    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/actors/disbursements")).toBe(false);

    expect(canAgentOpenRoute("COMITE", "/portail-cfc/actors/notary-cadastre")).toBe(false);

    expect(canAgentOpenRoute("DIASPORA", "/portail-cfc/actors/disbursements")).toBe(false);

    expect(canAgentOpenRoute("RISQUES_BET", "/portail-cfc/settings/catalogue")).toBe(false);
  });

  it("donne à l'administrateur tous les écrans de la Direction Générale", () => {
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/analytics")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/catalogue")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/email/deliveries")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/actors/disbursements/recovery")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/actors/mortgage-release")).toBe(true);
  });

  it("ferme par défaut une route de la console qu'aucun rôle ne porte", () => {
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/actors/inconnu")).toBe(false);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/page-inventee")).toBe(false);
  });

  it("ouvre la porte, l'écran de refus et le profil à tout agent", () => {
    for (const role of ["GUICHET", "NOTAIRE", "ADMIN"] as const) {
      expect(canAgentOpenRoute(role, "/portail-cfc/login")).toBe(true);
      expect(canAgentOpenRoute(role, ACCESS_DENIED_PATH)).toBe(true);
      expect(canAgentOpenRoute(role, "/portail-cfc/profil")).toBe(true);
    }
    expect(isCommonAgentRoute("/portail-cfc/profil")).toBe(true);
    expect(isCommonAgentRoute("/portail-cfc/clients")).toBe(false);
  });

  it("ouvre la racine de la console — c'est une entrée de rôle, pas un écran", () => {
    for (const role of ["GUICHET", "NOTAIRE", "ADMIN"] as const) {
      expect(canAgentOpenRoute(role, "/portail-cfc")).toBe(true);
    }
    // …mais elle n'ouvre aucune console par préfixe.
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/analytics")).toBe(false);
  });

  it("fait hériter une page de détail de son écran", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/clients/1234")).toBe(true);
    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/clients/1234")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/actors/notary-cadastre/acte")).toBe(false);
  });

  it("ignore la chaîne de requête", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/clients?tab=duc")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/analytics?kpi=ca")).toBe(false);
  });
});
