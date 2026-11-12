"use client";

/**
 * Menu d'identité — le point d'entrée unique vers son compte.
 *
 * Il porte l'identité **réelle** de la personne connectée (issue de
 * `public.actors` + `public.staff_assignments`), l'accès à la page de profil
 * et la déconnexion. Les deux portails l'utilisent : un agent et un emprunteur
 * se déconnectent par le même chemin.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

export interface UserMenuProps {
  /** Page de profil de l'utilisateur, propre à son portail. */
  profileHref: string;
}

export function UserMenu({ profileHref }: UserMenuProps) {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left outline-none transition-colors hover:bg-muted/40"
          aria-label="Menu du compte"
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
          {currentUser.agency ? (
            <p className="truncate text-[10.5px] text-muted-foreground">
              {currentUser.agency}
            </p>
          ) : null}
          <p className="truncate font-mono text-[10px] text-muted-foreground/80">
            {currentUser.email}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer py-1.5 rounded-md">
          <Link href={profileHref}>
            <UserRound className="mr-2 size-3.5" />
            <span>Mon profil</span>
          </Link>
        </DropdownMenuItem>

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
  );
}
