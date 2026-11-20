"use server";

import { REGISTER_LABELS, validateRegisterInput, type RegisterInput, type RegisterKey } from "@/domain/entities/registers";
import { notifyRegisterEvent } from "@/server/notifications/register-notifications";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type RegisterActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function saveRegisterRecord(
  key: RegisterKey,
  input: RegisterInput,
  id?: string,
): Promise<RegisterActionResult> {
  const supabase = await requireUser();
  if (!supabase) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };

  const validation = validateRegisterInput(key, input);
  if (!validation.ok) {
    return { ok: false, error: "Corrigez les champs indiqués.", fieldErrors: validation.errors };
  }

  const payload = { ...validation.value };
  if (key === "promoters" && !payload.code) payload.code = `PROM-${Date.now()}`;
  if (key === "subsidies" && !payload.code) payload.code = `SUB-${Date.now()}`;
  if (key === "recovery" && !payload.case_code) payload.case_code = `REC-${Date.now()}`;

  const table = REGISTER_LABELS[key].table;
  const query = id
    ? supabase.from(table).update(payload).eq("id", id).select("id").single()
    : supabase.from(table).insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) return { ok: false, error: "L’enregistrement a été refusé dans votre périmètre." };

  await notifyRegisterEvent({
    registerKey: key,
    recordId: String(data?.id ?? id ?? ""),
    label: validation.value.label as string,
    operation: id ? "update" : "create",
  });

  return {
    ok: true,
    id: String(data?.id ?? id ?? ""),
    message: id ? "La fiche a été mise à jour." : "La fiche a été enregistrée.",
  };
}

export async function deleteRegisterRecord(key: RegisterKey, id: string): Promise<RegisterActionResult> {
  const supabase = await requireUser();
  if (!supabase) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  const { error } = await supabase
    .from(REGISTER_LABELS[key].table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "La suppression a été refusée dans votre périmètre." };
  await notifyRegisterEvent({ registerKey: key, recordId: id, label: "", operation: "delete" });
  return { ok: true, message: "La fiche a été retirée du registre." };
}
