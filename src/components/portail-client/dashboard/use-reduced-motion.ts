"use client";

import * as React from "react";

/**
 * Respecte le réglage système « réduire les animations ».
 *
 * Les graphiques du tableau de bord n'animent leurs séries que si
 * l'emprunteur l'a autorisé. Le réglage peut être absent (environnement de
 * test, navigateur ancien) : dans ce cas, rien n'est animé par défaut.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    if (typeof query.addEventListener !== "function") return;

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
