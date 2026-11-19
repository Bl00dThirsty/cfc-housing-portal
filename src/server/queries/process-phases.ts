import "server-only";

import type { ProcessPhase } from "@/domain/entities/process-phase";
import { referenceView } from "@/server/queries/reference";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;

export type ProcessPhasesResult =
  | { ok: true; phases: ProcessPhase[] }
  | { ok: false; error: string };

/** Load ordered phase names from the public view of the Supabase catalogue. */
export async function getProcessPhases(): Promise<ProcessPhasesResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(referenceView("process_phase"))
    .select("code, label, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return { ok: false, error: "Le catalogue des étapes du dossier est indisponible." };
  }

  return {
    ok: true,
    phases: ((data ?? []) as unknown as Row[]).map((row) => ({
      code: String(row.code),
      label: String(row.label),
      sortOrder: Number(row.sort_order),
    })),
  };
}
