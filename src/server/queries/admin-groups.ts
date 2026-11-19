import "server-only";

import type { AdminGroup, AdminGroupKind } from "@/domain/entities/admin-group";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

interface AdminGroupRow {
  group_type: AdminGroupKind;
  id: string | null;
  code: string;
  label: string;
  description: string | null;
  city: string | null;
  region: string | null;
  is_diaspora_desk: boolean;
  member_count: number;
  role_count: number;
  sort_order: number;
}

export type AdminGroupDirectoryResult =
  | { ok: true; data: { groups: AdminGroup[] } }
  | { ok: false; error: string };

export async function getAdminGroupDirectory(): Promise<AdminGroupDirectoryResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:groups", profile.capabilities)) {
    return { ok: false, error: "La gestion des pôles et agences est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("cfc_admin_list_groups");
  if (error) return { ok: false, error: "Les groupes organisationnels ne peuvent pas être chargés." };

  const groups = ((data ?? []) as AdminGroupRow[]).map((row) => ({
    kind: row.group_type,
    id: row.id,
    code: row.code,
    label: row.label,
    description: row.description,
    city: row.city,
    region: row.region,
    isDiasporaDesk: row.is_diaspora_desk,
    memberCount: row.member_count,
    roleCount: row.role_count,
    sortOrder: row.sort_order,
  })).sort((left, right) => {
    const kindOrder = (left.kind === "pole" ? 0 : 1) - (right.kind === "pole" ? 0 : 1);
    if (kindOrder !== 0) return kindOrder;
    return left.kind === "pole" && right.kind === "pole"
      ? left.sortOrder - right.sortOrder || left.label.localeCompare(right.label, "fr")
      : left.label.localeCompare(right.label, "fr");
  });

  return { ok: true, data: { groups } };
}
