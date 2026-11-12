import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";
import type { DossierEvent } from "@/domain/entities/processes";
import {
  checklistStatusFor,
  type ChecklistItem,
} from "@/domain/entities/services";
import {
  currentStepOf,
  indexProcessSteps,
  processProgress,
  type IndexedStep,
} from "@/domain/workflows/tracking";

/**
 * Espace citoyen : tout ce que l'emprunteur voit de son dossier.
 *
 * Une seule lecture, une seule requête par entité, et **une seule** source de
 * vérité : `public.dossier_events` est la chronologie, `public.dossiers` est
 * l'état courant, `public.dossier_documents` et `ref.service_document_requirement`
 * font la complétude.
 *
 * Le vocabulaire des phases et des événements appartient au domaine
 * (`@/domain/entities/processes`) : cette couche ne fait que lire.
 */

export type CitizenSpace = {
  dossierId: string;
  ducCode: string;
  serviceLabel: string | null;
  currentPhase: string | null;
  completionPercent: number | null;
  status: string | null;
  events: DossierEvent[];
  checklist: ChecklistItem[];
  documentCount: number;
  unreadNotifications: number;
  /** Situation financière du dossier — matière du tableau de bord. */
  finance: CitizenFinance;
  /** Étapes indexées du parcours de crédit. */
  steps: IndexedStep[];
  /** Étape en cours : l'ancrage par défaut des messages. */
  currentStep: IndexedStep | null;
};

/** Situation financière du dossier, lue telle qu'elle est instruite. */
export type CitizenFinance = {
  loanAmount: number | null;
  rate: number | null;
  durationYears: number | null;
  monthlyPayment: number | null;
  savingsTarget: number | null;
  savingsCurrent: number | null;
  savingsPercent: number | null;
  debtRatio: number | null;
};

/** Ce que l'emprunteur voit de l'avancement de son parcours. */
export type CitizenTracking = {
  dossierId: string;
  ducCode: string;
  currentPhase: string | null;
  /** Étapes indexées du circuit de crédit. */
  steps: IndexedStep[];
  /** Avancement du parcours, en pourcentage d'étapes franchies. */
  progress: number;
  /** Pièces attendues, avec leur état. */
  checklist: ChecklistItem[];
};

export async function getCitizenSpace(userId: string): Promise<{
  ok: true;
  space: CitizenSpace | null;
} | { ok: false; error: string }> {
  if (!getPublicEnv()) return { ok: true, space: null };

  const supabase = await createServerSupabaseClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select(
      "id, duc_code, service_code, current_phase, completion_percent, status, loan_amount, rate, duration_years, monthly_payment, savings_target, savings_current, savings_percent, debt_ratio",
    )
    .eq("citizen_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dossierError) return { ok: false, error: dossierError.message };
  if (!dossier) return { ok: true, space: null };

  const dossierId = dossier.id as string;

  const [eventsResult, documentsResult, notificationsResult, checklistResult] = await Promise.all([
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
  ]);

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
  });

  return {
    ok: true,
    space: {
      dossierId,
      ducCode: dossier.duc_code as string,
      serviceLabel,
      currentPhase: dossier.current_phase as string | null,
      completionPercent:
        dossier.completion_percent === null ? null : Number(dossier.completion_percent),
      status: dossier.status as string | null,
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
      steps: space.steps,
      progress: processProgress(space.steps),
      checklist: space.checklist,
    },
  };
}

async function resolveServiceLabel(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  serviceCode: string | null,
): Promise<string | null> {
  if (!serviceCode) return null;
  const { data } = await supabase
    .schema("ref")
    .from("service")
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
    .schema("ref")
    .from("service_document_requirement")
    .select("stage, doc_type_code, required, min_count")
    .eq("service_code", serviceCode)
    .in("stage", ["ONBOARDING", "SAVINGS", "CREDIT_FILE"])
    .is("deleted_at", null)
    .is("effective_to", null);

  const { data: types } = await supabase
    .schema("ref")
    .from("document_type")
    .select("code, label, nature_code, issuing_authority")
    .is("deleted_at", null);

  const { data: natures } = await supabase
    .schema("ref")
    .from("document_nature")
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
