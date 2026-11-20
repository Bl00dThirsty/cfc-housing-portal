import "server-only";

import { isStaffRole } from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";
import {
  mapAdminStaffAccount,
  type AdminAgencyOption,
  type AdminRoleOption,
  type AdminStaffDirectory,
  type AdminStaffAccountRow,
} from "@/domain/entities/admin-user";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AdminStaffDirectoryResult =
  | { ok: true; data: AdminStaffDirectory }
  | { ok: false; error: string };

/** Reads only staff profile and assignment data; the RPC never returns client KYC. */
export async function getAdminStaffDirectory(): Promise<AdminStaffDirectoryResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:users", profile.capabilities)) {
    return { ok: false, error: "La gestion des comptes est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const [staffResult, roleResult, agencyResult] = await Promise.all([
    supabase.rpc("cfc_admin_list_staff"),
    supabase
      .from("cfc_roles")
      .select("code, label, pole_code, scope")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("agencies")
      .select("id, code, label, city, region, is_diaspora_desk")
      .is("deleted_at", null)
      .order("label", { ascending: true }),
  ]);

  if (staffResult.error) {
    return { ok: false, error: "Le répertoire du personnel ne peut pas être chargé." };
  }
  if (roleResult.error || agencyResult.error) {
    return { ok: false, error: "Les rôles ou agences du répertoire ne peuvent pas être chargés. Réessayez après vérification des référentiels." };
  }

  const rows = (staffResult.data ?? []) as AdminStaffAccountRow[];
  const roleRows = roleResult.data ?? [];
  const agencyRows = agencyResult.data ?? [];

  const roleOptions: AdminRoleOption[] = roleRows
    .filter((role: { code: string }) => isStaffRole(role.code))
    .map((role: { code: string; label: string; pole_code: string | null; scope: string | null }) => ({
      code: role.code,
      label: role.label,
      poleCode: role.pole_code,
      scope: role.scope,
    }));
  const roleLabels = new Map(roleOptions.map((role) => [role.code, role.label]));

  const agencies: AdminAgencyOption[] = agencyRows.map((agency: {
    id: string;
    code: string;
    label: string;
    city: string | null;
    region: string | null;
    is_diaspora_desk: boolean;
  }) => ({
    id: agency.id,
    code: agency.code,
    label: agency.label,
    city: agency.city,
    region: agency.region,
    isDiasporaDesk: agency.is_diaspora_desk,
  }));

  const avatarUrls = new Map<string, string>();
  await Promise.all(rows.map(async (row) => {
    if (!row.avatar_path) return;
    const { data } = await supabase.storage
      .from("profile-avatars")
      .createSignedUrl(row.avatar_path, 3600);
    if (data?.signedUrl) avatarUrls.set(row.id, data.signedUrl);
  }));

  return {
    ok: true,
    data: {
      users: rows.map((row) => mapAdminStaffAccount(row, roleLabels, avatarUrls)),
      roles: roleOptions,
      agencies,
      currentUserId: profile.actorId,
    },
  };
}
