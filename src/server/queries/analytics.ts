import "server-only";

import type { AnalyticsOverview } from "@/domain/entities/analytics-overview";
import { referenceView } from "@/server/queries/reference";
import { createServerSupabaseClient } from "@/server/supabase/server";

type JsonRecord = Record<string, unknown>;

function object(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function count(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function amount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function counts(value: unknown): Record<string, number> {
  return Object.fromEntries(Object.entries(object(value)).map(([key, number]) => [key, count(number)]));
}

export type AnalyticsResult =
  | { ok: true; overview: AnalyticsOverview }
  | { ok: false; error: string };

/** A single RLS-preserving RPC returns aggregates only, never personal records. */
export async function getAnalyticsOverview(): Promise<AnalyticsResult> {
  const supabase = await createServerSupabaseClient();
  const [rollupResult, phasesResult] = await Promise.all([
    supabase.rpc("get_cfc_analytics_rollup"),
    supabase
      .from(referenceView("process_phase"))
      .select("code, label, sort_order")
      .order("sort_order", { ascending: true }),
  ]);
  const { data, error } = rollupResult;
  if (error) {
    console.error("[analytics] rollup unavailable:", error.code);
    return { ok: false, error: "Les indicateurs enregistrés ne peuvent pas être chargés dans votre périmètre." };
  }

  const root = object(data);
  const dossiers = object(root.dossiers);
  const savings = object(root.savings);
  const credit = object(root.credit);
  const notary = object(root.notary);
  const disbursements = object(root.disbursements);
  const phaseCounts = counts(dossiers.by_phase);
  const phases = (phasesResult.data ?? []) as {
    code: string;
    label: string;
    sort_order: number;
  }[];
  const phaseOrder = [...phases.map((phase) => phase.code), "unphased"];
  const phaseLabels = Object.fromEntries(phases.map((phase) => [phase.code, phase.label]));
  const byPhase = Object.entries(phaseCounts)
    .sort(([left], [right]) => {
      const leftIndex = phaseOrder.indexOf(left);
      const rightIndex = phaseOrder.indexOf(right);
      return (leftIndex < 0 ? phaseOrder.length : leftIndex) - (rightIndex < 0 ? phaseOrder.length : rightIndex) || left.localeCompare(right);
    })
    .map(([code, value]) => ({
      code,
      label: code === "unphased" ? "Sans phase" : phaseLabels[code] ?? code,
      count: value,
    }));

  return {
    ok: true,
    overview: {
      dossiers: { total: count(dossiers.total), diaspora: count(dossiers.diaspora), byPhase },
      savings: {
        activeAccounts: count(savings.active_accounts),
        activeBalance: amount(savings.active_balance),
        pendingOperations: count(savings.pending_operations),
        byChannel: counts(savings.operations_by_channel),
      },
      credit: {
        committeeSessions: count(credit.committee_sessions),
        sessionsByStatus: counts(credit.sessions_by_status),
        loanOffers: count(credit.loan_offers),
        offersByStatus: counts(credit.offers_by_status),
      },
      notary: {
        instruments: count(notary.instruments),
        openOppositions: count(notary.open_oppositions),
        activeInsurances: count(notary.active_insurances),
      },
      disbursements: {
        tranches: count(disbursements.tranches),
        amountTotal: amount(disbursements.amount_total),
        schedulesDue: count(disbursements.schedules_due),
        schedulesLate: count(disbursements.schedules_late),
        reconciliationMismatches: count(disbursements.reconciliation_mismatches),
      },
    },
  };
}
