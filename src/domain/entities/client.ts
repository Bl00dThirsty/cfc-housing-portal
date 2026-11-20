/** Read model used by the DUC workspace. Values come from persisted records. */
export interface ClientDocument {
  id: string;
  name: string;
  category: string;
  status: string;
  date: string;
  ref?: string;
  fileUrl?: string;
  fileSize?: string;
  fileName?: string;
  mimeType?: string;
}

/** A document is viewable only when the server supplied a real signed URL. */
export function getDocumentPdf(doc: {
  name?: string;
  category?: string;
  fileUrl?: string;
  fileSize?: string;
}): { url: string; size: string } | null {
  if (!doc.fileUrl) return null;
  return { url: doc.fileUrl, size: doc.fileSize || "—" };
}

export interface ClientVisa {
  stage: string;
  actor: string;
  decision: "Favorable" | "En attente" | "Réserves";
  date: string;
  comment: string;
}

export interface ClientItem {
  id: string;
  /** Stable staff account that owns the dossier in the database. */
  ownerUserId?: string | null;
  isDiaspora?: boolean;
  ducId: string;
  name: string;
  avatarTone: string;
  email: string;
  phone: string;
  region: string;
  agency: string;
  profession: string;
  employer: string;
  projectType: string;
  loanAmount: string;
  savingsTarget: string;
  savingsCurrent: string;
  savingsPercent: number;
  monthlyIncome: string;
  monthlyPayment: string;
  debtRatio: string;
  landTitle: string;
  durationYears: number;
  rate: string;
  accountNumber: string;
  notaryAssigned: string;
  betAssigned: string;
  officer: string;
  phaseCode?: string | null;
  phase: string;
  status: string;
  lastActivity: string;
  completionPercent: number;
  documents: ClientDocument[];
  visas: ClientVisa[];
  savingsPassbook?: SavingsPassbook;
}

export type SavingsChannel = string;
export type SavingsTransactionType = string;

export interface SavingsTransaction {
  id: string;
  date: string;
  amount: number;
  type: SavingsTransactionType;
  status: "pending" | "validated" | "rejected";
  statusNote?: string;
  description: string;
  channel: SavingsChannel;
  reference: string;
  debit: number | null;
  credit: number | null;
  balance: number;
  validatedBy?: string;
  receiptRef?: string;
  reversalOfId?: string;
  reversalOfReference?: string;
  reversedById?: string;
  reversedByReference?: string;
}

export interface SavingsPassbook {
  accountId: string;
  accountNumber: string;
  openDate: string;
  savingsTarget: number | null;
  currentBalance: number;
  interestRate: string;
  status: string;
  nextDueDate?: string;
  monthlyTarget?: number;
  transactions: SavingsTransaction[];
}
