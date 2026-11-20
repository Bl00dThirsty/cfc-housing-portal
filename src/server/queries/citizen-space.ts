import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { referenceView } from "@/server/queries/reference";
import type { CitizenFinance, CitizenSpace, CitizenTracking } from "@/domain/entities/citizen-space";
import type { CreditPhase, DossierEvent, ProcessStep } from "@/domain/entities/processes";
import {
  checklistStatusFor,
  type ChecklistItem,
} from "@/domain/entities/services";
import {
  currentStepOf,
  indexProcessSteps,
  processProgress,
} from "@/domain/workflows/tracking";

/** Espace emprunteur lu intégralement depuis le dossier et les catalogues Supabase. */
export type { CitizenFinance, CitizenSpace, CitizenTracking } from "@/domain/entities/citizen-space";

export async function getCitizenSpace(userId: string, requestedDossierId?: string): Promise<{
  ok: true;
  space: CitizenSpace | null;
} | { ok: false; error: string }> {
  if (!getPublicEnv()) return { ok: true, space: null };

  const supabase = await createServerSupabaseClient();

  let dossierQuery = supabase
    .from("dossiers")
    .select(
      "id, duc_code, service_code, current_phase, completion_percent, status, onboarding_state, advisor, loan_amount, rate, duration_years, monthly_payment, savings_target, savings_current, savings_percent, debt_ratio",
    )
    .eq("citizen_id", userId)
    .is("deleted_at", null);

  if (requestedDossierId) {
    dossierQuery = dossierQuery.eq("id", requestedDossierId);
  } else {
    dossierQuery = dossierQuery
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1);
  }

  const { data: dossier, error: dossierError } = await dossierQuery.maybeSingle();

  if (dossierError) return { ok: false, error: dossierError.message };
  if (!dossier) return { ok: true, space: null };

  const dossierId = dossier.id as string;

  const [
    eventsResult,
    documentsResult,
    notificationsResult,
    checklistResult,
    processStepsResult,
    processPhasesResult,
  ] = await Promise.all([
    supabase
      .from("dossier_events")
      .select("id, event_type, actor_role, payload, legal_basis, occurred_at")
      .eq("dossier_id", dossierId)
      .order("occurred_at", { ascending: false })
      .limit(100),
    supabase
      .from("dossier_documents")
      .select("id", { count: "exact", head: true })
      .eq("dossier_id", dossierId)
      .is("deleted_at", null),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .is("read_at", null)
      .is("deleted_at", null),
    supabase
      .from("dossier_documents")
      .select("id, doc_type_code, status, uploaded_at")
      .eq("dossier_id", dossierId)
      .is("deleted_at", null),
    supabase
      .from(referenceView("process_step"))
      .select("code, process_code, label, phase, lane, is_external, sort_order")
      .not("phase", "is", null)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from(referenceView("process_phase"))
      .select("code, label, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (processStepsResult.error || processPhasesResult.error) {
    return {
      ok: false,
      error: "Le catalogue du parcours est indisponible. Réessayez dans quelques instants.",
    };
  }

  const processPhases = (processPhasesResult.data ?? []) as {
    code: string;
    label: string;
    sort_order: number;
  }[];
  const phaseOrder = processPhases.map((phase) => phase.code as CreditPhase);
  const phaseLabels = Object.fromEntries(processPhases.map((phase) => [phase.code, phase.label]));
  const processSteps = (processStepsResult.data ?? []).map((step) => ({
    code: step.code as string,
    process: step.process_code as ProcessStep["process"],
    label: step.label as string,
    phase: step.phase as CreditPhase | null,
    lane: step.lane as ProcessStep["lane"],
    external: step.is_external as boolean,
  } satisfies ProcessStep));

  const serviceLabel = await resolveServiceLabel(supabase, dossier.service_code as string | null);

  const checklist = await buildChecklist(
    supabase,
    dossier.service_code as string | null,
    (checklistResult.data ?? []) as {
      id: string;
      doc_type_code: string;
      status: string;
      uploaded_at: string | null;
    }[],
  );

  const finance: CitizenFinance = {
    loanAmount: numberOrNull(dossier.loan_amount),
    rate: numberOrNull(dossier.rate),
    durationYears: numberOrNull(dossier.duration_years),
    monthlyPayment: numberOrNull(dossier.monthly_payment),
    savingsTarget: numberOrNull(dossier.savings_target),
    savingsCurrent: numberOrNull(dossier.savings_current),
    savingsPercent: numberOrNull(dossier.savings_percent),
    debtRatio: numberOrNull(dossier.debt_ratio),
  };

  // Le parcours est indexé **une seule fois** : l'espace et le suivi le
  // partagent, ils ne le recalculent pas chacun de leur côté.
  const steps = indexProcessSteps({
    currentPhase: (dossier.current_phase as string | null) ?? null,
    eventTypes: ((eventsResult.data ?? []) as { event_type: string }[]).map(
      (event) => event.event_type,
    ),
    phaseOrder,
    phaseLabels,
    processSteps,
  });

  return {
    ok: true,
    space: {
      dossierId,
      ducCode: dossier.duc_code as string,
      serviceLabel,
      currentPhase: dossier.current_phase as string | null,
      currentPhaseLabel:
        dossier.current_phase === null
          ? null
          : phaseLabels[dossier.current_phase as string] ?? (dossier.current_phase as string),
      completionPercent:
        dossier.completion_percent === null ? null : Number(dossier.completion_percent),
      status: dossier.status as string | null,
      onboardingState: (dossier.onboarding_state as string | null) ?? null,
      advisor: (dossier.advisor as string | null) ?? null,
      events: (eventsResult.data ?? []) as DossierEvent[],
      checklist,
      documentCount: documentsResult.count ?? 0,
      unreadNotifications: notificationsResult.count ?? 0,
      finance,
      steps,
      currentStep: currentStepOf(steps),
    },
  };
}

/** Nombre, ou `null` si la colonne est vide. */
function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Suivi de l'emprunteur : son parcours **indexé**.
 *
 * C'est une **vue** de l'espace citoyen, pas une autre lecture : les étapes
 * viennent du domaine (`CRD-01`…`CRD-13`, `GAR-01`), leur état est déduit de
 * la phase courante et du journal du dossier. L'emprunteur ne voit que **son**
 * dossier : aucun autre n'est interrogeable.
 */
export async function getCitizenTracking(userId: string): Promise<{
  ok: true;
  tracking: CitizenTracking | null;
} | { ok: false; error: string }> {
  const result = await getCitizenSpace(userId);
  if (!result.ok) return result;

  const space = result.space;
  if (!space) return { ok: true, tracking: null };

  return {
    ok: true,
    tracking: {
      dossierId: space.dossierId,
      ducCode: space.ducCode,
      currentPhase: space.currentPhase,
      currentPhaseLabel: space.currentPhaseLabel,
      steps: space.steps,
      progress: processProgress(space.steps),
      checklist: space.checklist,
      events: space.events,
    },
  };
}

async function resolveServiceLabel(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  serviceCode: string | null,
): Promise<string | null> {
  if (!serviceCode) return null;
  const { data } = await supabase
    .from(referenceView("service"))
    .select("label")
    .eq("code", serviceCode)
    .maybeSingle();
  return (data?.label as string | undefined) ?? null;
}

async function buildChecklist(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  serviceCode: string | null,
  documents: { id: string; doc_type_code: string; status: string; uploaded_at: string | null }[],
): Promise<ChecklistItem[]> {
  if (!serviceCode) return [];

  const { data: requirements } = await supabase
    .from(referenceView("service_document_requirement"))
    .select("stage, doc_type_code, required, min_count")
    .eq("service_code", serviceCode)
    .in("stage", ["ONBOARDING", "SAVINGS", "CREDIT_FILE"])
    .is("deleted_at", null)
    .is("effective_to", null);

  const { data: types } = await supabase
    .from(referenceView("document_type"))
    .select("code, label, nature_code, issuing_authority")
    .is("deleted_at", null);

  const { data: natures } = await supabase
    .from(referenceView("document_nature"))
    .select("code, label")
    .is("deleted_at", null);

  const typeByCode = new Map(
    ((types ?? []) as { code: string; label: string; nature_code: string; issuing_authority: string | null }[]).map(
      (type) => [type.code, type],
    ),
  );
  const natureByCode = new Map(
    ((natures ?? []) as { code: string; label: string }[]).map((nature) => [nature.code, nature]),
  );
  const documentByCode = new Map(
    documents.map((document) => [document.doc_type_code, document]),
  );

  return (
    (requirements ?? [])
      .map((requirement) => {
        const type = typeByCode.get(requirement.doc_type_code as string);
        const nature = type ? natureByCode.get(type.nature_code) : undefined;
        const document = documentByCode.get(requirement.doc_type_code as string);

        return {
          docTypeCode: requirement.doc_type_code as string,
          documentId: document?.id ?? null,
          label: type?.label ?? (requirement.doc_type_code as string),
          natureLabel: nature?.label ?? type?.nature_code ?? "Autre",
          issuingAuthority: type?.issuing_authority ?? null,
          required: requirement.required === true,
          stage: requirement.stage as string,
          stageLabel: requirement.stage as string,
          status: checklistStatusFor(document?.status),
          uploadedAt: document?.uploaded_at ?? null,
        } satisfies ChecklistItem;
      })
      .sort((a, b) => {
        if (a.required !== b.required) return a.required ? -1 : 1;
        return a.label.localeCompare(b.label, "fr");
      })
  );
}
