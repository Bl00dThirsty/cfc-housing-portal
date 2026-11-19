import type { DossierEvent } from "@/domain/entities/processes";
import type { ChecklistItem } from "@/domain/entities/services";
import type { IndexedStep } from "@/domain/workflows/tracking";

/** Read model shared by the server query and request-scoped client workspace. */
export type CitizenSpace = {
  dossierId: string;
  ducCode: string;
  serviceLabel: string | null;
  currentPhase: string | null;
  currentPhaseLabel: string | null;
  completionPercent: number | null;
  status: string | null;
  onboardingState: string | null;
  advisor: string | null;
  events: DossierEvent[];
  checklist: ChecklistItem[];
  documentCount: number;
  unreadNotifications: number;
  finance: CitizenFinance;
  steps: IndexedStep[];
  currentStep: IndexedStep | null;
};

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

export type CitizenTracking = {
  dossierId: string;
  ducCode: string;
  currentPhase: string | null;
  currentPhaseLabel: string | null;
  steps: IndexedStep[];
  progress: number;
  checklist: ChecklistItem[];
  events: DossierEvent[];
};

