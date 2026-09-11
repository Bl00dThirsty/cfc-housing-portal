import { SimulationResult } from './types';

/**
 * Calcule les composantes financières d'un plan Épargne Habitat et Crédit Foncier
 * selon les normes prudentielles COBAC et les grilles du CFC.
 */
export function calculateHousingPlan(params: {
  projectCost: number;
  apportPercentage: number;
  durationMonths: number;
  monthlyIncome: number;
  loanDurationYears?: number;
  annualInterestRate?: number;
}): SimulationResult {
  const {
    projectCost,
    apportPercentage,
    durationMonths,
    monthlyIncome,
    loanDurationYears = 15,
    annualInterestRate = 0.055, // 5.5% taux bonifié CFC
  } = params;

  const apportTotal = projectCost * (apportPercentage / 100);
  const monthlySavings = apportTotal / durationMonths;
  const loanAmount = Math.max(0, projectCost - apportTotal);

  // Formule d'annuité constante pour prêt à taux fixe : M = C * [r / (1 - (1+r)^-n)]
  const monthlyInterestRate = annualInterestRate / 12;
  const totalLoanPayments = loanDurationYears * 12;

  let monthlyLoanRepayment = 0;
  if (loanAmount > 0) {
    monthlyLoanRepayment =
      loanAmount *
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalLoanPayments)) /
      (Math.pow(1 + monthlyInterestRate, totalLoanPayments) - 1);
  }

  // Taux d'endettement COBAC
  const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyLoanRepayment / monthlyIncome) * 100 : 0;
  const isCobacCompliant = debtToIncomeRatio <= 33;

  return {
    projectCost,
    apportPercentage,
    apportTotal,
    durationMonths,
    monthlySavings,
    loanAmount,
    loanDurationYears,
    annualInterestRate,
    monthlyLoanRepayment,
    monthlyIncome,
    debtToIncomeRatio,
    isCobacCompliant,
  };
}
