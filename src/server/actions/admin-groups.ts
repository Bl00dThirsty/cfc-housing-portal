"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

const poleSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable(),
  sortOrder: z.number().int().min(0).max(32767),
});

const agencySchema = z.object({
  id: z.string().uuid().nullable(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,47}$/),
  label: z.string().trim().min(2).max(160),
  city: z.string().trim().max(120).nullable(),
  region: z.string().trim().max(120).nullable(),
  isDiasporaDesk: z.boolean(),
});

export type AdminGroupActionResult = { ok: true } | { ok: false; error: string };

async function canManageGroups(): Promise<boolean> {
  const profile = await getServerProfile();
  return Boolean(profile && hasCapability(profile.role, "admin:groups", profile.capabilities));
}

function refreshGroupSurfaces() {
  revalidatePath("/portail-cfc/settings/groups");
  revalidatePath("/portail-cfc/settings/users");
}

export async function savePoleAction(input: unknown): Promise<AdminGroupActionResult> {
  const parsed = poleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le code, le libellé et l’ordre d’affichage du pôle." };
  if (!(await canManageGroups())) return { ok: false, error: "Vous n’êtes pas habilité à gérer les pôles." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_save_pole", {
    p_code: parsed.data.code,
    p_label: parsed.data.label,
    p_description: parsed.data.description,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { ok: false, error: "Le pôle n’a pas pu être enregistré. Vérifiez son code et réessayez." };
  refreshGroupSurfaces();
  return { ok: true };
}

export async function saveAgencyAction(input: unknown): Promise<AdminGroupActionResult> {
  const parsed = agencySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le code, le nom et les informations de l’agence." };
  if (!(await canManageGroups())) return { ok: false, error: "Vous n’êtes pas habilité à gérer les agences." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_save_agency", {
    p_agency_id: parsed.data.id,
    p_code: parsed.data.code,
    p_label: parsed.data.label,
    p_city: parsed.data.city,
    p_region: parsed.data.region,
    p_is_diaspora_desk: parsed.data.isDiasporaDesk,
  });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("agency_code_immutable")
        ? "Le code d’une agence existante ne peut pas être modifié."
        : "L’agence n’a pas pu être enregistrée. Vérifiez son code et réessayez.",
    };
  }
  refreshGroupSurfaces();
  return { ok: true };
}
