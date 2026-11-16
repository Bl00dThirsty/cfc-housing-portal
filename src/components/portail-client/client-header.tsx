"use client";

/**
 * En-tête de l'espace citoyen.
 *
 * C'est la **coque** d'en-tête, habillée pour le citoyen : ses onglets, sa
 * cloche, son thème et son menu d'identité. La coque elle-même est partagée
 * avec la console ; ce qui change, c'est le **contenu**.
 *
 * Le simulateur et le suivi sont des pages **publiques** : l'emprunteur y
 * accède depuis son espace authentifié sans avoir à repasser par la
 * navigation publique.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, FileText, HelpCircle, ShieldCheck } from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { PortalHeader } from "@/components/layout/portal-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Onglets du portail client — l'unique source de la navigation. */
const TABS = [
  { href: "/portail-client", label: "Mon dossier", icon: FileText },
  { href: "/simulator", label: "Simulateur", icon: Calculator },
  { href: "/tracking", label: "Suivi DUC", icon: ShieldCheck },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

export function ClientHeader() {
  const pathname = usePathname();

  return (
    <PortalHeader
      contextLabel="Espace citoyen"
      className="h-16"
      logo={
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
        </Link>
      }
      actions={
        <>
          <NotificationBell />
          <ThemeToggle />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <UserMenu profileHref="/portail-client/profil" />
        </>
      }
    >
      <nav
        aria-label="Navigation de l'espace citoyen"
        className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/40 p-1 text-xs font-medium"
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
    </PortalHeader>
  );
}
