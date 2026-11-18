"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

const reassignmentSchema = z.object({
  dossierId: z.string().uuid(),
  staffId: z.string().uuid(),
  reason: z.string().trim().min(10).max(500),
});

export type ReassignmentResult = { ok: true } | { ok: false; error: string };

function messageForAssignmentError(message: string): string {
  if (message.includes("manual_assignment_forbidden")) return "Seul un administrateur peut réaffecter un dossier.";
  if (message.includes("manual_assignment_reason_required")) return "Le motif doit comporter au moins 10 caractères.";
  if (message.includes("staff_not_active_in_dossier_region")) return "Ce gestionnaire n’est plus actif dans la région du dossier.";
  if (message.includes("dossier_not_found")) return "Le dossier n’existe plus.";
  if (message.includes("dossier_region_required")) return "Le dossier doit être rattaché à une région avant réaffectation.";
  return "La réaffectation n’a pas pu être enregistrée.";
}

/** Reassign through the database transaction that writes history and an in-app notification. */
export async function reassignDossierAction(input: unknown): Promise<ReassignmentResult> {
  const parsed = reassignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choisissez un gestionnaire et indiquez un motif d’au moins 10 caractères." };

  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "admin:users")) {
    return { ok: false, error: "Cette action est réservée à l’administrateur." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("reassign_dossier", {
    p_dossier_id: parsed.data.dossierId,
    p_staff_id: parsed.data.staffId,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, error: messageForAssignmentError(error.message) };

  revalidatePath("/portail-cfc/clients");
  revalidatePath(`/portail-cfc/clients/${parsed.data.dossierId}`);
  revalidatePath("/portail-cfc/kanban");
  return { ok: true };
}
