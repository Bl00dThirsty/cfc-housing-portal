"use client";

/**
 * Chrome de la console d'administration.
 *
 * La partie serveur (`src/app/portail-cfc/layout.tsx`) a déjà vérifié la session et
 * le rôle : ce composant n'affiche que l'identité **réelle** de l'agent
 * connecté. Le sélecteur de profil métier a été supprimé — il permettait une
 * auto-élévation de privilèges en un clic.
 */

import * as React from "react";
import Link from "next/link";
import { MessagesSquare, Search } from "lucide-react";

import AdminSidebar from "@/components/portail-cfc/admin-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <div className="relative w-64 md:w-80">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Recherche générale DUC, prêt, client..."
                className="h-8 w-full rounded-md border bg-muted/30 pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <NotificationBell />

            <ThemeToggle />

            <Separator orientation="vertical" className="mx-1 h-4" />

            <UserMenu profileHref="/portail-cfc/profil" />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
