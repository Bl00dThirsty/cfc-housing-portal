import "server-only";

import { REGISTER_LABELS, type RegisterKey, type RegisterRecord } from "@/domain/entities/registers";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;

function toRecord(row: Row): RegisterRecord {
  const fields = Object.entries(row)
    .filter(([key, value]) => !["id", "label", "status", "updated_at", "created_at", "deleted_at"].includes(key))
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => ({
      label: key.replaceAll("_", " "),
      value: typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value),
    }));
  return {
    id: String(row.id),
    label: String(row.label ?? "—"),
    region: typeof row.region === "string" ? row.region : null,
    status: String(row.status ?? "—"),
    updatedAt: String(row.updated_at ?? ""),
    fields,
  };
}

export async function listRegisterRecords(key: RegisterKey): Promise<
  | { ok: true; records: RegisterRecord[] }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(REGISTER_LABELS[key].table)
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) return { ok: false, error: "Ce registre ne peut pas être chargé dans votre périmètre." };
  return { ok: true, records: ((data ?? []) as Row[]).map(toRecord) };
}

export async function getRegisterRecord(key: RegisterKey, id: string): Promise<
  | { ok: true; record: RegisterRecord }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(REGISTER_LABELS[key].table)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Cette fiche n’est pas accessible dans votre périmètre." };
  return { ok: true, record: toRecord(data as Row) };
}
