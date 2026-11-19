"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";

const transactionSchema = z.object({
  accountId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.number().finite().positive().max(1_000_000_000_000),
  channel: z.enum([
    "agency",
    "mobile_money_mtn",
    "mobile_money_orange",
    "bank_transfer",
    "systac",
    "employer_debit",
    "swift_transfer",
    "cash",
  ]),
  reference: z.string().trim().max(120).optional(),
  description: z.string().trim().max(240).optional(),
});

const decisionSchema = z.object({
  transactionId: z.string().uuid(),
  decision: z.enum(["validate", "reject"]),
  reason: z.string().trim().max(240).optional(),
});

const reversalSchema = z.object({
  transactionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  reason: z.string().trim().min(5).max(240),
});

export type SavingsActionResult =
  | { ok: true; transactionId: string; status: "pending" }
  | { ok: false; error: string };

export type SavingsDecisionResult =
  | { ok: true; balance: number; decision: "validated" | "rejected" }
  | { ok: false; error: string };

function messageForSavingsError(message: string): string {
  if (message.includes("savings_auth_required")) return "Connectez-vous pour continuer.";
  if (message.includes("savings_account_not_found")) return "Le compte d’épargne est introuvable.";
  if (message.includes("savings_account_unavailable")) return "Ce compte ne peut pas recevoir d’opération.";
  if (message.includes("savings_account_forbidden")) return "Ce compte est hors de votre périmètre.";
  if (message.includes("savings_credit_forbidden")) return "Votre habilitation ne permet pas d’enregistrer un versement.";
  if (message.includes("savings_debit_forbidden")) return "Votre habilitation ne permet pas d’enregistrer un retrait.";
  if (message.includes("savings_validation_forbidden")) return "Votre habilitation ne permet pas de valider cette opération.";
  if (message.includes("savings_insufficient_balance")) return "Le solde disponible ne permet pas ce retrait.";
  if (message.includes("savings_rejection_reason_required")) return "Indiquez le motif du rejet (au moins 5 caractères).";
  if (message.includes("savings_transaction_not_pending")) return "Cette opération a déjà été traitée.";
  if (message.includes("savings_reference_conflict")) return "Cette référence existe déjà pour ce compte avec des valeurs différentes.";
  if (message.includes("savings_idempotency_conflict")) return "Cette demande a déjà été utilisée avec d’autres valeurs. Démarrez une nouvelle opération.";
  if (message.includes("savings_reversal_forbidden")) return "Votre habilitation ou votre périmètre ne permet pas cette contrepassation.";
  if (message.includes("savings_reversal_maker_forbidden")) return "Un autre agent doit contrepasser cette opération pour respecter la séparation des tâches.";
  if (message.includes("savings_transaction_not_reversible")) return "Cette opération ne peut pas être contrepassée.";
  if (message.includes("savings_transaction_already_reversed")) return "Cette opération a déjà été contrepassée.";
  if (message.includes("savings_input_invalid") || message.includes("savings_input_too_long")) return "Vérifiez le montant, le canal et les champs saisis.";
  return "L’opération d’épargne n’a pas pu être enregistrée.";
}

/** Record an auditable pending operation; account balances change on validation only. */
export async function recordSavingsTransactionAction(input: unknown): Promise<SavingsActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Les informations de l’opération sont incomplètes ou invalides." };

  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  const capability = parsed.data.type === "deposit" ? "savings:credit" : "savings:debit";
  if (!hasCapability(profile.role, capability, profile.capabilities)) {
    return { ok: false, error: "Votre habilitation ne permet pas d’enregistrer cette opération." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("record_savings_transaction", {
    p_account_id: parsed.data.accountId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_transaction_type: parsed.data.type,
    p_amount: parsed.data.amount,
    p_channel: parsed.data.channel,
    p_reference: parsed.data.reference || null,
    p_description: parsed.data.description || null,
  });
  if (error || typeof data !== "string") {
    return { ok: false, error: messageForSavingsError(error?.message ?? "invalid_result") };
  }

  revalidatePath("/portail-cfc/clients");
  return { ok: true, transactionId: data, status: "pending" };
}

export type SavingsReversalResult =
  | { ok: true; reversalId: string }
  | { ok: false; error: string };

/** Post a compensating ledger entry; the original validated row remains untouched. */
export async function reverseSavingsTransactionAction(input: unknown): Promise<SavingsReversalResult> {
  const parsed = reversalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Indiquez un motif de contrepassation valide." };

  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "savings:reverse", profile.capabilities)) {
    return { ok: false, error: "Votre habilitation ne permet pas de contrepasser une opération d’épargne." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("reverse_savings_transaction", {
    p_transaction_id: parsed.data.transactionId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_reason: parsed.data.reason,
  });
  if (error || typeof data !== "string") {
    return { ok: false, error: messageForSavingsError(error?.message ?? "invalid_result") };
  }

  revalidatePath("/portail-cfc/clients");
  return { ok: true, reversalId: data };
}

/** Validate or reject a pending entry in one database transaction. */
export async function decideSavingsTransactionAction(input: unknown): Promise<SavingsDecisionResult> {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "La décision est invalide." };

  if (parsed.data.decision === "reject" && (parsed.data.reason?.trim().length ?? 0) < 5) {
    return { ok: false, error: "Indiquez le motif du rejet (au moins 5 caractères)." };
  }

  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, "savings:validate", profile.capabilities)) {
    return { ok: false, error: "Votre habilitation ne permet pas de traiter les opérations d’épargne." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("decide_savings_transaction", {
    p_transaction_id: parsed.data.transactionId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason || null,
  });
  if (error || typeof data !== "number") {
    return { ok: false, error: messageForSavingsError(error?.message ?? "invalid_result") };
  }

  revalidatePath("/portail-cfc/clients");
  return {
    ok: true,
    balance: data,
    decision: parsed.data.decision === "validate" ? "validated" : "rejected",
  };
}
