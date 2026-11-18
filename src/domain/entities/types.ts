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

/**
 * Taxonomie documentaire canonique du CFC (UI-facing, français).
 * `DocumentItem` (ciblage portail) et `ClientDocument` (back-office DUC)
 * partagent ces deux vocabulaires : une seule vérité de domaine.
 */
export type DocumentCategory =
  | 'Identité'
  | 'Revenus'
  | 'Foncier'
  | 'Technique'
  | 'Finances'
  | 'Assurance';

export type DocumentStatus =
  | 'Manquant'
  | 'En attente'
  | 'Téléversé'
  | 'En cours'
  | 'Validé'
  | 'Rejeté'
  | 'Expiré';

export interface DocumentItem {
  id: string;
  category: DocumentCategory;
  name: string;
  description: string;
  required: boolean;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
}
