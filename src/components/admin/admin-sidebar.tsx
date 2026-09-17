"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontal, Layers, ArrowLeft, Sparkles, CheckCircle2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getSidebarSectionsForRole, landingPathForRole } from "@/config/rbac/sidebar-by-role";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, allUsers, loginAsUser, logout } = useAuth();
  const navSections = React.useMemo(() => getSidebarSectionsForRole(currentUser.role), [currentUser.role]);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-card text-card-foreground">
      {/* Header / Brand */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <Link href="/admin/analytics" className="flex items-center gap-2.5 font-semibold text-sm">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Layers className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight font-semibold tracking-tight">CFC Admin</span>
            <span className="text-[10px] text-muted-foreground font-normal">CFC Enterprise Portal</span>
          </div>
        </Link>
        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4.5">
          v2.2
        </Badge>
      </div>

      {/* Nav List - Ultra Clean / Pure Typography / Flyout Sub-Apps (...) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="flex h-7 items-center px-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
              {section.title}
            </h4>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex h-8 items-center justify-between rounded-lg px-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    )}
                  >
                    {/* Primary direct link (NO ICON) */}
                    <Link
                      href={item.href}
                      className="flex-1 truncate py-1.5 pr-1 text-xs"
                    >
                      {item.title}
                    </Link>

                    {/* Right side: Badge + Flyout Menu Trigger (...) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-normal px-1.5 py-0 h-4.5",
                            isActive ? "bg-background/80 text-foreground" : "bg-muted/60 text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}

                      {/* Dropdown Menu for Sub-Applications */}
                      {item.subItems && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100"
                              aria-label={`Applications pour ${item.title}`}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="w-72 p-1.5 shadow-xl border rounded-xl"
                          >
                            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-foreground font-semibold">{item.title}</span>
                                {item.groupCode && (
                                  <span className="text-[11px] font-normal text-muted-foreground">
                                    {item.groupCode}
                                  </span>
                                )}
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <div className="space-y-0.5 pt-0.5">
                              {item.subItems.map((sub) => {
                                if (sub.href) {
                                  return (
                                    <DropdownMenuItem key={sub.id} asChild>
                                      <Link
                                        href={sub.href}
                                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                          <span className="truncate font-medium">{sub.title}</span>
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] font-medium text-emerald-700 bg-emerald-500/10 px-1.5 py-0 h-4 border-transparent shrink-0"
                                        >
                                          Actif
                                        </Badge>
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                }

                                return (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg text-muted-foreground/80 hover:bg-muted/30 select-none transition-colors"
                                  >
                                    <span className="truncate">{sub.title}</span>
                                    {sub.badge && (
                                      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/90 bg-muted px-1.5 py-0.5 rounded border border-border/50 shrink-0">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick info card */}
        <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Guichet Unique Connecté</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Synchronisation temps réel avec le core-banking Carthago & la campagne Épargne Habitat.
          </p>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t p-3 space-y-2">
        <Link
          href="/"
          className="flex h-7 w-full items-center justify-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-2xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Portail Citoyen</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/50 transition-colors cursor-pointer text-left">
              <Avatar className="size-8 rounded-lg shrink-0">
                <AvatarFallback className={`rounded-lg text-xs font-bold ${currentUser.avatarTone}`}>
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-xs font-semibold truncate leading-tight text-foreground">
                  {currentUser.name}
                </span>
                <span className="text-[10.5px] text-muted-foreground truncate">
                  {currentUser.roleLabel}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 p-1.5 rounded-xl text-xs">
            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Changer de compte métier
            </DropdownMenuLabel>
            {allUsers.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => {
                  loginAsUser(u.id);
                  router.push(landingPathForRole(u.role));
                }}
                className="cursor-pointer text-xs flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`size-2 rounded-full shrink-0 ${u.id === currentUser.id ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                  <span className="truncate">{u.name}</span>
                </div>
                <span className="text-[9.5px] text-muted-foreground font-mono shrink-0">{u.role}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/login" className="cursor-pointer text-xs">
                Page de connexion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
              <LogOut className="size-3.5 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}


