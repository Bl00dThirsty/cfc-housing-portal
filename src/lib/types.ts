export type ProjectType = 'construction' | 'terrain' | 'social' | 'renovation';

export interface ProjectTypeOption {
  id: ProjectType;
  label: string;
  icon: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
}

export interface SimulationResult {
  projectCost: number;
  apportPercentage: number;
  apportTotal: number;
  durationMonths: number;
  monthlySavings: number;
  loanAmount: number;
  loanDurationYears: number;
  annualInterestRate: number;
  monthlyLoanRepayment: number;
  monthlyIncome: number;
  debtToIncomeRatio: number;
  isCobacCompliant: boolean;
}

export interface CustomerProfile {
  ducId: string;
  firstName: string;
  lastName: string;
  cniNumber: string;
  phone: string;
  email: string;
  region: string;
  profession: string;
  employer: string;
  monthlyIncome: number;
  createdAt: string;
}

export type DocumentStatus = 'missing' | 'pending_upload' | 'uploaded' | 'verified' | 'rejected';

export interface DocumentItem {
  id: string;
  category: 'kyc' | 'income' | 'land' | 'technical';
  name: string;
  description: string;
  required: boolean;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
}

export type CreditPhaseId = 
  | 'phase_1_kyc_savings'
  | 'phase_2_risks_bet'
  | 'phase_3_committees'
  | 'phase_4_notary_mortgage'
  | 'phase_5_disbursements'
  | 'phase_6_closing_release';

export interface WorkflowPhase {
  id: CreditPhaseId;
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  responsibleActors: string[];
}

export interface CreditApplication {
  id: string;
  ducId: string;
  customerName: string;
  projectType: ProjectType;
  projectCost: number;
  loanAmount: number;
  savingsBalance: number;
  savingsTarget: number;
  currentPhase: CreditPhaseId;
  phaseStatus: 'in_progress' | 'completed' | 'blocked' | 'pending_review';
  agency: string;
  submittedAt: string;
  lastUpdated: string;
  documents: DocumentItem[];
}
