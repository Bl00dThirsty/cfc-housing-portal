import "server-only";

import type { DocumentStagePhase, DocumentStageRolePolicy, WorkflowRoleOption, WorkflowPhase, WorkflowProcess, WorkflowStep, ProcessFamily, ProcessPriority, ProcessLane } from "@/domain/entities/admin-workflow";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;
export type AdminWorkflowResult =
  | {
      ok: true;
      processes: WorkflowProcess[];
      steps: WorkflowStep[];
      phases: WorkflowPhase[];
      documentStages: DocumentStagePhase[];
      documentPolicies: DocumentStageRolePolicy[];
      roles: WorkflowRoleOption[];
    }
  | { ok: false; error: string };

export async function getAdminWorkflowCatalogue(): Promise<AdminWorkflowResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "workflow:manage", profile.capabilities)) {
    return { ok: false, error: "La configuration des workflows est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const [processResult, stepResult, phaseResult, documentStageResult, documentPolicyResult, roleResult] = await Promise.all([
    supabase.from("cfc_processes").select("code, label, family, chain_order, pilote, priority, deleted_at").is("deleted_at", null).order("chain_order", { ascending: true, nullsFirst: false }).order("code", { ascending: true }),
    supabase.from("cfc_process_steps").select("code, process_code, label, phase, lane, is_external, sla_days, sort_order, deleted_at").is("deleted_at", null).order("sort_order", { ascending: true }).order("code", { ascending: true }),
    supabase.from("cfc_process_phases").select("code, label, sort_order").order("sort_order", { ascending: true }),
    supabase.from("cfc_document_stage_phase").select("stage_code, phase_code, label, sort_order").order("sort_order", { ascending: true }),
    supabase.from("cfc_document_stage_role_policy").select("stage_code, role_code, action, enabled").order("stage_code").order("role_code"),
    supabase.from("cfc_role").select("code, label").is("deleted_at", null).order("sort_order", { ascending: true }),
  ]);
  if (processResult.error || stepResult.error || phaseResult.error || documentStageResult.error || documentPolicyResult.error || roleResult.error) {
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
  const documentStages: DocumentStagePhase[] = ((documentStageResult.data ?? []) as Row[]).map((row) => ({
    stageCode: String(row.stage_code),
    phaseCode: String(row.phase_code),
    label: String(row.label),
    sortOrder: Number(row.sort_order),
  }));
  const documentPolicies: DocumentStageRolePolicy[] = ((documentPolicyResult.data ?? []) as Row[]).map((row) => ({
    stageCode: String(row.stage_code),
    roleCode: String(row.role_code),
    action: String(row.action) as DocumentStageRolePolicy["action"],
    enabled: Boolean(row.enabled),
  }));
  const roles: WorkflowRoleOption[] = ((roleResult.data ?? []) as Row[]).map((row) => ({
    code: String(row.code), label: String(row.label),
  }));

  return { ok: true, processes, steps, phases, documentStages, documentPolicies, roles };
}
