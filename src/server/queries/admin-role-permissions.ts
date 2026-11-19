import "server-only";

import {
  mapAdminRolePermissionDirectory,
  type AdminCapabilityRow,
  type AdminRoleCapabilityRow,
  type AdminRolePermissionDirectory,
  type AdminRoleRow,
} from "@/domain/entities/admin-role-permissions";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AdminRolePermissionResult =
  | { ok: true; data: AdminRolePermissionDirectory }
  | { ok: false; error: string };

export async function getAdminRolePermissionDirectory(): Promise<AdminRolePermissionResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:roles", profile.capabilities)) {
    return { ok: false, error: "La gestion des habilitations est réservée aux personnes autorisées." };
  }

  const supabase = await createServerSupabaseClient();
  const [rolesResult, capabilitiesResult, grantsResult] = await Promise.all([
    supabase.from("cfc_roles").select("code, label, description, pole_code, scope, sort_order, deleted_at").is("deleted_at", null).order("sort_order", { ascending: true }),
    supabase.from("cfc_capabilities").select("code, label, group_label, description, sort_order, deleted_at").is("deleted_at", null).order("sort_order", { ascending: true }),
    supabase.from("cfc_role_capabilities").select("role_code, capability"),
  ]);

  if (rolesResult.error || capabilitiesResult.error || grantsResult.error) {
    return { ok: false, error: "Le catalogue des rôles et habilitations est indisponible. Réessayez après vérification des référentiels." };
  }

  return {
    ok: true,
    data: mapAdminRolePermissionDirectory(
      (rolesResult.data ?? []) as AdminRoleRow[],
      (capabilitiesResult.data ?? []) as AdminCapabilityRow[],
      (grantsResult.data ?? []) as AdminRoleCapabilityRow[],
    ),
  };
}
