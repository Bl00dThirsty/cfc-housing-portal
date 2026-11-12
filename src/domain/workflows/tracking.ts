/**
 * Indexation des étapes du circuit de crédit pour un dossier.
 *
 * Le suivi de l'emprunteur n'est pas une frise décorative : chaque étape
 * porte un **code** (`CRD-01`…`CRD-13`, `GAR-01`), une phase et un état —
 * franchie, en cours, à venir. L'indexation est une **lecture du domaine** :
 * elle combine la phase courante du dossier et les événements de son
 * journal. Rien n'est codé en dur dans l'écran.
 *
 * Module pur : aucun import React, Supabase ou serveur.
 */

import {
  CREDIT_PROCESS_STEPS,
  PROCESS_PHASE_LABELS,
  type CreditPhase,
} from "@/domain/entities/processes";

/** État d'une étape dans le parcours de l'emprunteur. */
export type StepStatus = "done" | "current" | "pending";

/** Étape indexée, telle que l'emprunteur la lit. */
export type IndexedStep = {
  /** Code du manuel de procédures (`CRD-07`, `GAR-01`). */
  code: string;
  label: string;
  phase: CreditPhase;
  phaseLabel: string;
  /** Corresponsable de l'étape dans le diagramme en couloirs. */
  lane: "client" | "agence" | "siege" | "partenaires" | "support";
  /** L'étape dépend d'un tiers externe (BET, notaire, banque…). */
  external: boolean;
  status: StepStatus;
};

/** Ordre du circuit : c'est lui qui donne le sens de l'avancement. */
export const PHASE_ORDER: readonly CreditPhase[] = [
  "kyc_savings",
  "risk_bet",
  "committees",
  "notary_mortgage",
  "disbursements",
  "closing_release",
];

/**
 * Événement qui atteste qu'une phase a été **franchie**.
 *
 * Un dossier peut sauter une phase (décision de comité avant l'expertise
 * technique) : le journal_prime sur l'ordre théorique.
 */
export const PHASE_MILESTONE_EVENTS: Record<CreditPhase, readonly string[]> = {
  kyc_savings: ["KYC_APPROVED", "KYC_REJECTED"],
  risk_bet: [],
  committees: ["COMMITTEE_DECISION"],
  notary_mortgage: [],
  disbursements: ["DISBURSEMENT_RELEASED"],
  closing_release: ["PAYOFF_STATEMENT", "MAINLEVEE_READY"],
};

/** Libellé d'une phase du circuit. */
export function phaseLabelOf(phase: CreditPhase | null): string {
  if (!phase) return "—";
  return PROCESS_PHASE_LABELS[phase] ?? phase;
}

/** La phase est-elle franchie ? */
export function isPhaseAchieved(
  phase: CreditPhase,
  currentPhase: CreditPhase | null,
  eventTypes: readonly string[],
): boolean {
  const milestones = PHASE_MILESTONE_EVENTS[phase] ?? [];
  if (milestones.some((event) => eventTypes.includes(event))) return true;

  if (!currentPhase) return false;

  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  return phaseIndex !== -1 && currentIndex !== -1 && phaseIndex < currentIndex;
}

/**
 * Indexe les étapes du circuit selon l'avancement réel du dossier.
 *
 * - une phase **franchie** marque toutes ses étapes comme faites ;
 * - la phase **courante** a sa première étape en cours, les suivantes à
 *   venir ;
 * - les phases postérieures sont entirely à venir.
 */
export function indexProcessSteps(input: {
  /** Phase courante du dossier (`dossiers.current_phase`). */
  currentPhase: string | null;
  /** Types des événements du journal du dossier. */
  eventTypes: readonly string[];
}): IndexedStep[] {
  const currentPhase = PHASE_ORDER.includes(input.currentPhase as CreditPhase)
    ? (input.currentPhase as CreditPhase)
    : null;

  const achieved = new Set<CreditPhase>();
  for (const phase of PHASE_ORDER) {
    if (isPhaseAchieved(phase, currentPhase, input.eventTypes)) achieved.add(phase);
  }

  // La phase courante n'est franchie que si son événement-marqueur est
  // arrivé : l'ordre théorique ne suffit pas à conclure.
  const activePhase = currentPhase && !achieved.has(currentPhase) ? currentPhase : null;

  let currentMarked = false;

  return CREDIT_PROCESS_STEPS.map((step) => {
    const phase = step.phase as CreditPhase;

    let status: StepStatus = "pending";

    if (achieved.has(phase)) {
      status = "done";
    } else if (activePhase === phase && !currentMarked) {
      status = "current";
      currentMarked = true;
    }

    return {
      code: step.code,
      label: step.label,
      phase,
      phaseLabel: phaseLabelOf(phase),
      lane: step.lane,
      external: step.external,
      status,
    };
  });
}

/** Étape par code — elle sert d'ancre dans les conversations. */
export function stepByCode(code: string): IndexedStep | undefined {
  const step = CREDIT_PROCESS_STEPS.find((candidate) => candidate.code === code);
  if (!step) return undefined;

  return {
    code: step.code,
    label: step.label,
    phase: step.phase as CreditPhase,
    phaseLabel: phaseLabelOf(step.phase as CreditPhase),
    lane: step.lane,
    external: step.external,
    status: "pending",
  };
}

/** Avancement du parcours, en pourcentage d'étapes franchies. */
export function processProgress(steps: readonly IndexedStep[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => step.status === "done").length;
  return Math.round((done / steps.length) * 100);
}

/**
 * L'étape sur laquelle la conversation doit s'ancrer.
 *
 * C'est l'étape **en cours** ; à défaut, la première à venir. Elle sert
 * d'ancrage par défaut pour les messages : une conversation qui porte sur une
 * étape est rattachée à cette étape du parcours, pas au dossier entier.
 */
export function currentStepOf(steps: readonly IndexedStep[]): IndexedStep | null {
  return steps.find((step) => step.status === "current") ?? steps.find((step) => step.status === "pending") ?? null;
}
