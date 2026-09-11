"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import { Search, Bell, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64 min-w-0">
        {/* Top Header Bar matching next-shadcn-admin-dashboard */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Rechercher..."
                className="h-8 w-full rounded-lg border bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-background focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1.5" />
            <div className="flex items-center gap-2 pl-1">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                CFC Workspace
              </span>
            </div>
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
