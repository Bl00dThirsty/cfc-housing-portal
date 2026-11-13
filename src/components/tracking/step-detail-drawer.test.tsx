import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDetailDrawer } from "@/components/tracking/step-detail-drawer";
import type { DossierEvent } from "@/domain/entities/processes";
import type { IndexedStep } from "@/domain/workflows/tracking";

/**
 * Le panneau d'étape — il dit qui, quoi, quand.
 *
 * Un panneau vide n'est pas un panneau en erreur : les deux états sont
 * distincts, et l'échec de lecture porte un refus.
 */

const STEP: IndexedStep = {
  code: "CRD-07",
  label: "Décision du directeur d'agence",
  phase: "committees",
  phaseLabel: "Décision d'octroi",
  lane: "agence",
  external: false,
  status: "done",
};

const EVENTS: DossierEvent[] = [
  {
    id: "e1",
    event_type: "COMMITTEE_DECISION",
    actor_role: "COMITE",
    payload: {},
    legal_basis: null,
    occurred_at: "2026-11-12T10:00:00.000Z",
  },
  {
    id: "e2",
    event_type: "support.message",
    actor_role: "GUICHET",
    payload: { step_code: "CRD-07" },
    legal_basis: null,
    occurred_at: "2026-11-11T09:00:00.000Z",
  },
];

describe("panneau d'étape", () => {
  it("dit qui a fait quoi, quand", () => {
    render(
      <StepDetailDrawer
        step={STEP}
        events={EVENTS}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("CRD-07")).toBeInTheDocument();
    // Le libellé de l'événement peut être rendu deux fois : le panneau est
    // un portail, et son contenu est Lu deux fois par les lecteurs d'écran.
    expect(screen.getAllByText("Décision du comité de crédit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Comité de crédit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Message échangé").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agence").length).toBeGreaterThan(0);
  });

  it("distingue l'absence d'événement de l'échec de lecture", () => {
    render(
      <StepDetailDrawer
        step={STEP}
        events={[]}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText(/Aucun événement pour cette étape/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("affiche un refus quand la lecture a échoué", () => {
    render(
      <StepDetailDrawer
        step={STEP}
        events={[]}
        open
        onOpenChange={() => {}}
        error="Base de données inaccessible."
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Base de données inaccessible.")).toBeInTheDocument();
  });
});
