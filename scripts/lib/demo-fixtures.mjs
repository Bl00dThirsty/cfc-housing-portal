import { createHash } from "node:crypto";

// Local and staging scenarios for persisted CFC workflows. These are written to Supabase by the guarded seed command.

export const DEMO_STAFF = [
  { email: "guichet@cfc.cm", name: "ABANDA Eric", role: "GUICHET", agencyCode: "CFC-YDE-CENTRE" },
  { email: "gestionnaire@cfc.cm", name: "TCHOUNGUI Alain", role: "GESTIONNAIRE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "mbezele@cfc.cm", name: "Mme Mbezele", role: "GESTIONNAIRE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "tagne@cfc.cm", name: "M. Tagne", role: "GESTIONNAIRE", agencyCode: "CFC-YDE-MENDONG" },
  { email: "manga@cfc.cm", name: "Mme Manga", role: "GESTIONNAIRE", agencyCode: "CFC-DLA-BONANJO" },
  { email: "ndi@cfc.cm", name: "M. Ndi", role: "GESTIONNAIRE", agencyCode: "CFC-BAF-OUSSAM", active: false },
  { email: "risques@cfc.cm", name: "FOKAM Emmanuel", role: "RISQUES_BET", agencyCode: "CFC-YDE-CENTRE" },
  { email: "notaire@cfc.cm", name: "KAMGA Pascal", role: "NOTAIRE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "comite@cfc.cm", name: "MBALLA Jean-Paul", role: "COMITE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "diaspora@cfc.cm", name: "NGO NSOA Marie", role: "DIASPORA", agencyCode: "CFC-SIEGE-DIASPORA" },
  { email: "pmo@cfc.cm", name: "MBIDA Claire", role: "PMO", agencyCode: "CFC-YDE-CENTRE" },
  { email: "analyste@cfc.cm", name: "FOTUE Patrick", role: "ANALYSTE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "recouvrement@cfc.cm", name: "TALLA Nadia", role: "RECOUVREMENT", agencyCode: "CFC-YDE-CENTRE" },
  { email: "archiviste@cfc.cm", name: "MEYONG Elise", role: "ARCHIVISTE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "audit@cfc.cm", name: "NDJOMO Alain", role: "AUDIT", agencyCode: "CFC-YDE-CENTRE" },
  { email: "admin@cfc.cm", name: "Administrateur CFC", role: "ADMIN", agencyCode: "CFC-YDE-CENTRE" },
];

const SAVINGS_CHANNELS = [
  "agency",
  "mobile_money_mtn",
  "mobile_money_orange",
  "bank_transfer",
  "employer_debit",
];

/** Stable, visibly synthetic identifiers for local/staging borrower fixtures. */
export function buildDemoBorrowerIdentity(email) {
  const digest = createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");
  const subscriber = BigInt(`0x${digest.slice(0, 12)}`) % 1_000_000n;
  const birthYear = 1978 + Number.parseInt(digest.slice(12, 14), 16) % 18;
  return {
    cni: `CFC${digest.slice(0, 9).toUpperCase()}`,
    phone: `+237699${String(subscriber).padStart(6, "0")}`,
    birthDate: `${birthYear}-06-15`,
  };
}

export function buildDemoSavingsLedger({ ducCode, totalAmount, monthlySavings, months, asOf }) {
  if (!Number.isInteger(months) || months <= 0) return [];

  const totalCents = Math.round(Number(totalAmount ?? Number(monthlySavings) * months) * 100);
  if (totalCents <= 0) return [];
  const baseCents = Math.floor(totalCents / months);
  const remainingCents = totalCents - baseCents * months;
  let runningCents = 0;

  return Array.from({ length: months }, (_, index) => {
    const amountCents = baseCents + (index < remainingCents ? 1 : 0);
    runningCents += amountCents;
    const transactionDate = new Date(`${asOf}T00:00:00.000Z`);
    transactionDate.setUTCDate(transactionDate.getUTCDate() - 30 * (months - index));

    return {
      amount: amountCents / 100,
      balanceAfter: runningCents / 100,
      channel: SAVINGS_CHANNELS[index % SAVINGS_CHANNELS.length],
      reference: `DEV-SAV-${ducCode}-${String(index + 1).padStart(3, "0")}`,
      transactionDate: transactionDate.toISOString().slice(0, 10),
    };
  });
}

const BASE_DEMO_CITIZENS = [
  {
    email: "emprunteur@cfc.cm",
    name: "EBAH Rodrigue",
    affiliation: "first_time",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0001",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-01",
    plan: {
      projectCost: 9000000,
      apportPercentage: 20,
      durationMonths: 36,
      monthlyIncome: 850000,
      loanDurationYears: 15,
      annualInterestRate: 0.055,
    },
    // Neuf versements : le droit acquis (douze mois) n'est pas encore
    // acquis, et le dossier est encore à la phase d'épargne.
    savingsMonthsPaid: 9,
    // Le demandeur n'a jamais eu de prêt au CFC : son dossier attend
    // l'orientation d'un conseiller.
    onboardingState: "suspension",
    priorClientCase: "premiere_fois",
    ducStatus: "non_active",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Dossier transmis au guichet." } },
      { type: "DOCUMENT_REQUESTED", role: "GUICHET", payload: { document: "CNI biométrique" } },
    ],
  },
  {
    email: "emprunteur.diaspora@cfc.cm",
    name: "FOTSO Michel",
    affiliation: "non_resident",
    diaspora: true,
    agencyCode: "CFC-SIEGE-DIASPORA",
    ducCode: "CFC-DEV-0002",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "risk_bet",
    currentStep: "CRD-04",
    plan: {
      projectCost: 18000000,
      apportPercentage: 25,
      durationMonths: 48,
      monthlyIncome: 1250000,
      loanDurationYears: 20,
      annualInterestRate: 0.0475,
    },
    // Épargne constituée : le dossier a franchi l'épargne et entre à
    // l'expertise technique.
    savingsMonthsPaid: 48,
    // Client du CFC depuis plus de six mois : son DUC est activé et le
    // dossier est en instruction.
    onboardingState: "en_examen",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    timeline: [
      { type: "KYC_APPROVED", role: "GUICHET", payload: { note: "Identité vérifiée." } },
      { type: "DOCUMENT_REQUESTED", role: "DIASPORA", payload: { document: "Titre foncier" } },
      { type: "DOSSIER_UPDATED", role: "RISQUES_BET", payload: { note: "Transmission à l'expertise technique." } },
    ],
  },
  {
    email: "emprunteur.pieces@cfc.cm",
    name: "NGUEMA Pierre",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0003",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-02",
    plan: {
      projectCost: 12000000,
      apportPercentage: 20,
      durationMonths: 36,
      monthlyIncome: 950000,
      loanDurationYears: 15,
      annualInterestRate: 0.055,
    },
    // Déjà client du CFC pour ce service : il dépose ses pièces.
    savingsMonthsPaid: 14,
    onboardingState: "documents",
    priorClientCase: "deja_au_cfc",
    ducStatus: "non_active",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Dossier transmis au guichet." } },
      { type: "DOCUMENT_UPLOADED", role: "CITIZEN", payload: { document: "CNI biométrique" } },
    ],
  },
  {
    email: "emprunteur.comite@cfc.cm",
    name: "MANGA Solange",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0004",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "committees",
    currentStep: "CRD-07",
    committeeCode: "CGR",
    plan: { projectCost: 24000000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 1600000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GUICHET", payload: { note: "Dossier conforme, fixture locale." } },
      { type: "DOSSIER_UPDATED", role: "RISQUES_BET", payload: { note: "Évaluation technique transmise au comité." } },
    ],
  },
  {
    email: "emprunteur.notaire@cfc.cm",
    name: "TCHINDA Roland",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0005",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "notary_mortgage",
    currentStep: "CRD-11",
    committeeCode: "CGR",
    plan: { projectCost: 32000000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 2200000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GUICHET", payload: { note: "Dossier conforme, fixture locale." } },
      { type: "DOSSIER_UPDATED", role: "COMITE", payload: { note: "Offre acceptée; constitution des garanties à suivre." } },
    ],
  },
  {
    email: "emprunteur.deblocage@cfc.cm",
    name: "NGONO Mireille",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0006",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "disbursements",
    currentStep: "CRD-12",
    committeeCode: "CGR",
    plan: { projectCost: 28000000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 1900000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GUICHET", payload: { note: "Dossier conforme, fixture locale." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Garantie enregistrée; première tranche planifiée." } },
    ],
  },
  {
    email: "emprunteur.guichet-2@cfc.cm",
    name: "NDOUMBE Sandrine",
    affiliation: "first_time",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0007",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-02",
    plan: { projectCost: 7600000, apportPercentage: 20, durationMonths: 36, monthlyIncome: 720000, loanDurationYears: 15, annualInterestRate: 0.055 },
    savingsMonthsPaid: 4,
    onboardingState: "documents",
    priorClientCase: "premiere_fois",
    ducStatus: "non_active",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Pièces transmises depuis le portail." } },
      { type: "DOCUMENT_REQUESTED", role: "GUICHET", payload: { document: "Justificatif de domicile" } },
    ],
  },
  {
    email: "emprunteur.epargne@cfc.cm",
    name: "MBARGA Luc",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-MENDONG",
    ducCode: "CFC-DEV-0008",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-03",
    plan: { projectCost: 13500000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 980000, loanDurationYears: 20, annualInterestRate: 0.055 },
    savingsMonthsPaid: 18,
    onboardingState: "en_examen",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "identity_capture",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Dossier transmis au guichet." } },
      { type: "DOSSIER_UPDATED", role: "GESTIONNAIRE", payload: { note: "Constitution de l'épargne en cours." } },
    ],
  },
  {
    email: "emprunteur.risque-2@cfc.cm",
    name: "TCHOUA Mireille",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0009",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "risk_bet",
    currentStep: "CRD-06",
    plan: { projectCost: 15500000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 1150000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Vérification de présence consignée en agence." } },
      { type: "DOCUMENT_REQUESTED", role: "RISQUES_BET", payload: { document: "Devis quantitatif estimatif" } },
    ],
  },
  {
    email: "emprunteur.risque-3@cfc.cm",
    name: "ESSAMA Joël",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0010",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "risk_bet",
    currentStep: "CRD-06",
    plan: { projectCost: 19500000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 1450000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Identité vérifiée après entretien en agence." } },
      { type: "DOSSIER_UPDATED", role: "RISQUES_BET", payload: { note: "Rapport technique en attente de revue." } },
    ],
  },
  {
    email: "emprunteur.comite-2@cfc.cm",
    name: "MINKA Odette",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-MENDONG",
    ducCode: "CFC-DEV-0011",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "committees",
    currentStep: "CRD-08",
    committeeCode: "CGR",
    plan: { projectCost: 21000000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 1650000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "KYC conforme; entretien physique effectué." } },
      { type: "DOSSIER_UPDATED", role: "ANALYSTE", payload: { note: "Analyse consolidée pour avis du comité." } },
    ],
  },
  {
    email: "emprunteur.comite-3@cfc.cm",
    name: "BILOA Frédéric",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0012",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "committees",
    currentStep: "CRD-09",
    committeeCode: "CGR",
    plan: { projectCost: 26500000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 1850000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Contrôle KYC terminé en agence." } },
      { type: "DOSSIER_UPDATED", role: "COMITE", payload: { note: "Séance de décision planifiée." } },
    ],
  },
  {
    email: "emprunteur.notaire-2@cfc.cm",
    name: "KEMAYOU Diane",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0013",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "notary_mortgage",
    currentStep: "CRD-11",
    committeeCode: "CGR",
    plan: { projectCost: 29500000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 2000000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Vérification physique consignée en agence." } },
      { type: "DOSSIER_UPDATED", role: "COMITE", payload: { note: "Offre acceptée; préparation des garanties." } },
    ],
  },
  {
    email: "emprunteur.notaire-3@cfc.cm",
    name: "KOUAM Madeleine",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0014",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "notary_mortgage",
    currentStep: "CRD-11",
    committeeCode: "CGR",
    plan: { projectCost: 34000000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 2350000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Dossier identifié et vérifié en agence." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Acte de garantie prêt pour enregistrement." } },
    ],
  },
  {
    email: "emprunteur.deblocage-2@cfc.cm",
    name: "DJOMO Fabrice",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-MENDONG",
    ducCode: "CFC-DEV-0015",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "disbursements",
    currentStep: "CRD-13",
    committeeCode: "CGR",
    plan: { projectCost: 37000000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 2600000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Vérification physique enregistrée." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Garanties publiées; première tranche à suivre." } },
    ],
  },
  {
    email: "emprunteur.deblocage-3@cfc.cm",
    name: "TCHOUAPI Hélène",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0016",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "disbursements",
    currentStep: "CRD-12",
    committeeCode: "CGR",
    plan: { projectCost: 41000000, apportPercentage: 35, durationMonths: 48, monthlyIncome: 2900000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Contrôle en agence complété." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Dossier transmis pour le suivi du chantier." } },
    ],
  },
  {
    // Same account as CFC-DEV-0001: this borrower is following two requests at once.
    email: "emprunteur@cfc.cm",
    name: "EBAH Rodrigue",
    affiliation: "first_time",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0017",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-01",
    plan: { projectCost: 6800000, apportPercentage: 20, durationMonths: 36, monthlyIncome: 720000, loanDurationYears: 15, annualInterestRate: 0.055 },
    savingsMonthsPaid: 0,
    onboardingState: "kyc",
    priorClientCase: "premiere_fois",
    ducStatus: "non_active",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Seconde demande déposée depuis le même espace emprunteur." } },
    ],
  },
  {
    email: "emprunteur.kyc-2@cfc.cm",
    name: "MENGUE Aline",
    affiliation: "first_time",
    diaspora: false,
    agencyCode: "CFC-YDE-MENDONG",
    ducCode: "CFC-DEV-0018",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-02",
    plan: { projectCost: 8200000, apportPercentage: 20, durationMonths: 36, monthlyIncome: 790000, loanDurationYears: 15, annualInterestRate: 0.055 },
    savingsMonthsPaid: 3,
    onboardingState: "documents",
    priorClientCase: "premiere_fois",
    ducStatus: "non_active",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Les pièces de base ont été déposées." } },
      { type: "DOCUMENT_REQUESTED", role: "GUICHET", payload: { document: "Justificatif de domicile" } },
    ],
  },
  {
    email: "emprunteur.kyc-3@cfc.cm",
    name: "FOPA Armand",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0019",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    currentStep: "CRD-03",
    plan: { projectCost: 10800000, apportPercentage: 25, durationMonths: 36, monthlyIncome: 940000, loanDurationYears: 15, annualInterestRate: 0.055 },
    savingsMonthsPaid: 12,
    onboardingState: "en_examen",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "document_verification",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Identité et coordonnées soumises pour vérification." } },
    ],
  },
  {
    email: "emprunteur.risque-4@cfc.cm",
    name: "NANA Mireille",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0020",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "risk_bet",
    currentStep: "CRD-05",
    plan: { projectCost: 16800000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 1280000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 24,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Identité contrôlée par le conseiller affecté." } },
      { type: "DOSSIER_UPDATED", role: "RISQUES_BET", payload: { note: "Visite technique planifiée." } },
    ],
  },
  {
    email: "emprunteur.risque-5@cfc.cm",
    name: "ESSOMBA Christian",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0021",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "risk_bet",
    currentStep: "CRD-06",
    plan: { projectCost: 22300000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 1720000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 36,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Contrôle d'identité achevé." } },
      { type: "DOCUMENT_REQUESTED", role: "RISQUES_BET", payload: { document: "Devis quantitatif estimatif" } },
    ],
  },
  {
    email: "emprunteur.comite-4@cfc.cm",
    name: "MBOG Anne",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-MENDONG",
    ducCode: "CFC-DEV-0022",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "committees",
    currentStep: "CRD-07",
    committeeCode: "CRC",
    plan: { projectCost: 18700000, apportPercentage: 25, durationMonths: 48, monthlyIncome: 1510000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Dossier KYC complet." } },
      { type: "DOSSIER_UPDATED", role: "ANALYSTE", payload: { note: "Analyse de risque transmise au comité CRC." } },
    ],
  },
  {
    email: "emprunteur.comite-5@cfc.cm",
    name: "TCHOUPO Madeleine",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0023",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "committees",
    currentStep: "CRD-08",
    committeeCode: "CGR",
    plan: { projectCost: 27800000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 2040000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Vérification validée par le gestionnaire affecté." } },
      { type: "DOSSIER_UPDATED", role: "COMITE", payload: { note: "Dossier inscrit à la prochaine séance." } },
    ],
  },
  {
    email: "emprunteur.notaire-4@cfc.cm",
    name: "MBAH Lucie",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-CENTRE",
    ducCode: "CFC-DEV-0024",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "notary_mortgage",
    currentStep: "CRD-10",
    committeeCode: "CRC",
    plan: { projectCost: 31000000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 2250000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Identité vérifiée en agence." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Inscription de l'hypothèque en préparation." } },
    ],
  },
  {
    email: "emprunteur.notaire-5@cfc.cm",
    name: "KANA Béatrice",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0025",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "notary_mortgage",
    currentStep: "CRD-11",
    committeeCode: "CGR",
    plan: { projectCost: 35500000, apportPercentage: 35, durationMonths: 48, monthlyIncome: 2650000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "KYC validé." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Convention notariée en cours d'enregistrement." } },
    ],
  },
  {
    email: "emprunteur.deblocage-4@cfc.cm",
    name: "MOUKOURI Alain",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-YDE-MENDONG",
    ducCode: "CFC-DEV-0026",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "disbursements",
    currentStep: "CRD-12",
    committeeCode: "CRC",
    plan: { projectCost: 39000000, apportPercentage: 30, durationMonths: 48, monthlyIncome: 2800000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    plannedTranches: 2,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Dossier KYC conforme." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Garantie enregistrée; deux tranches sont planifiées." } },
    ],
  },
  {
    email: "emprunteur.deblocage-5@cfc.cm",
    name: "FOTSO Diane",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0027",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "disbursements",
    currentStep: "CRD-13",
    committeeCode: "CGR",
    plan: { projectCost: 46200000, apportPercentage: 35, durationMonths: 48, monthlyIncome: 3150000, loanDurationYears: 20, annualInterestRate: 0.05 },
    savingsMonthsPaid: 48,
    plannedTranches: 3,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    kycState: "approved",
    timeline: [
      { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Identité vérifiée." } },
      { type: "DOSSIER_UPDATED", role: "NOTAIRE", payload: { note: "Échéancier de libération des fonds planifié sur trois tranches." } },
    ],
  },
];

const SUPPLEMENTAL_SCENARIOS = [
  // Additional KYC and savings cases cover account creation, missing pieces,
  // identity review, and an established client still building savings.
  { phase: "kyc_savings", currentStep: "CRD-01", onboardingState: "kyc", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 0, kycState: "identity_capture" },
  { phase: "kyc_savings", currentStep: "CRD-01", onboardingState: "suspension", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 0, kycState: "identity_capture" },
  { phase: "kyc_savings", currentStep: "CRD-02", onboardingState: "documents", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 2, kycState: "document_verification" },
  { phase: "kyc_savings", currentStep: "CRD-02", onboardingState: "documents", priorClientCase: "deja_au_cfc", ducStatus: "non_active", savingsMonthsPaid: 4, kycState: "document_verification" },
  { phase: "kyc_savings", currentStep: "CRD-03", onboardingState: "en_examen", priorClientCase: "deja_au_cfc", ducStatus: "active", savingsMonthsPaid: 8, kycState: "approved" },
  { phase: "kyc_savings", currentStep: "CRD-03", onboardingState: "en_examen", priorClientCase: "deja_au_cfc", ducStatus: "active", savingsMonthsPaid: 12, kycState: "document_verification" },
  { phase: "kyc_savings", currentStep: "CRD-02", onboardingState: "documents", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 3, kycState: "document_verification" },
  { phase: "kyc_savings", currentStep: "CRD-03", onboardingState: "en_examen", priorClientCase: "deja_au_cfc", ducStatus: "active", savingsMonthsPaid: 18, kycState: "approved" },
  { phase: "kyc_savings", currentStep: "CRD-02", onboardingState: "documents", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 1, kycState: "document_verification" },
  { phase: "kyc_savings", currentStep: "CRD-03", onboardingState: "en_examen", priorClientCase: "deja_au_cfc", ducStatus: "active", savingsMonthsPaid: 21, kycState: "approved" },
  // Risk/BET cases remain before committee decision and carry completed KYC.
  ...[24, 30, 36, 42, 48].map((savingsMonthsPaid, index) => ({
    phase: "risk_bet",
    currentStep: ["CRD-04", "CRD-05", "CRD-06", "CRD-05", "CRD-06"][index],
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid,
    kycState: "approved",
  })),
  // Scheduled committee cases intentionally have no signed decision or offer.
  ...["CGR", "CRC", "PCA", "BOARD", "CGR"].map((committeeCode, index) => ({
    phase: "committees",
    currentStep: ["CRD-07", "CRD-08", "CRD-09", "CRD-07", "CRD-08"][index],
    committeeCode,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: 48,
    kycState: "approved",
  })),
  // These cases have a deliberation, accepted offer, land title, and deed.
  ...["CGR", "CRC", "PCA", "BOARD", "CRC"].map((committeeCode, index) => ({
    phase: "notary_mortgage",
    currentStep: index % 2 === 0 ? "CRD-10" : "CRD-11",
    committeeCode,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: 48,
    kycState: "approved",
  })),
  // Planned disbursements only; no fabricated paid loan or repayment lifecycle.
  ...[1, 2, 3, 2, 3].map((plannedTranches, index) => ({
    phase: "disbursements",
    currentStep: index % 2 === 0 ? "CRD-12" : "CRD-13",
    committeeCode: ["CGR", "CRC", "PCA", "BOARD", "CGR"][index],
    plannedTranches,
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: 48,
    kycState: "approved",
  })),
];

// Expand each seeded workflow phase to twenty reviewable dossiers. The added
// cases include a borrower following separate requests in two phases, plus
// diaspora cases that exercise the stronger identity-document requirements.
const EXPANSION_SCENARIOS = [
  { phase: "kyc_savings", currentStep: "CRD-01", onboardingState: "kyc", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 0, kycState: "identity_capture", email: "emprunteur.multi-stage@cfc.cm", name: "MBALLA Léa" },
  { phase: "kyc_savings", currentStep: "CRD-02", onboardingState: "documents", priorClientCase: "premiere_fois", ducStatus: "non_active", savingsMonthsPaid: 2, kycState: "document_verification" },
  { phase: "kyc_savings", currentStep: "CRD-03", onboardingState: "en_examen", priorClientCase: "deja_au_cfc", ducStatus: "active", savingsMonthsPaid: 11, kycState: "approved" },
  ...Array.from({ length: 10 }, (_, index) => ({
    phase: "risk_bet",
    currentStep: ["CRD-04", "CRD-05", "CRD-06"][index % 3],
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: [12, 15, 18, 21, 24, 30, 36, 42, 48, 48][index],
    kycState: "approved",
    ...(index === 0 ? { email: "emprunteur.multi-stage@cfc.cm", name: "MBALLA Léa" } : {}),
    ...(index === 4 ? { diaspora: true } : {}),
  })),
  // Scheduled committee cases intentionally have no signed decision or offer.
  ...Array.from({ length: 10 }, (_, index) => ({
    phase: "committees",
    currentStep: ["CRD-07", "CRD-08", "CRD-09"][index % 3],
    committeeCode: ["CGR", "CRC", "PCA", "BOARD"][index % 4],
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: 48,
    kycState: "approved",
    ...(index === 6 ? { diaspora: true } : {}),
  })),
  // Completed committee decisions and registered guarantees support notary views.
  ...Array.from({ length: 10 }, (_, index) => ({
    phase: "notary_mortgage",
    currentStep: index % 2 === 0 ? "CRD-10" : "CRD-11",
    committeeCode: ["CGR", "CRC", "PCA", "BOARD"][index % 4],
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: 48,
    kycState: "approved",
    ...(index === 2 ? { diaspora: true } : {}),
  })),
  // Only planned disbursements are seeded; no paid tranche or loan lifecycle is fabricated.
  ...Array.from({ length: 10 }, (_, index) => ({
    phase: "disbursements",
    currentStep: index % 2 === 0 ? "CRD-12" : "CRD-13",
    committeeCode: ["CGR", "CRC", "PCA", "BOARD"][index % 4],
    plannedTranches: [1, 2, 3, 2, 3][index % 5],
    onboardingState: "active",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    savingsMonthsPaid: 48,
    kycState: "approved",
    ...(index === 7 ? { diaspora: true } : {}),
  })),
];

const SUPPLEMENTAL_FIRST_NAMES = [
  "Arielle", "Basile", "Clarisse", "Désiré", "Emmanuelle", "Francis", "Gaëlle", "Herman", "Isabelle", "Jules",
  "Kelly", "Landry", "Mireille", "Nadège", "Olivier", "Prisca", "Richard", "Sonia", "Théodore", "Ursule",
  "Valère", "Wilfried", "Yvette", "Zacharie", "Alice", "Brice", "Cécile", "Didier", "Estelle", "Félix",
];

const SUPPLEMENTAL_FAMILY_NAMES = [
  "BILONDO", "MBARGA", "FOTUE", "NKOMO", "MBOG", "TCHOUA", "KANA", "ESSAMA", "NANA", "MINKA",
  "KEMAYOU", "MOUKOURI", "NGONO", "TCHINDA", "MANGA", "MBALLA", "FOTSO", "NDOUMBE", "TCHOUPO", "BIYONG",
  "KOUAM", "DJOMO", "NGUEMA", "TALLA", "MEYONG", "ABANDA", "TAGNE", "MBEZELE", "NDI", "KAMGA",
];

const SUPPLEMENTAL_AGENCIES = ["CFC-YDE-CENTRE", "CFC-YDE-MENDONG", "CFC-DLA-BONANJO"];
const SUPPLEMENTAL_SERVICE = "PRET_FONCIER_CLASSIQUE_ORDINAIRE";
const SUPPLEMENTAL_WORKFLOW_ROLES = {
  risk_bet: "RISQUES_BET",
  committees: "ANALYSTE",
  notary_mortgage: "NOTAIRE",
  disbursements: "NOTAIRE",
};

function supplementalTimeline(scenario) {
  if (scenario.phase === "kyc_savings") {
    if (scenario.kycState === "identity_capture") {
      return [{
        type: "DOSSIER_UPDATED",
        role: "CITIZEN",
        payload: { note: "Compte de démonstration créé; profil d'identité à compléter." },
      }];
    }
    return [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Profil d'identité transmis pour vérification." } },
      { type: "DOCUMENT_REQUESTED", role: "GUICHET", payload: { document: "Justificatif de domicile" } },
    ];
  }

  const role = SUPPLEMENTAL_WORKFLOW_ROLES[scenario.phase];
  const noteByPhase = {
    risk_bet: "Visite technique et analyse du projet en cours.",
    committees: "Dossier inscrit à une séance de comité à venir.",
    notary_mortgage: "Offre acceptée; constitution de la garantie à suivre.",
    disbursements: `Garantie enregistrée; ${scenario.plannedTranches} tranche(s) prévue(s).`,
  };
  return [
    { type: "KYC_APPROVED", role: "GESTIONNAIRE", payload: { note: "Identité contrôlée par le gestionnaire affecté." } },
    { type: "DOSSIER_UPDATED", role, payload: { note: noteByPhase[scenario.phase] } },
  ];
}

function buildSupplementalDemoCitizens() {
  return [...SUPPLEMENTAL_SCENARIOS, ...EXPANSION_SCENARIOS].map((scenario, index) => {
    const sequence = index + 28;
    const projectCost = 8_000_000 + index * 900_000;
    const monthlyIncome = 720_000 + index * 72_000;
    const affiliation = scenario.priorClientCase === "premiere_fois" ? "first_time" : "cfc_existing";
    const isDiaspora = scenario.diaspora === true;
    const familyName = SUPPLEMENTAL_FAMILY_NAMES[index % SUPPLEMENTAL_FAMILY_NAMES.length];
    const firstName = SUPPLEMENTAL_FIRST_NAMES[Math.floor(index / SUPPLEMENTAL_FAMILY_NAMES.length) % SUPPLEMENTAL_FIRST_NAMES.length];

    return {
      email: scenario.email ?? `emprunteur.demo-${String(sequence).padStart(3, "0")}@cfc.cm`,
      name: scenario.name ?? `${familyName} ${firstName}`,
      affiliation,
      diaspora: isDiaspora,
      agencyCode: isDiaspora
        ? "CFC-SIEGE-DIASPORA"
        : SUPPLEMENTAL_AGENCIES[index % SUPPLEMENTAL_AGENCIES.length],
      ducCode: `CFC-DEV-${String(sequence).padStart(4, "0")}`,
      serviceCode: SUPPLEMENTAL_SERVICE,
      phase: scenario.phase,
      currentStep: scenario.currentStep,
      ...(scenario.committeeCode ? { committeeCode: scenario.committeeCode } : {}),
      ...(scenario.plannedTranches ? { plannedTranches: scenario.plannedTranches } : {}),
      plan: {
        projectCost,
        apportPercentage: [20, 25, 30, 35][index % 4],
        durationMonths: index % 2 === 0 ? 36 : 48,
        monthlyIncome,
        loanDurationYears: index % 3 === 0 ? 15 : 20,
        annualInterestRate: [0.0475, 0.05, 0.055][index % 3],
      },
      savingsMonthsPaid: scenario.savingsMonthsPaid,
      onboardingState: scenario.onboardingState,
      priorClientCase: scenario.priorClientCase,
      ducStatus: scenario.ducStatus,
      kycState: scenario.kycState,
      timeline: supplementalTimeline(scenario),
    };
  });
}

export const DEMO_CITIZENS = [
  ...BASE_DEMO_CITIZENS,
  ...buildSupplementalDemoCitizens(),
];
