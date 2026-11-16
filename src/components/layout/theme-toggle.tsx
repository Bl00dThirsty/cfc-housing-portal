"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
}

/**
 * ThemeToggle — bascule la classe `dark` sur `<html>`.
 *
 * `next-themes` est monté dans `src/app/layout.tsx` avec `attribute="class"`,
 * ce qu'attend `globals.css` : `@custom-variant dark (&:is(.dark *))`.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Le thème résolu est inconnu pendant le rendu serveur : on affiche une
  // icône stable jusqu'à l'hydratation pour éviter une divergence de balisage.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8 text-subtle hover:text-foreground", className)}
      aria-label={
        mounted
          ? isDark
            ? "Activer le thème clair"
            : "Activer le thème sombre"
          : "Changer de thème"
      }
      title={mounted ? (isDark ? "Thème clair" : "Thème sombre") : undefined}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? (
        <Moon className="size-3.5" />
      ) : (
        <Sun className="size-3.5" />
      )}
    </Button>
  );
}

export default ThemeToggle;
