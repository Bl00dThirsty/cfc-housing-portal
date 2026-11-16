import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toast } from "sonner";

import { CfcToaster } from "@/components/ui/toaster";

/**
 * Le toaster — la preuve qu'un signal s'affiche.
 *
 * Ce test ne simule pas `sonner` : il utilise le vrai toaster et le vrai
 * `toast`. C'est le seul moyen de savoir que le signal **arrive à l'écran**,
 * et pas seulement qu'un appel a été fait.
 */
describe("le toaster", () => {
  it("affiche le refus qui lui est confié", async () => {
    render(<CfcToaster />);

    act(() => {
      toast.error("Le transfert a échoué.");
    });

    expect(await screen.findByText("Le transfert a échoué.")).toBeInTheDocument();
  });

  it("affiche la réussite qui lui est confiée", async () => {
    render(<CfcToaster />);

    act(() => {
      toast.success("Dossier enregistré.");
    });

    expect(await screen.findByText("Dossier enregistré.")).toBeInTheDocument();
  });
});
