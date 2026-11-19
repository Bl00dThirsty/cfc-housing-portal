"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

const processSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,15}$/),
  label: z.string().trim().min(2).max(180),
  family: z.enum(["pilotage", "realisation", "support", "ecosysteme"]),
  pilots: z.array(z.string().trim().min(1).max(64)).max(20),
  priority: z.enum(["prioritaire", "standard"]),
});

const stepSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,23}$/),
  processCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,15}$/),
  label: z.string().trim().min(2).max(180),
  phase: z.enum(["kyc_savings", "risk_bet", "committees", "notary_mortgage", "disbursements", "closing_release"]).nullable(),
  lane: z.enum(["client", "agence", "siege", "partenaires", "support"]),
  slaDays: z.number().int().positive().max(3650).nullable(),
  external: z.boolean(),
});

const orderSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(24),
  sortOrder: z.number().int().min(0).max(2_000_000_000),
});

export type WorkflowActionResult = { ok: true } | { ok: false; error: string };

async function canManageWorkflow(): Promise<boolean> {
  const profile = await getServerProfile();
  return Boolean(profile && hasCapability(profile.role, "workflow:manage", profile.capabilities));
}

function revalidateWorkflow() {
  revalidatePath("/portail-cfc/settings/workflow");
  revalidatePath("/portail-cfc/analytics");
}

export async function saveWorkflowProcessAction(input: unknown): Promise<WorkflowActionResult> {
  const parsed = processSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le code, le nom, la famille, les pilotes et la priorité." };
  if (!(await canManageWorkflow())) return { ok: false, error: "Vous n’êtes pas habilité à modifier les workflows." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_save_process", {
    p_code: parsed.data.code,
    p_label: parsed.data.label,
    p_family: parsed.data.family,
    p_pilote: parsed.data.pilots,
    p_priority: parsed.data.priority,
  });
  if (error) return { ok: false, error: "Le processus n’a pas pu être enregistré. Vérifiez son code et réessayez." };
  revalidateWorkflow();
  return { ok: true };
}

export async function saveWorkflowStepAction(input: unknown): Promise<WorkflowActionResult> {
  const parsed = stepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le code, le libellé et les options de l’étape." };
  if (!(await canManageWorkflow())) return { ok: false, error: "Vous n’êtes pas habilité à modifier les workflows." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_save_process_step", {
    p_code: parsed.data.code,
    p_process_code: parsed.data.processCode,
    p_label: parsed.data.label,
    p_phase: parsed.data.phase,
    p_lane: parsed.data.lane,
    p_sla_days: parsed.data.slaDays,
    p_is_external: parsed.data.external,
  });
  if (error) return { ok: false, error: "L’étape n’a pas pu être enregistrée. Vérifiez le processus, la phase et le code." };
  revalidateWorkflow();
  return { ok: true };
}

export async function setWorkflowStepOrderAction(input: unknown): Promise<WorkflowActionResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "L’ordre doit être un entier positif." };
  if (!(await canManageWorkflow())) return { ok: false, error: "Vous n’êtes pas habilité à modifier les workflows." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_set_process_step_order", {
    p_code: parsed.data.code,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { ok: false, error: "L’ordre de l’étape n’a pas pu être modifié." };
  revalidateWorkflow();
  return { ok: true };
}
