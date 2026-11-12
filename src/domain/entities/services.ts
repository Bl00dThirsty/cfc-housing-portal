/**
 * Vocabulaire du catalogue déclarable (services, natures, pièces, exigences).
 *
 * Ces types vivent dans le domaine : ils sont purs, ils ne dépendent ni de
 * React ni de Supabase, et ils sont la référence partagée entre la couche
 * serveur (lecture du catalogue) et la couche interface (affichage et
 * édition).
 */

export type RequiredDocument = {
  docTypeCode: string;
  label: string;
  natureCode: string;
  natureLabel: string;
  issuingAuthority: string | null;
  required: boolean;
  minCount: number;
  stage: string;
};

export type ServiceSummary = {
  code: string;
  label: string;
  description: string | null;
  documents: RequiredDocument[];
};

export type DocumentNature = {
  code: string;
  label: string;
  description: string | null;
};

export type DocumentTypeSummary = {
  code: string;
  label: string;
  nature_code: string;
  issuing_authority: string | null;
  validity_months: number | null;
  accepted_mime: string[];
  max_size_bytes: number;
  min_count: number;
  max_count: number | null;
  valid_from: string;
  valid_to: string | null;
};

export type ServiceSummaryRow = {
  code: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type RequirementRow = {
  id: string;
  service_code: string;
  stage: string;
  doc_type_code: string;
  required: boolean;
  min_count: number;
  max_count: number | null;
  effective_from: string;
  effective_to: string | null;
};

export const REQUIREMENT_STAGES = [
  { value: "ONBOARDING", label: "À l'inscription" },
  { value: "SAVINGS", label: "Pendant l'épargne" },
  { value: "CREDIT_FILE", label: "Dossier de crédit" },
  { value: "NOTARY", label: "Notaire" },
  { value: "MORTGAGE", label: "Hypothèque" },
  { value: "DISBURSEMENT", label: "Déblocage" },
  { value: "PAYOFF", label: "Apurement" },
] as const;

export type RequirementStage = (typeof REQUIREMENT_STAGES)[number]["value"];

export function stageLabel(stage: string): string {
  return (
    REQUIREMENT_STAGES.find((item) => item.value === stage)?.label ?? stage
  );
}

/**
 * État d'une pièce dans la checklist déclarable de l'emprunteur.
 *
 * C'est une notion **domaine** : la checklist parle d'une pièce « manquante »
 * ou « déposée », jamais de l'état technique de la table des pièces.
 */
export type ChecklistStatus =
  | "missing"
  | "uploaded"
  | "in_review"
  | "verified"
  | "rejected";

/** Une pièce attendue par le référentiel déclarable, et son état réel. */
export type ChecklistItem = {
  docTypeCode: string;
  /** Pièce effectivement déposée — `null` si elle manque encore. */
  documentId: string | null;
  label: string;
  natureLabel: string;
  issuingAuthority: string | null;
  required: boolean;
  stage: string;
  stageLabel: string;
  status: ChecklistStatus;
  uploadedAt: string | null;
};

/**
 * Traduit l'état technique d'une pièce en état de checklist.
 *
 * Sans pièce, la checklist affiche « manquante » ; une pièce en attente de
 * vérification n'est pas encore validée.
 */
export function checklistStatusFor(raw: string | null | undefined): ChecklistStatus {
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
