import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from "@/components/layout/navbar";

/**
 * En-tête public — les portes du site.
 *
 * Deux règles y sont vérifiées, toutes deux issues du constat fait sur la
 * page de connexion :
 *
 * - le visiteur doit trouver **« Créer un compte »** sans avoir à le
 *   deviner : c'est l'appel à l'action de l'en-tête ;
 * - la **porte de l'agent** ne doit pas être répétée : l'en-tête et le pied
 *   de page la montraient tous les deux, pour la même cible.
 */

const pathname = vi.hoisted(() => ({ current: "/faq" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe("Navbar public", () => {
  beforeEach(() => {
    pathname.current = "/faq";
  });

  it("propose la création de compte comme appel à l'action", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /créer un compte/i })).toHaveAttribute(
      "href",
      "/onboarding",
    );
  });

  it("garde la connexion accessible, en lien discret", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /se connecter/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("ne répète pas la porte de l'agent : elle est dans le pied de page", () => {
    render(<Navbar />);

    expect(screen.queryByText(/espace agent/i)).toBeNull();
    expect(screen.queryByRole("link", { name: /espace agent/i })).toBeNull();
  });

  it("ne propose pas l'appel à l'action sur la page d'inscription elle-même", () => {
    pathname.current = "/onboarding";

    render(<Navbar />);

    expect(screen.queryByRole("link", { name: /créer un compte/i })).toBeNull();
    expect(screen.getByRole("link", { name: /se connecter/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
