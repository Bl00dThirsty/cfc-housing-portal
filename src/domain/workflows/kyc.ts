/**
 * Moteur KYC — machine à états, règles de vigilance renforcée et notation
 * du risque.
 *
 * Module **pur** : aucun import React, Supabase ou serveur. L'agent de
 * connexion (le contrôleur) et l'adaptateur de persistance (la table
 * `public.citizen_profiles`) vivent ailleurs. La base réglementaire est
 * rappelée dans chaque règle pour que l'agent puisse justifier sa décision
 * au dossier de conformité.
 */

export type KycState =
  | "pre_boarding"
  | "identity_capture"
  | "document_verification"
  | "screening_pending"
  | "screening_cleared"
  | "screening_potential_match"
  | "enhanced_due_diligence"
  | "risk_rated"
  | "approval_pending"
  | "approved"
  | "active"
  | "dormant"
  | "review_due"
  | "review_in_progress"
  | "exited"
  | "offboarded"
  | "blocked";

export type RiskRating = "LOW" | "STANDARD" | "HIGH";

export type EddTrigger =
  | "HIGH_ML_TF_RISK"
  | "NON_FACE_TO_FACE"
  | "NON_RESIDENT"
  | "LEGAL_PERSON"
  | "PEP"
  | "COMPLEX_TRANSACTION"
  | "SOURCE_OF_FUNDS_DOUBT"
  | "SANCTIONS_HIT";

export const KYC_STATE_LABELS: Record<KycState, string> = {
  pre_boarding: "Pré-boarding",
  identity_capture: "Capture d'identité",
  document_verification: "Vérification des pièces",
  screening_pending: "Contrôle en attente",
  screening_cleared: "Contrôle favorable",
  screening_potential_match: "Correspondance potentielle",
  enhanced_due_diligence: "Vigilance renforcée",
  risk_rated: "Risque coté",
  approval_pending: "Approbation en attente",
  approved: "Approuvé",
  active: "Actif",
  dormant: "Dormant",
  review_due: "Révision due",
  review_in_progress: "Révision en cours",
  exited: "Sorti",
  offboarded: "Sortie effective",
  blocked: "Bloqué",
};

/**
 * Transitions autorisées.
 *
 * Le contrôle de filtrage est une **grille** : aucun dossier n'est
 * approuvable tant qu'un contrôle n'est pas rendu. C'est ce qui fait de
 * `screening_pending` un verrou et non une simple étape.
 */
export const KYC_TRANSITIONS: Record<KycState, readonly KycState[]> = {
  pre_boarding: ["identity_capture", "blocked"],
  identity_capture: ["document_verification", "blocked"],
  document_verification: ["screening_pending", "blocked"],
  screening_pending: ["screening_cleared", "screening_potential_match", "blocked"],
  screening_cleared: ["risk_rated", "enhanced_due_diligence", "blocked"],
  screening_potential_match: ["enhanced_due_diligence", "blocked"],
  enhanced_due_diligence: ["risk_rated", "blocked"],
  risk_rated: ["approval_pending", "blocked"],
  approval_pending: ["approved", "risk_rated", "blocked"],
  approved: ["active", "blocked"],
  active: ["dormant", "review_due", "exited", "blocked"],
  dormant: ["active", "review_due", "exited", "blocked"],
  review_due: ["review_in_progress", "exited", "blocked"],
  review_in_progress: ["active", "dormant", "exited", "blocked"],
  exited: ["offboarded"],
  offboarded: [],
  blocked: ["screening_pending", "review_due"],
};

export const EDD_TRIGGERS: ReadonlyArray<{
  value: EddTrigger;
  label: string;
  basis: string;
}> = [
  {
    value: "HIGH_ML_TF_RISK",
    label: "Risque ML/FT élevé",
    basis: "COBAC R-2023/01, art. 41 — mesures de vigilance renforcée",
  },
  {
    value: "NON_FACE_TO_FACE",
    label: "Entrée en relation à distance",
    basis: "COBAC R-2023/01, art. 23 — identification à distance",
  },
  {
    value: "NON_RESIDENT",
    label: "Client non-résident",
    basis: "COBAC R-2023/01, art. 42 — attestation de conformité et art. 18 — mandat limité",
  },
  {
    value: "LEGAL_PERSON",
    label: "Personne morale ou arrangement juridique",
    basis: "COBAC R-2023/01, arts. 26, 28 et 29 — bénéficiaire effectif",
  },
  {
    value: "PEP",
    label: "Personne politiquement exposée",
    basis: "Lignes directrices LC-COB/01 — traitement des PPE",
  },
  {
    value: "COMPLEX_TRANSACTION",
    label: "Opération complexe ou de montant inhabituel",
    basis: "COBAC R-2023/01 — analyse renforcée des opérations",
  },
  {
    value: "SOURCE_OF_FUNDS_DOUBT",
    label: "Doute sur l'origine des fonds",
    basis: "COBAC R-2023/01 — origine et destination des fonds",
  },
  {
    value: "SANCTIONS_HIT",
    label: "Correspondance de sanctions",
    basis: "Règlement CEMAC n° 04/24 — sanctions ciblées",
  },
];

export type EddContext = {
  highMlTfRisk?: boolean;
  nonFaceToFace?: boolean;
  nonResident?: boolean;
  legalPerson?: boolean;
  pep?: boolean;
  complexTransaction?: boolean;
  sourceOfFundsDoubt?: boolean;
  sanctionsHit?: boolean;
};

const CONTEXT_FLAG: Record<EddTrigger, keyof EddContext> = {
  HIGH_ML_TF_RISK: "highMlTfRisk",
  NON_FACE_TO_FACE: "nonFaceToFace",
  NON_RESIDENT: "nonResident",
  LEGAL_PERSON: "legalPerson",
  PEP: "pep",
  COMPLEX_TRANSACTION: "complexTransaction",
  SOURCE_OF_FUNDS_DOUBT: "sourceOfFundsDoubt",
  SANCTIONS_HIT: "sanctionsHit",
};

/** Motifs de vigilance renforcée déclenchés par le contexte du dossier. */
export function enhancedDueDiligenceTriggers(context: EddContext): EddTrigger[] {
  return EDD_TRIGGERS.filter((trigger) => context[CONTEXT_FLAG[trigger.value]] === true).map(
    (trigger) => trigger.value,
  );
}

export function requiresEnhancedDueDiligence(context: EddContext): boolean {
  return enhancedDueDiligenceTriggers(context).length > 0;
}

/**
 * Notation du risque.
 *
 * Le risque et l'état KYC sont deux axes distincts : un client peut être
 * `active` et `HIGH`. Les confondre produirait une machine à états
 * inexploitable.
 *
 * Sanctions et PPE sont toujours classés `HIGH` : ils ne se « notent » pas,
 * ils se traitent.
 */
export function rateRisk(context: EddContext): RiskRating {
  if (context.sanctionsHit || context.pep) return "HIGH";
  if (context.highMlTfRisk) return "HIGH";
  if (context.sourceOfFundsDoubt) return "HIGH";
  if (
    context.complexTransaction ||
    context.nonResident ||
    context.nonFaceToFace ||
    context.legalPerson
  ) {
    return "STANDARD";
  }
  return "LOW";
}

export function canTransition(from: KycState, to: KycState): boolean {
  return (KYC_TRANSITIONS[from] ?? []).includes(to);
}

export function nextStates(from: KycState): readonly KycState[] {
  return KYC_TRANSITIONS[from] ?? [];
}

export function isTerminal(state: KycState): boolean {
  return nextStates(state).length === 0;
}

/** Le dossier est-il prêt à être activé ? */
export function isReadyForActivation(state: KycState): boolean {
  return state === "approved";
}

/**
 * Le filtrage est-il levé ? Un dossier ne sort jamais de
 * `screening_pending` sans décision de contrôle écrite.
 */
export function screeningIsCleared(state: KycState): boolean {
  return state === "screening_cleared" || state === "enhanced_due_diligence" || state === "risk_rated";
}
