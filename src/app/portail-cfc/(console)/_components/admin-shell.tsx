"use client";

/**
 * Chrome de la console d'administration.
 *
 * La partie serveur (`src/app/portail-cfc/layout.tsx`) a déjà vérifié la session et
 * le rôle : ce composant n'affiche que l'identité **réale** de l'agent
 * connecté. Le sélecteur de profil métier a été supprimé — il permettait une
 * auto-élévation de privilèges en un clic.
 *
 * L'en-tête est la **coque** partagée, habillée par le rôle : son libellé de
 * pôle, la recherche scopée et ses actions rapides viennent de la
 * configuration RBAC — jamais d'ici.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Calculator,
  ChartColumn,
  ClipboardCheck,
  FilePen,
  Gavel,
  Globe,
  Landmark,
  MessagesSquare,
  PiggyBank,
  Search,
  ShieldAlert,
  ShieldCheck,
  SquareKanban,
  Stamp,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import AdminSidebar from "@/components/portail-cfc/admin-sidebar";
import { PortalHeader } from "@/components/layout/portal-header";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  roleHeaderConfigFor,
  visibleQuickActions,
} from "@/config/rbac/role-header";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/auth-data";

/** Les icônes des actions rapides, par nom. */
const ICONS: Record<string, LucideIcon> = {
  ArrowLeftRight,
  Calculator,
  ChartColumn,
  ClipboardCheck,
  FilePen,
  Gavel,
  Globe,
  Landmark,
  MessagesSquare,
  PiggyBank,
  ShieldAlert,
  ShieldCheck,
  SquareKanban,
  Stamp,
  Upload,
  UserPlus,
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const role = (profile?.role ?? "CITIZEN") as AppRole;
  const config = roleHeaderConfigFor(role);
  const quickActions = visibleQuickActions(role, profile?.capabilities);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <PortalHeader
          contextLabel={config.contextLabel}
          className="z-20 h-12 border-b bg-background/95 px-4 backdrop-blur lg:px-6"
          actions={
            <>
              {quickActions.map((action) => {
                const Icon = ICONS[action.icon];
                return (
                  <Button
                    key={action.id}
                    asChild
                    variant="muted"
                    size="sm"
                    className="hidden h-8 gap-1.5 text-xs xl:inline-flex"
                  >
                    <Link href={action.href}>
                      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                      {action.label}
                    </Link>
                  </Button>
                );
              })}

              {config.showSupport ? (
                <Button
                  asChild
                  variant="muted"
                  size="sm"
                  className="hidden h-8 gap-1.5 text-xs md:inline-flex"
                >
                  <Link href="/portail-cfc/support">
                    <MessagesSquare className="size-3.5" aria-hidden />
                    File de support
                  </Link>
                </Button>
              ) : null}

              <NotificationBell />

              <ThemeToggle />

              <Separator orientation="vertical" className="mx-1 h-4" />

              <UserMenu profileHref="/portail-cfc/profil" />
            </>
          }
        >
          <div className="relative w-64 md:w-80">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              aria-label={config.search?.placeholder ?? "Rechercher"}
              placeholder={config.search?.placeholder ?? "Rechercher"}
              className="h-8 w-full rounded-md border bg-muted/30 pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring"
            />
          </div>
        </PortalHeader>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
