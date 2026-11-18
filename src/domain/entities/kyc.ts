/**
 * Les formes du parcours du demandeur — KYC et onboarding.
 *
 * Ce module ne porte que des **types** et des **listes fermées** : les règles
 * vivent dans `kyc-profile.ts`, l'état de la machine à états dans
 * `src/domain/workflows/kyc.ts`.
 *
 * Chaque liste est `readonly` et typée par son union : une valeur hors liste
 * ne peut pas se glisser dans un formulaire.
 */

/** Situation matrimoniale déclarée. */
export const FAMILY_STATUSES = [
  "célibataire",
  "marié(e)",
  "divorcé(e)",
  "veuf(ve)",
] as const;

export type FamilyStatus = (typeof FAMILY_STATUSES)[number];

/**
 * Situation professionnelle déclarée.
 *
 * Elle est exprimée par le **lien qui lie le demandeur à son employeur** :
 * un CDI, un CDD, ou une activité indépendante. C'est ce lien qui commande
 * l'ancienneté exigée par un prêt.
 */
export const EMPLOYMENT_STATUSES = [
  "CDI",
  "CDD",
  "indépendant",
  "fonctionnaire",
  "étudiant",
  "retraité",
  "sans emploi",
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** Nature du revenu déclaré. */
export const INCOME_ORIGINS = [
  "salaire",
  "revenus fonciers",
  "revenus commerciaux",
  "revenus agricoles",
  "transferts",
  "pension",
  "autre",
] as const;

export type IncomeOrigin = (typeof INCOME_ORIGINS)[number];

/** Tranche de revenu mensuel déclarée. */
export const INCOME_BANDS = [
  "moins de 100 000",
  "100 000 – 400 000",
  "400 000 – 800 000",
  "800 000 – 1 500 000",
  "1 500 000 – 3 000 000",
  "plus de 3 000 000",
] as const;

export type IncomeBand = (typeof INCOME_BANDS)[number];

/** Nature de la pièce d'identité présentée. */
export const ID_DOCUMENT_TYPES = [
  "CNI",
  "Carte de séjour",
  "Passeport",
  "Permis de conduire",
  "Attestation administrative",
] as const;

export type IdDocumentType = (typeof ID_DOCUMENT_TYPES)[number];

/** Statut d'occupation du logement. */
export const OCCUPATION_STATUSES = [
  "propriétaire",
  "locataire",
  "hébergé",
  "logement de famille",
  "logement de fonction",
] as const;

export type OccupationStatus = (typeof OCCUPATION_STATUSES)[number];

/** Motif de la qualité de personne politiquement exposée. */
export const PEP_REASONS = [
  "personne politiquement exposée",
  "membre de famille d'une PPE",
  "mandataire d'une PPE",
  "autre exposition",
] as const;

export type PepReason = (typeof PEP_REASONS)[number];

/** Le badge KYC affiché au demandeur — quatre valeurs, pas seize. */
export type KycBadge = "incomplet" | "soumis" | "verifie" | "rejete";

/** L'identité déclarée — écran A du KYC. */
export interface KycIdentity {
  /** Date de naissance, au format ISO `AAAA-MM-JJ`. */
  birthDate: string | null;
  /** Ville de naissance. */
  birthPlaceCity: string | null;
  /** Pays de naissance. */
  birthPlaceCountry: string | null;
  /** Nationalité. */
  nationality: string | null;
  /** Situation matrimoniale. */
  familyStatus: FamilyStatus | null;
  /** Nature de la pièce d'identité. */
  idDocumentType: IdDocumentType | null;
  /** Numéro de la pièce d'identité. */
  idDocumentNumber: string | null;
  /** Date de délivrance, au format ISO. */
  idDocumentIssuedAt: string | null;
  /** Date d'expiration, au format ISO. */
  idDocumentExpiresAt: string | null;
  /** Autorité de délivrance. */
  idDocumentIssuer: string | null;
  /** Numéro d'identification fiscale unique. */
  niu: string | null;
}

/** La résidence et le contact — écran B du KYC. */
export interface KycResidence {
  /** Pays de résidence. */
  country: string | null;
  /** Région de résidence. */
  region: string | null;
  /** Ville de résidence. */
  city: string | null;
  /** Quartier. */
  neighbourhood: string | null;
  /** Repère d'orientation. */
  landmark: string | null;
  /** Boîte postale. */
  postalBox: string | null;
  /** Statut d'occupation du logement. */
  occupationStatus: OccupationStatus | null;
  /** Contact d'urgence. */
  emergencyContact: string | null;
}

/** La situation professionnelle — écran C du KYC. */
export interface KycEmployment {
  /** Situation professionnelle. */
  status: EmploymentStatus | null;
  /** Profession exercée. */
  profession: string | null;
  /** Employeur. */
  employer: string | null;
  /** Secteur d'activité. */
  sector: string | null;
  /** Nature du contrat. */
  contractType: string | null;
  /** Date d'embauche, au format ISO. */
  hiredAt: string | null;
  /** Tranche de revenu mensuel. */
  incomeBand: IncomeBand | null;
  /** Nature du revenu. */
  incomeOrigin: IncomeOrigin | null;
  /**
   * Le revenu mensuel **déclaré**, en francs CFA.
   *
   * C'est la déclaration du demandeur : elle alimente le scoring du prêt.
   * Le revenu *évalué* par la plateforme reste la référence du dossier.
   */
  declaredIncome: number | null;
}

/** La conformité et la déclaration — écran D du KYC. */
export interface KycCompliance {
  /** Le demandeur est-il une personne politiquement exposée ? */
  politicallyExposed: boolean;
  /** Le motif de cette exposition. */
  pepReason: PepReason | null;
  /** Objet de la relation d'affaires. */
  businessRelationship: string | null;
  /** Pays de résidence fiscale. */
  taxResidence: string | null;
  /** L'attestation d'honneur est-elle acceptée ? */
  honourAttestation: boolean;
  /** La mention portée sur l'attestation. */
  honourMention: string | null;
  /**
   * Date et heure de l'acceptation de l'attestation.
   *
   * Elle est enregistrée **côté serveur** : jamais la date du navigateur.
   */
  acceptedAt: string | null;
  /** Le nombre de personnes à charge. */
  dependants: number;
  /** Les crédits en cours — Declaration de patrimoine et credits en cours. */
  existingLoans: string | null;
}

/** Le profil complet du demandeur. */
export interface KycProfile {
  identity: KycIdentity;
  residence: KycResidence;
  employment: KycEmployment;
  compliance: KycCompliance;
}
