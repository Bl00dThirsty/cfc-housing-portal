"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface PortalHeaderProps {
  /** Le libellé du rôle : « Espace citoyen », « Agence commerciale »… */
  contextLabel: string;
  /** Le logo, à gauche. */
  logo?: React.ReactNode;
  /**
   * Le contenu central : onglets, recherche…
   *
   * Sur un écran étroit, il passe **sous** la barre — la même navigation,
   * pas une seconde.
   */
  children?: React.ReactNode;
  /** Les actions du rôle, avant la cloche et le menu d'identité. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * La coque d'en-tête — **unique**.
 *
 * Les deux portails rendent cette coque : le client et la console ne sont
 * plus deux implémentations parallèles d'une barre supérieure. Ce qui change
 * d'un écran à l'autre est le **contenu** — libellé de rôle, onglets ou
 * recherche, actions rapides — pas la coque.
 */
export function PortalHeader({
  contextLabel,
  logo,
  children,
  actions,
  className,
}: PortalHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center border-b border-border/70 bg-background/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {logo}
          <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
            {contextLabel}
          </span>
        </div>

        <div className="order-last flex w-full min-w-0 items-center justify-start overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center">
          {children}
        </div>

        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

export default PortalHeader;
