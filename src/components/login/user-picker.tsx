"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type AdminUser, SEEDED_ADMIN_USERS } from "@/lib/auth-data";

export interface UserPickerProps {
  users?: AdminUser[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserPicker({
  users = SEEDED_ADMIN_USERS,
  value,
  onChange,
  placeholder = "Sélectionner un profil métier...",
  disabled = false,
}: UserPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedUser = users.find((u) => u.id === value) ?? users[0];

  // Group users by department / pole
  const filteredUsers = React.useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roleLabel.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.agency.toLowerCase().includes(q)
    );
  }, [users, search]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, AdminUser[]>();
    for (const u of filteredUsers) {
      const dept = u.department || "Autres Pôles";
      if (!map.has(dept)) {
        map.set(dept, []);
      }
      map.get(dept)!.push(u);
    }
    return Array.from(map.entries());
  }, [filteredUsers]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-12 px-3 border-input bg-card hover:bg-muted/40 hover:border-primary/40 text-left transition-colors"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar className="size-8 rounded-full shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-xs font-bold text-white shadow-2xs",
                    selectedUser.avatarTone || "bg-primary"
                  )}
                >
                  {selectedUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {selectedUser.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono shrink-0">
                    {selectedUser.role}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  {selectedUser.roleLabel} · {selectedUser.department}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[360px] sm:w-[420px] max-h-[380px] overflow-y-auto p-1.5 space-y-1 shadow-md"
      >
        {/* Search Header */}
        <div className="p-1.5 sticky top-0 bg-popover z-10">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher par nom, rôle, pôle ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Aucun profil métier correspondant.
          </div>
        ) : (
          grouped.map(([department, deptUsers]) => (
            <div key={department} className="space-y-0.5">
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 px-2 py-1">
                <Building2 className="size-3 text-muted-foreground/70" />
                <span>{department}</span>
              </DropdownMenuLabel>
              {deptUsers.map((user) => {
                const isSelected = user.id === value;
                return (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors text-xs",
                      isSelected && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <div className="size-4 flex items-center justify-center shrink-0">
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </div>
                    <Avatar className="size-7 rounded-full shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-bold text-white",
                          user.avatarTone || "bg-primary"
                        )}
                      >
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground truncate">
                          {user.name}
                        </span>
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className="text-[9.5px] px-1 py-0 h-4 font-mono shrink-0"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {user.roleLabel} · {user.email}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
