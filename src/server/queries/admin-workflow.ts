import "server-only";

import type { WorkflowPhase, WorkflowProcess, WorkflowStep, ProcessFamily, ProcessPriority, ProcessLane } from "@/domain/entities/admin-workflow";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;
export type AdminWorkflowResult =
  | { ok: true; processes: WorkflowProcess[]; steps: WorkflowStep[]; phases: WorkflowPhase[] }
  | { ok: false; error: string };

export async function getAdminWorkflowCatalogue(): Promise<AdminWorkflowResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "workflow:manage", profile.capabilities)) {
    return { ok: false, error: "La configuration des workflows est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const [processResult, stepResult, phaseResult] = await Promise.all([
    supabase.from("cfc_processes").select("code, label, family, chain_order, pilote, priority, deleted_at").is("deleted_at", null).order("chain_order", { ascending: true, nullsFirst: false }).order("code", { ascending: true }),
    supabase.from("cfc_process_steps").select("code, process_code, label, phase, lane, is_external, sla_days, sort_order, deleted_at").is("deleted_at", null).order("sort_order", { ascending: true }).order("code", { ascending: true }),
    supabase.from("cfc_process_phases").select("code, label, sort_order").order("sort_order", { ascending: true }),
  ]);
  if (processResult.error || stepResult.error || phaseResult.error) {
    return { ok: false, error: "Le référentiel des workflows est indisponible. Réessayez après vérification de la base." };
  }

  const processRows = (processResult.data ?? []) as Row[];
  const steps: WorkflowStep[] = ((stepResult.data ?? []) as Row[]).map((row) => ({
    code: String(row.code),
    processCode: String(row.process_code),
    label: String(row.label),
    phase: row.phase ? String(row.phase) : null,
    lane: String(row.lane) as ProcessLane,
    external: Boolean(row.is_external),
    slaDays: row.sla_days === null || row.sla_days === undefined ? null : Number(row.sla_days),
    sortOrder: Number(row.sort_order),
  }));
  const processes: WorkflowProcess[] = processRows.map((row) => {
    const code = String(row.code);
    return {
      code,
      label: String(row.label),
      family: String(row.family) as ProcessFamily,
      chainOrder: row.chain_order === null || row.chain_order === undefined ? null : Number(row.chain_order),
      pilots: Array.isArray(row.pilote) ? row.pilote.map(String) : [],
      priority: String(row.priority) as ProcessPriority,
      activeStepCount: steps.filter((step) => step.processCode === code).length,
    };
  });
  const phases: WorkflowPhase[] = ((phaseResult.data ?? []) as Row[]).map((row) => ({
    code: String(row.code), label: String(row.label), sortOrder: Number(row.sort_order),
  }));

  return { ok: true, processes, steps, phases };
}
