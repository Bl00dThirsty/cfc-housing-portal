import { describe, expect, it } from "vitest";

import type { DossierEvent } from "@/domain/entities/processes";
import { actorRoleLabel } from "@/domain/entities/processes";
import {
  eventsForStep,
  indexProcessSteps,
  unassignedEvents,
} from "@/domain/workflows/tracking";

/**
 * Le suivi — l'historique d'une étape.
 *
 * Le mapping étape ↔ événements est une décision métier : il appartient au
 * domaine, pas à l'écran. Ces tests le verrouillent.
 */

function event(overrides: Partial<DossierEvent>): DossierEvent {
  return {
    id: "e1",
    event_type: "KYC_APPROVED",
    actor_role: "GUICHET",
    payload: {},
    legal_basis: null,
    occurred_at: "2026-11-12T10:00:00.000Z",
    ...overrides,
  };
}

describe("suivi — l'historique d'une étape", () => {
  it("attribue un événement par son type", () => {
    const events = [event({ id: "e1", event_type: "KYC_APPROVED" })];

    expect(eventsForStep(events, "CRD-01")).toHaveLength(1);
  });

  it("attribue un événement par le code d'étape qu'il porte", () => {
    const events = [
      event({ id: "e2", event_type: "support.message", payload: { step_code: "CRD-07" } }),
    ];

    expect(eventsForStep(events, "CRD-07")).toHaveLength(1);
    expect(eventsForStep(events, "CRD-01")).toHaveLength(0);
  });

  it("n'attribue pas un événement à une autre étape", () => {
    const events = [event({ id: "e3", event_type: "KYC_APPROVED" })];

    expect(eventsForStep(events, "CRD-12")).toHaveLength(0);
  });

  it("garde les événements qui n'appartiennent à aucune étape", () => {
    const events = [
      event({ id: "e4", event_type: "DOSSIER_UPDATED" }),
      event({ id: "e5", event_type: "KYC_APPROVED" }),
    ];

    const orphans = unassignedEvents(events, ["CRD-01"]);
    expect(orphans.map((item) => item.id)).toEqual(["e4"]);
  });
});

describe("suivi — catalogue des étapes", () => {
  it("uses the process steps and labels supplied by the database", () => {
    const result = indexProcessSteps({
      currentPhase: "kyc_savings",
      eventTypes: [],
      phaseOrder: ["kyc_savings"],
      phaseLabels: { kyc_savings: "Instruction personnalisée" },
      processSteps: [
        {
          code: "CUSTOM-01",
          label: "Contrôle défini par le catalogue",
          process: "CRD",
          phase: "kyc_savings",
          lane: "agence",
          external: false,
        },
      ],
    });

    expect(result).toEqual([
      expect.objectContaining({
        code: "CUSTOM-01",
        label: "Contrôle défini par le catalogue",
        phaseLabel: "Instruction personnalisée",
        status: "current",
      }),
    ]);
  });
});

describe("journal — le rôle de l'auteur", () => {
  it("traduit un rôle connu", () => {
    expect(actorRoleLabel("GUICHET")).toBe("Agence");
  });

  it("ne devine pas un rôle inconnu", () => {
    expect(actorRoleLabel("ROLE_INCONNU")).toBe("Acteur");
  });

  it("traite l'absence de rôle", () => {
    expect(actorRoleLabel(null)).toBe("Acteur");
  });
});
