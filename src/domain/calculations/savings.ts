/**
 * Règles de l'épargne-logement (PEL).
 *
 * Source : diagramme en couloirs de la figure 9 (PR-03 — Collecte de
 * l'épargne-logement et passage au prêt).
 *
 * Trois règles structurent le produit et sont aujourd'hui absentes du code :
 * le **carnet** (A ou B) qui porte le compte, le **droit acquis** acquis au
 * terme d'une année de versements, et la **conversion** de l'épargne en prêt
 * foncier épargne-logement à l'issue de la période contractuelle.
 *
 * Module **pur**.
 */

/**
 * Durée minimale de versements pour l'acquisition du droit acquis.
 *
 * Le diagramme indique « Rémunération et droits acquis · période ≥ 1 an ».
 */
export const DROIT_ACQUIS_MONTHS = 12;

/**
 * Type de carnet porté par le compte épargne-logement.
 *
 * - `A` — carnet de dépôts remis à l'épargnant à chaque versement.
 * - `B` — relevé de compte tenu par l'établissement.
 */
export type PassbookType = "A" | "B";

export type SavingsAccountState = {
  openedAt: string;
  /** Nombre de mois consécutifs de versement effectifs. */
  monthsPaid: number;
  /** Montant total versé. */
  totalPaid: number;
  /** Montant target de l'apport attendu. */
  targetAmount: number;
  passbookType: PassbookType;
  closed: boolean;
};

export type DroitAcquis = {
  acquired: boolean;
  /** Mois restants avant acquisition du droit acquis. */
  monthsRemaining: number;
  /** Montant acquis, égal au cumul versé une fois le droit acquis. */
  acquiredAmount: number;
  /** Date d'acquisition au plus tôt. */
  acquisitionDate: string | null;
};

function addMonths(isoDate: string, months: number): string {
  const date = new Date(isoDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * Calcule le droit acquis de l'épargnant.
 *
 * Le droit acquis n'est acquis qu'au terme d'une année de versements
 * réguliers : avant, l'épargnant peut clôturer son compte et percevoir son
 * épargne, mais il ne peut pas encore la convertir en prêt.
 */
export function computeDroitAcquis(account: SavingsAccountState): DroitAcquis {
  const remaining = Math.max(0, DROIT_ACQUIS_MONTHS - account.monthsPaid);
  const acquired = account.monthsPaid >= DROIT_ACQUIS_MONTHS;

  return {
    acquired,
    monthsRemaining: remaining,
    acquiredAmount: acquired ? account.totalPaid : 0,
    acquisitionDate: acquired ? addMonths(account.openedAt, DROIT_ACQUIS_MONTHS) : null,
  };
}

/**
 * L'épargnant peut-il convertir son épargne en prêt foncier épargne-logement ?
 *
 * Non : le prêt est une **option de fin de période contractuelle** (CPT-09) ;
 * avant l'échéance, la sortie normale est la clôture ou la prorogation
 * (CPT-08).
 */
export function canConvertToHousingLoan(account: SavingsAccountState): boolean {
  if (account.closed) return false;
  const droit = computeDroitAcquis(account);
  return droit.acquired && account.totalPaid >= account.targetAmount;
}

/** L'épargnant peut-il clôturer ou faire proroger son compte ? */
export function canCloseOrExtend(account: SavingsAccountState): boolean {
  return !account.closed;
}

/**
 * L'épargne collectée couvre-t-elle l'apport attendu ?
 *
 * Le taux d'apport lui-même n'est pas une constante du code : il dépend du
 * produit et se lit dans le catalogue déclaratif (`ref.product`).
 */
export function meetsApportTarget(
  account: SavingsAccountState,
  requiredApport: number,
): boolean {
  return account.totalPaid >= requiredApport;
}

/** Progression de l'épargne vers l'apport attendu, en pourcentage borné. */
export function savingsProgress(account: SavingsAccountState): number {
  if (account.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((account.totalPaid / account.targetAmount) * 100));
}
