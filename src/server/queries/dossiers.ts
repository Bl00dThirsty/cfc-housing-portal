import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { stageLabel } from "@/domain/entities/services";

/**
 * Lecture du dossier d'un citoyen et de sa checklist documentaire.
 *
 * La checklist vient du catalogue **déclaratif** : ce que la Direction
 * Générale a publié comme exigences pour le service choisi. Le citoyen voit
 * donc exactement la même liste que l'agent, et l'écart entre « exigé » et
 * « déposé » est calculé, jamais codé en dur.
 */

/** Étapes dont les pièces sont fournies par le citoyen. */
const CITIZEN_STAGES = ["ONBOARDING", "SAVINGS", "CREDIT_FILE"] as const;

export type ChecklistStatus = "missing" | "uploaded" | "in_review" | "verified" | "rejected";

export type ChecklistItem = {
  docTypeCode: string;
  label: string;
  natureLabel: string;
  issuingAuthority: string | null;
  required: boolean;
  stage: string;
  stageLabel: string;
  status: ChecklistStatus;
  uploadedAt: string | null;
};

export type CitizenDossier = {
  ducCode: string;
  serviceCode: string | null;
  serviceLabel: string | null;
  currentPhase: string | null;
  completionPercent: number | null;
  checklist: ChecklistItem[];
  uploadedCount: number;
  requiredCount: number;
};

export type DossierReadResult =
  | { ok: true; dossier: CitizenDossier | null }
  | { ok: false; error: string };

type DossierRow = {
  id: string;
  duc_code: string;
  service_code: string | null;
  current_phase: string | null;
  completion_percent: number | null;
};

type DocumentRow = {
  doc_type_code: string;
  status: string;
  uploaded_at: string | null;
};

function toStatus(raw: string | null): ChecklistStatus {
  switch (raw) {
    case "verified":
    case "Validé":
      return "verified";
    case "in_review":
    case "En cours":
      return "in_review";
    case "uploaded":
    case "awaiting_upload":
    case "En attente":
      return "uploaded";
    case "rejected":
    case "Rejeté":
      return "rejected";
    default:
      return "missing";
  }
}

export async function getCitizenDossier(userId: string): Promise<DossierReadResult> {
  if (!getPublicEnv()) return { ok: true, dossier: null };

  const supabase = await createServerSupabaseClient();
  const ref = supabase.schema("ref");

  const { data: dossierData, error: dossierError } = await supabase
    .from("dossiers")
    .select("id, duc_code, service_code, current_phase, completion_percent")
    .eq("citizen_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dossierError) return { ok: false, error: dossierError.message };

  const dossier = (dossierData ?? null) as DossierRow | null;
  if (!dossier) return { ok: true, dossier: null };

  const [{ data: documents }, { data: requirements }, { data: documentTypes }, { data: services }] =
    await Promise.all([
      supabase
        .from("dossier_documents")
        .select("doc_type_code, status, uploaded_at")
        .eq("dossier_id", dossier.id)
        .is("deleted_at", null),
      dossier.service_code
        ? ref
            .from("service_document_requirement")
            .select("service_code, stage, doc_type_code, required, min_count")
            .eq("service_code", dossier.service_code)
            .is("deleted_at", null)
            .is("effective_to", null)
        : Promise.resolve({ data: [], error: null }),
      ref
        .from("document_type")
        .select("code, label, nature_code, issuing_authority")
        .is("deleted_at", null),
      ref.from("service").select("code, label").is("deleted_at", null),
    ]);

  const documentsByCode = new Map<string, DocumentRow>();
  for (const document of (documents ?? []) as DocumentRow[]) {
    const existing = documentsByCode.get(document.doc_type_code);
    // Un document plus récent l'emporte : la table garde l'historique des versions.
    if (!existing || (document.uploaded_at ?? "") > (existing.uploaded_at ?? "")) {
      documentsByCode.set(document.doc_type_code, document);
    }
  }

  const typeByCode = new Map(
    ((documentTypes ?? []) as {
      code: string;
      label: string;
      nature_code: string;
      issuing_authority: string | null;
    }[]).map((type) => [type.code, type]),
  );

  const serviceLabel =
    ((services ?? []) as { code: string; label: string }[]).find(
      (service) => service.code === dossier.service_code,
    )?.label ?? null;

  const checklist: ChecklistItem[] = (
    (requirements ?? []) as {
      service_code: string;
      stage: string;
      doc_type_code: string;
      required: boolean;
      min_count: number;
    }[]
  )
    .filter((requirement) => (CITIZEN_STAGES as readonly string[]).includes(requirement.stage))
    .map((requirement) => {
      const type = typeByCode.get(requirement.doc_type_code);
      const document = documentsByCode.get(requirement.doc_type_code);
      return {
        docTypeCode: requirement.doc_type_code,
        label: type?.label ?? requirement.doc_type_code,
        natureLabel: type?.nature_code ?? "AUTRE",
        issuingAuthority: type?.issuing_authority ?? null,
        required: requirement.required,
        stage: requirement.stage,
        stageLabel: stageLabel(requirement.stage),
        status: document ? toStatus(document.status) : "missing",
        uploadedAt: document?.uploaded_at ?? null,
      } satisfies ChecklistItem;
    })
    .sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.label.localeCompare(b.label, "fr");
    });

  return {
    ok: true,
    dossier: {
      ducCode: dossier.duc_code,
      serviceCode: dossier.service_code,
      serviceLabel,
      currentPhase: dossier.current_phase,
      completionPercent: dossier.completion_percent,
      checklist,
      uploadedCount: checklist.filter((item) => item.status !== "missing").length,
      requiredCount: checklist.filter((item) => item.required).length,
    },
  };
}
