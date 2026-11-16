import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TrackingStepper } from "@/app/tracking/_components/tracking-stepper";
import type { IndexedStep } from "@/domain/workflows/tracking";

/**
 * Le suivi — les étapes sont cliquables.
 *
 * Cliquer sur une étape, c'est demander son historique : qui a fait quoi,
 * quand. Le panneau s'ouvre sur le journal du dossier.
 */

const STEPS: IndexedStep[] = [
  {
    code: "CRD-07",
    label: "Décision du directeur d'agence",
    phase: "committees",
    phaseLabel: "Décision d'octroi",
    lane: "agence",
    external: false,
    status: "done",
  },
];

describe("suivi — les étapes sont cliquables", () => {
  it("ouvre le panneau de l'étape", async () => {
    const user = userEvent.setup();

    render(<TrackingStepper steps={STEPS} progress={50} events={[]} />);

    await user.click(screen.getByRole("button", { name: /CRD-07/ }));

    // Le panneau est ouvert : c'est lui qui le dit — l'étape est affichée
    // dans la frise aussi.
    expect(await screen.findByText(/Aucun événement pour cette étape/)).toBeInTheDocument();
    expect(screen.getAllByText("Décision du directeur d'agence").length).toBeGreaterThan(0);
  });
});
