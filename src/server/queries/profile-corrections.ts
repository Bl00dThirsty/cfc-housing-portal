import "server-only";

import type { AssignedNameCorrectionRequest } from "@/domain/entities/profile";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AssignedNameCorrectionRequestsResult =
  | { ok: true; requests: AssignedNameCorrectionRequest[]; canDecide: boolean }
  | { ok: false; error: string };

/** Read pending correction requests through the assigned manager's RLS scope. */
export async function getAssignedNameCorrectionRequests(
  dossierId: string,
): Promise<AssignedNameCorrectionRequestsResult> {
  const profile = await getServerProfile();
  if (
    !profile ||
    profile.role !== "GESTIONNAIRE" ||
    !hasCapability(profile.role, "kyc:read", profile.capabilities)
  ) {
    return { ok: false, error: "Votre habilitation ne permet pas de consulter les corrections KYC." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("citizen_profile_change_requests")
    .select("id, requested_full_name, reason, created_at")
    .eq("dossier_id", dossierId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: "La demande de correction ne peut pas être chargée." };

  return {
    ok: true,
    canDecide: hasCapability(profile.role, "kyc:decide", profile.capabilities),
    requests: (data ?? []).map((row) => ({
      id: row.id,
      requestedFullName: row.requested_full_name,
      reason: row.reason,
      createdAtLabel: new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Douala",
      }).format(new Date(row.created_at)),
    })),
  };
}
