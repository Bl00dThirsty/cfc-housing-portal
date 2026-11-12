"use client";

/**
 * En-tête de l'espace citoyen.
 *
 * Il donne à l'emprunteur les trois parcours qu'il vit réellement : son
 * dossier, le simulateur d'épargne et le suivi de son prêt. Le simulateur et
 * le suivi sont des pages **publiques** : l'emprunteur y accède depuis son
 * espace authentifié sans avoir à repasser par la navigation publique.
 *
 * La cloche de notifications et le menu d'identité sont partagés avec la
 * console CFC : un seul chemin vers son compte, dans les deux portails.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, FileText, HelpCircle, ShieldCheck } from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Onglets du portail client. */
const TABS = [
  { href: "/portail-client", label: "Mon dossier", icon: FileText },
  { href: "/simulator", label: "Simulateur", icon: Calculator },
  { href: "/tracking", label: "Suivi DUC", icon: ShieldCheck },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

export function ClientHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/portail-client" className="group flex items-center gap-3">
          <div className="relative h-9 w-32 transition-transform group-hover:scale-[1.02]">
            <Image
              src="/images/logo-cfc.png"
              alt="Crédit Foncier du Cameroun"
              fill
              sizes="128px"
              priority
              className="object-contain"
            />
          </div>
          <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
            Espace citoyen
          </span>
        </Link>

        <nav
          aria-label="Navigation de l'espace citoyen"
          className="hidden items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 text-xs font-medium md:flex"
        >
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                  active
                    ? "bg-background font-semibold text-cfc-brown shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <UserMenu profileHref="/portail-client/profil" />
        </div>
      </div>

      {/* Onglets en bandeau sous l'en-tête, en dessous de la largeur md. */}
      <nav
        aria-label="Navigation de l'espace citoyen (mobile)"
        className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-1.5 text-xs font-medium md:hidden"
      >
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                active
                  ? "bg-muted font-semibold text-cfc-brown"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
