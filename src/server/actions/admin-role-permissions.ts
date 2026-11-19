"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isCapability, isStaffRole } from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

const rolePermissionSchema = z.object({
  roleCode: z.string().trim().max(64),
  capabilities: z.array(z.string().max(64)).max(100),
});

export type AdminRolePermissionActionResult =
  | { ok: true; grantCount: number }
  | { ok: false; error: string };

export async function saveRoleCapabilitiesAction(input: unknown): Promise<AdminRolePermissionActionResult> {
  const parsed = rolePermissionSchema.safeParse(input);
  if (!parsed.success || !isStaffRole(parsed.data.roleCode) || parsed.data.roleCode === "ADMIN") {
    return { ok: false, error: "Le rôle sélectionné ne peut pas être modifié." };
  }
  if (!parsed.data.capabilities.every(isCapability)) {
    return { ok: false, error: "Une habilitation sélectionnée n’existe plus dans le catalogue." };
  }

  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:roles", profile.capabilities)) {
    return { ok: false, error: "La gestion des habilitations est réservée aux personnes autorisées." };
  }

  const supabase = await createServerSupabaseClient();
  const capabilities = [...new Set(parsed.data.capabilities)];
  const { data, error } = await supabase.rpc("cfc_set_role_capabilities", {
    p_role: parsed.data.roleCode,
    p_caps: capabilities,
  });
  if (error) {
    if (error.message.includes("admin_role_locked")) return { ok: false, error: "Le rôle ADMIN de référence est protégé." };
    if (error.message.includes("invalid_capability")) return { ok: false, error: "Une habilitation n’existe plus dans le catalogue." };
    if (error.message.includes("admin_roles_forbidden")) return { ok: false, error: "Vos droits de gestion des habilitations ont changé. Rechargez la page." };
    return { ok: false, error: "Les droits du rôle n’ont pas pu être enregistrés." };
  }

  revalidatePath("/portail-cfc/settings/roles");
  revalidatePath("/portail-cfc/settings/users");
  return { ok: true, grantCount: typeof data === "number" ? data : capabilities.length };
}
