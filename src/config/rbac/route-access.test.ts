import { describe, expect, it } from "vitest";

import {
  ACCESS_DENIED_PATH,
  canAgentOpenRoute,
  isCommonAgentRoute,
} from "@/config/rbac/route-access";
import { LANDING_BY_ROLE } from "@/config/rbac/sidebar-by-role";
import { STAFF_ROLES } from "@/domain/policies/capabilities";

/**
 * La navigation est la seule description des écrans d'un pôle : ce qu'un
 * agent voit dans le menu est exactement ce qu'il peut ouvrir. Ces
 * vérifications protègent cette équivalence.
 */
describe("contrôle d'accès aux routes de la console", () => {
  it("ouvre à un agent les écrans de son rôle", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/clients")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/actors/agency")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/dossiers")).toBe(true);

    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/actors/notary-cadastre")).toBe(true);
    expect(canAgentOpenRoute("COMITE", "/portail-cfc/actors/credit-committees")).toBe(true);
    expect(canAgentOpenRoute("DIASPORA", "/portail-cfc/actors/agency/diaspora")).toBe(true);
    expect(canAgentOpenRoute("RISQUES_BET", "/portail-cfc/actors/risk-engineering")).toBe(true);
  });

  it("keeps KYC review available only to the authorized manager role", () => {
    const kycRoute = "/portail-cfc/actors/agency/kyc-validation";
    expect(canAgentOpenRoute("GESTIONNAIRE", kycRoute)).toBe(true);
    expect(canAgentOpenRoute("GESTIONNAIRE", kycRoute, [])).toBe(false);

    for (const role of ["GUICHET", "RISQUES_BET", "NOTAIRE", "ADMIN"] as const) {
      expect(canAgentOpenRoute(role, kycRoute), role).toBe(false);
    }
  });

  /**
   * L'écran d'atterrissage doit être **ouvert**.
   *
   * Le middleware y redirige l'agent : un atterrissage absent de la
   * navigation du rôle mènerait à un refus, et l'agent ne pourrait plus
   * jamais entrer dans la console.
   */
  it("permet à chaque rôle d'atteindre son écran d'atterrissage", () => {
    for (const role of STAFF_ROLES) {
      expect(canAgentOpenRoute(role, LANDING_BY_ROLE[role])).toBe(true);
    }
  });

  it("refuse à un agent les écrans d'un autre pôle", () => {
    // The analytics rollup is invoker/RLS-scoped and GUICHET has analytics:read.
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/analytics")).toBe(true);
    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/analytics")).toBe(false);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/settings/catalogue")).toBe(false);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/settings/users")).toBe(false);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/settings/groups")).toBe(false);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/kanban")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/kanban", [])).toBe(false);

    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/actors/disbursements")).toBe(false);

    expect(canAgentOpenRoute("COMITE", "/portail-cfc/actors/notary-cadastre")).toBe(false);

    expect(canAgentOpenRoute("DIASPORA", "/portail-cfc/actors/disbursements")).toBe(false);

    expect(canAgentOpenRoute("RISQUES_BET", "/portail-cfc/settings/catalogue")).toBe(false);
  });

  it("donne à l'administrateur tous les écrans de la Direction Générale", () => {
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/analytics")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/catalogue")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/users")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/roles")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/groups")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/workflow")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/email/deliveries")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/email/provider")).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/audit")).toBe(true);
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
    // …mais elle n'ouvre aucune console par préfixe sans une habilitation.
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/analytics", [])).toBe(false);
  });

  it("fait hériter une page de détail de son écran", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/clients/1234")).toBe(true);
    expect(canAgentOpenRoute("NOTAIRE", "/portail-cfc/clients/1234")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/actors/notary-cadastre/acte")).toBe(false);
  });

  it("ignore la chaîne de requête", () => {
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/clients?tab=duc")).toBe(true);
    expect(canAgentOpenRoute("GUICHET", "/portail-cfc/analytics?kpi=ca")).toBe(true);
  });

  it("uses live grants to open or close a capability-gated route", () => {
    expect(
      canAgentOpenRoute("ADMIN", "/portail-cfc/settings/workflow", []),
    ).toBe(false);
    expect(
      canAgentOpenRoute("ADMIN", "/portail-cfc/settings/workflow", ["workflow:manage"]),
    ).toBe(true);
    expect(canAgentOpenRoute("ADMIN", "/portail-cfc/settings/roles", [])).toBe(false);
    expect(
      canAgentOpenRoute("GUICHET", "/portail-cfc/settings/workflow", ["workflow:manage"]),
    ).toBe(true);
    expect(canAgentOpenRoute("PMO", "/portail-cfc/settings/workflow", ["workflow:manage"])).toBe(true);
    expect(canAgentOpenRoute("AUDIT", "/portail-cfc/settings/roles", ["admin:audit"])).toBe(false);
    expect(canAgentOpenRoute("AUDIT", "/portail-cfc/settings/audit", ["admin:audit"])).toBe(true);
  });
});
