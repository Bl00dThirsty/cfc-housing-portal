export type AnalyticsOverview = {
  dossiers: { total: number; diaspora: number; byPhase: { code: string; label: string; count: number }[] };
  savings: { activeAccounts: number; activeBalance: number; pendingOperations: number; byChannel: Record<string, number> };
  credit: { committeeSessions: number; sessionsByStatus: Record<string, number>; loanOffers: number; offersByStatus: Record<string, number> };
  notary: { instruments: number; openOppositions: number; activeInsurances: number };
  disbursements: { tranches: number; amountTotal: number; schedulesDue: number; schedulesLate: number; reconciliationMismatches: number };
};
