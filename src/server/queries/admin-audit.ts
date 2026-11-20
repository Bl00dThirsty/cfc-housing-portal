import "server-only";

import type { AdminAuditDashboard } from "@/domain/entities/admin-audit";
import { mapAdminAuditEvents } from "@/domain/entities/admin-audit";
import { hasCapability } from "@/domain/policies/permissions";
import { getEmailEnv } from "@/server/env";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

type CodeRow = { code: string };
type GrantRow = { role_code: string; capability: string };
type RawRow = Record<string, unknown>;

export type AdminAuditDashboardResult =
  | { ok: true; data: AdminAuditDashboard }
  | { ok: false; error: string };

export async function getAdminAuditDashboard(): Promise<AdminAuditDashboardResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:audit", profile.capabilities)) {
    return { ok: false, error: "Le journal et les indicateurs système sont réservés aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const [events, roles, capabilities, grants, processes, steps] = await Promise.all([
    supabase.rpc("cfc_list_admin_audit", { p_limit: 100 }),
    supabase.from("cfc_roles").select("code").is("deleted_at", null),
    supabase.from("cfc_capabilities").select("code").is("deleted_at", null),
    supabase.from("cfc_role_capabilities").select("role_code, capability"),
    supabase.from("cfc_processes").select("code").is("deleted_at", null),
    supabase.from("cfc_process_steps").select("code").is("deleted_at", null),
  ]);

  if ([events, roles, capabilities, grants, processes, steps].some((result) => result.error)) {
    return { ok: false, error: "Le journal ou les référentiels système ne peuvent pas être chargés. Réessayez après vérification de la base." };
  }

  const capabilityCodes = new Set(((capabilities.data ?? []) as CodeRow[]).map((row) => row.code));
  const grantRows = (grants.data ?? []) as GrantRow[];
  const orphanedGrants = grantRows.filter((grant) => !capabilityCodes.has(grant.capability)).length;
  const email = getEmailEnv();

  return {
    ok: true,
    data: {
      events: mapAdminAuditEvents((events.data ?? []) as RawRow[]),
      readiness: {
        activeRoles: ((roles.data ?? []) as CodeRow[]).length,
        activeCapabilities: capabilityCodes.size,
        orphanedGrants,
        activeProcesses: ((processes.data ?? []) as CodeRow[]).length,
        activeWorkflowSteps: ((steps.data ?? []) as CodeRow[]).length,
        emailProvider: email.provider,
        emailConfigured: email.provider !== "none",
      },
    },
  };
}
