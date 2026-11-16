import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortalHeader } from "@/components/layout/portal-header";

/**
 * La coque d'en-tête — unique.
 *
 * Les deux portails la rendent : ce qui change d'un écran à l'autre est le
 * contenu, jamais la coque.
 */
describe("coque d'en-tête", () => {
  it("affiche le libellé du rôle", () => {
    render(<PortalHeader contextLabel="Agence commerciale" />);

    expect(screen.getByText("Agence commerciale")).toBeInTheDocument();
  });

  it("rend les actions fournies", () => {
    render(
      <PortalHeader
        contextLabel="Comités de crédit"
        actions={<button type="button">Dossier en délibération</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Dossier en délibération" }),
    ).toBeInTheDocument();
  });
});
