"use client";

/**
 * Chrome de la console d'administration.
 *
 * La partie serveur (`src/app/admin/layout.tsx`) a déjà vérifié la session et
 * le rôle : ce composant n'affiche que l'identité **réelle** de l'agent
 * connecté. Le sélecteur de profil métier a été supprimé — il permettait une
 * auto-élévation de privilèges en un clic.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, ChevronDown } from "lucide-react";

import AdminSidebar from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

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
              variant="ghost"
              size="icon"
              className="relative size-8 text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-3.5" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-emerald-500" />
            </Button>

            <ThemeToggle />

            <Separator orientation="vertical" className="mx-1 h-4" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left outline-none transition-colors hover:bg-muted/40"
                >
                  <Avatar className="size-7 shrink-0 rounded-md">
                    <AvatarFallback
                      className={`rounded-md text-[10px] font-bold ${currentUser.avatarTone}`}
                    >
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 flex-col md:flex">
                    <span className="max-w-[130px] truncate text-xs font-semibold leading-tight text-foreground">
                      {currentUser.name}
                    </span>
                    <span className="max-w-[130px] truncate text-[10px] font-medium text-muted-foreground">
                      {currentUser.roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="ml-0.5 size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 text-xs">
                <div className="space-y-1 rounded-lg bg-muted/40 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{currentUser.name}</span>
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 py-0 font-mono text-[9.5px] font-medium"
                    >
                      {currentUser.role}
                    </Badge>
                  </div>
                  <p className="truncate text-[10.5px] text-muted-foreground">
                    {currentUser.agency}
                  </p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground/80">
                    {currentUser.email}
                  </p>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10.5px] font-semibold text-muted-foreground">
                  Habilitation en cours
                </DropdownMenuLabel>
                <p className="px-2 pb-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
                  Votre rôle est défini par la Direction Générale. Pour une modification
                  d&apos;habilitation, adressez-vous au superviseur DSI.
                </p>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer py-1.5 rounded-md text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-3.5" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
