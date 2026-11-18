import "server-only";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

export interface RegionalManagerOption {
  userId: string;
  fullName: string;
  email: string;
  agencyLabel: string;
}

export type RegionalManagersResult =
  | { ok: true; currentManagerId: string | null; managers: RegionalManagerOption[] }
  | { ok: false; error: string };

/** The manager roster is read from the same active regional assignments used by the reassignment RPC. */
export async function getRegionalManagersForDossier(dossierId: string): Promise<RegionalManagersResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:users")) {
    return { ok: false, error: "La liste des gestionnaires est réservée à l’administrateur." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("list_regional_managers_for_dossier", {
    p_dossier_id: dossierId,
  });
  if (error) {
    return { ok: false, error: "Les gestionnaires actifs de cette région ne peuvent pas être chargés." };
  }

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("owner_user_id")
    .eq("id", dossierId)
    .is("deleted_at", null)
    .maybeSingle();
  if (dossierError || !dossier) {
    return { ok: false, error: "L’affectation actuelle de ce dossier ne peut pas être chargée." };
  }

  const managers = (data ?? []).map((row: Record<string, unknown>) => ({
    userId: String(row.user_id),
    fullName: String(row.full_name ?? row.email ?? "Gestionnaire"),
    email: String(row.email ?? ""),
    agencyLabel: String(row.agency_label ?? ""),
  }));

  return {
    ok: true,
    currentManagerId: typeof dossier.owner_user_id === "string" ? dossier.owner_user_id : null,
    managers,
  };
}
