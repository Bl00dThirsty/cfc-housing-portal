import "server-only";

import type { OperationalDossier, OperationalEvent } from "@/domain/entities/operational-dossier";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function isDossierAssignedToActor(dossierId: string, actorId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("dossiers")
    .select("id")
    .eq("id", dossierId)
    .eq("owner_user_id", actorId)
    .is("deleted_at", null)
    .maybeSingle();
  return !error && Boolean(data);
}

export type OperationalDossiersResult =
  | { ok: true; dossiers: OperationalDossier[]; events?: OperationalEvent[] }
  | { ok: false; error: string };

type Row = Record<string, unknown>;

function text(row: Row, key: string, fallback = "—"): string {
  const value = row[key];
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function mapDossier(row: Row): OperationalDossier {
  return {
    id: text(row, "id", ""),
    ducCode: text(row, "duc_code"),
    region: text(row, "region"),
    agency: text(row, "agency", text(row, "city", "—")),
    phaseCode: text(row, "current_phase"),
    status: text(row, "status"),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    isDiaspora: row.is_diaspora === true,
  };
}

/**
 * Operational lists intentionally select only non-profile fields. RLS decides
 * which dossier rows are visible; financial and identity detail belongs to
 * separate, more narrowly scoped reads.
 */
export async function getOperationalDossiers({
  dossierId,
  phaseCodes,
  diasporaOnly = false,
  savingsOnly = false,
  pendingSavingsOnly = false,
}: {
  dossierId?: string;
  phaseCodes?: readonly string[];
  diasporaOnly?: boolean;
  savingsOnly?: boolean;
  pendingSavingsOnly?: boolean;
} = {}): Promise<OperationalDossiersResult> {
  const supabase = await createServerSupabaseClient();
  const fields = "id, duc_code, region, agency, city, current_phase, status, updated_at, is_diaspora";
  let query = supabase
    .from("dossiers")
    .select(fields)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (dossierId) query = query.eq("id", dossierId);

  const { data, error } = await query;
  if (error) {
    return { ok: false, error: "Les dossiers accessibles ne peuvent pas être chargés." };
  }

  let rows = ((data ?? []) as unknown) as Row[];
  if (savingsOnly || pendingSavingsOnly) {
    const referenceQuery = pendingSavingsOnly
      ? supabase.from("savings_transactions").select("dossier_id").eq("decision_state", "pending").is("deleted_at", null)
      : supabase.from("savings_accounts").select("dossier_id").is("deleted_at", null);
    const { data: references, error: referenceError } = await referenceQuery;
    if (referenceError) {
      return { ok: false, error: "Les références d’épargne accessibles ne peuvent pas être chargées." };
    }
    const dossierIds = new Set(
      ((references ?? []) as unknown as Row[])
        .map((reference) => reference.dossier_id)
        .filter((id): id is string => typeof id === "string"),
    );
    rows = rows.filter((row) => dossierIds.has(String(row.id)));
  }

  const dossiers = rows
    .map(mapDossier)
    .filter((dossier) =>
      (!phaseCodes || phaseCodes.includes(dossier.phaseCode)) &&
      (!diasporaOnly || dossier.isDiaspora),
    );

  if (dossierId) {
    const dossier = dossiers[0];
    if (!dossier) return { ok: false, error: "Ce dossier n’est pas accessible dans votre périmètre." };

    const { data: eventRows, error: eventError } = await supabase
      .from("dossier_events")
      .select("id, event_type, actor_role, occurred_at")
      .eq("dossier_id", dossierId)
      .order("occurred_at", { ascending: false });
    if (eventError) return { ok: false, error: "L’historique opérationnel est indisponible." };

    return {
      ok: true,
      dossiers: [dossier],
      events: ((eventRows ?? []) as unknown as Row[]).map((event) => ({
        id: text(event, "id", ""),
        type: text(event, "event_type"),
        actorRole: text(event, "actor_role"),
        occurredAt: text(event, "occurred_at"),
      })),
    };
  }

  return { ok: true, dossiers };
}
