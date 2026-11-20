import "server-only";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

export interface StaffIntakeOptions {
  regions: string[];
  diasporaAvailable: boolean;
}

/** Returns only the destinations that have an active regional manager. */
export async function getStaffIntakeOptions(): Promise<StaffIntakeOptions> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "dossier:create", profile.capabilities)) {
    return { regions: [], diasporaAvailable: false };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("cfc_staff_intake_regions");
  if (error) return { regions: [], diasporaAvailable: false };

  const destinations = (data ?? []) as { region: string | null; is_diaspora_desk: boolean }[];
  const regions = new Map<string, string>();
  for (const agency of destinations) {
    if (agency.is_diaspora_desk || !agency.region?.trim()) continue;
    const label = agency.region.trim();
    regions.set(label.toLocaleLowerCase("fr"), label);
  }
  return {
    regions: [...regions.values()].sort((a, b) => a.localeCompare(b, "fr")),
    diasporaAvailable: destinations.some((agency) => agency.is_diaspora_desk),
  };
}
