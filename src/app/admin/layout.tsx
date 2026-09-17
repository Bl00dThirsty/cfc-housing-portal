"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Search, Bell, LogOut, ChevronDown, Check } from "lucide-react";
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
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { landingPathForRole } from "@/config/rbac/sidebar-by-role";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, allUsers, loginAsUser, logout } = useAuth();

  // If on login page, render clean full-width layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Recherche générale DUC, prêt, client..."
                className="h-8 w-full rounded-md border bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-background focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground relative">
              <Bell className="size-3.5" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-emerald-500" />
            </Button>

            <Separator orientation="vertical" className="h-4 mx-1" />

            {/* Active User Menu & Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/40 transition-colors text-left outline-none cursor-pointer"
                >
                  <Avatar className="size-7 rounded-md shrink-0">
                    <AvatarFallback className={`rounded-md text-[10px] font-bold ${currentUser.avatarTone}`}>
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col min-w-0">
                    <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[130px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[130px]">
                      {currentUser.roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-xl text-xs">
                <div className="p-2 bg-muted/40 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{currentUser.name}</span>
                    <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 h-4 font-mono font-medium">
                      {currentUser.role}
                    </Badge>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground truncate">{currentUser.agency}</p>
                  <p className="text-[10px] text-muted-foreground/80 font-mono truncate">{currentUser.email}</p>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10.5px] font-semibold text-muted-foreground">
                  Changer de profil métier (Guichet Unique)
                </DropdownMenuLabel>

                {allUsers.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => {
                      loginAsUser(u.id);
                      router.push(landingPathForRole(u.role));
                    }}
                    className="flex items-center justify-between cursor-pointer py-1.5 rounded-md"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-5 rounded-xs shrink-0">
                        <AvatarFallback className={`text-[8.5px] font-bold ${u.avatarTone}`}>
                          {u.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-xs truncate">{u.name}</span>
                        <span className="text-[9.5px] text-muted-foreground truncate">{u.roleLabel}</span>
                      </div>
                    </div>
                    {u.id === currentUser.id && <Check className="size-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive py-1.5 rounded-md"
                >
                  <LogOut className="size-3.5 mr-2" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
