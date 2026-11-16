/**
 * Les règles du parcours du demandeur — KYC et onboarding.
 *
 * Module **pur** : aucune importation. Les règles y sont parce que les écrans
 * ne doivent pas les réinventer, et que les tests doivent pouvoir les
 * vérifier sans base.
 *
 * ⚠️ Ce module ne possède **pas** l'état du KYC : il est dans
 * `citizen_profiles.kyc_state` et la machine à états de
 * `src/domain/workflows/kyc.ts`. `citizenKycBadge` en est une **projection**.
 */

import type { KycBadge, KycProfile } from "./kyc";
import { isValidPhone } from "./phone";

/** Ancienneté exigée pour être client du CFC avant de souscrire un prêt. */
export const CFC_CLIENT_ANCENNETE_MOIS = 6;

/** La durée minimale de la période contractuelle d'épargne (cartographie PR-03). */
export const PEL_PERIODE_MINIMALE_MOIS = 12;

/** L'ancienneté exigée chez l'employeur actuel par le prêt classique. */
export const PRET_CLASSIQUE_ANCIENNETE_MOIS = 12;

/** L'ancienneté de CDI exigée par le prêt jeune. */
export const PRET_JEUNE_ANCIENNETE_CDI_MOIS = 24;

/** Le délai indicatif de reprise du conseiller, après transmission. */
export const DELAI_REPRISE_CONSEILLER_JOURS = 7;

/** L'âge minimum requis pour être particulier. */
export const AGE_MAJORITE = 18;

/** Les trois situations possibles face à un service. */
export type PriorClientCase = "premiere_fois" | "deja_autre_cfc" | "deja_au_cfc";

export const PRIOR_CLIENT_CASES: readonly {
  value: PriorClientCase;
  label: string;
  /** Le cas autorise-t-il à souscrire maintenant ? */
  eligible: boolean;
}[] = [
  {
    value: "premiere_fois",
    label: "C'est la première fois que j'ai affaire au CFC.",
    eligible: false,
  },
  {
    value: "deja_autre_cfc",
    label: "J'ai déjà bénéficié de ce type de service, mais pas au CFC.",
    eligible: false,
  },
  {
    value: "deja_au_cfc",
    label: "J'ai déjà bénéficié de ce service au CFC.",
    eligible: true,
  },
];

/** Un conseiller de démonstration. */
export type DemoAdvisor = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

/** Les quatre conseillers de démonstration — l'un d'eux est inactif. */
export const DEMO_ADVISORS: readonly DemoAdvisor[] = [
  { id: "adv-1", name: "Mme Mbezele", email: "mbezele@cfc.cm", active: true },
  { id: "adv-2", name: "M. Tagne", email: "tagne@cfc.cm", active: true },
  { id: "adv-3", name: "Mme Manga", email: "manga@cfc.cm", active: true },
  { id: "adv-4", name: "M. Ndi", email: "ndi@cfc.cm", active: false },
];

/**
 * Le conseiller affecté, par rotation simple.
 *
 * Le conseiller inactif est ignoré : la rotation ne s'arrête jamais sur lui.
 */
export function advisorForSequence(index: number): DemoAdvisor {
  const active = DEMO_ADVISORS.filter((advisor) => advisor.active);
  return active[index % active.length];
}

/** Les champs qui bloquent l'accès au choix du service. */
export const REQUIRED_FIELDS = [
  "identity.birthDate",
  "identity.nationality",
  "identity.idDocumentType",
  "identity.idDocumentNumber",
  "identity.idDocumentExpiresAt",
  "employment.status",
  "employment.contractType",
  "employment.hiredAt",
] as const;

export type KycField = (typeof REQUIRED_FIELDS)[number];

/** Les champs bloquants qui manquent encore. */
export function missingRequiredFields(profile: KycProfile): KycField[] {
  const missing: KycField[] = [];

  for (const field of REQUIRED_FIELDS) {
    const [group, key] = field.split(".") as [keyof KycProfile, string];
    const value = (profile[group] as unknown as Record<string, unknown>)[key];
    if (value === null || value === undefined || value === "") missing.push(field);
  }

  return missing;
}

/** Le résultat d'une validation. */
export type KycValidation = {
  ok: boolean;
  errors: Record<string, string>;
};

/** Un numéro de CNI : 6 à 12 caractères alphanumériques. */
const CNI = /^[A-Z0-9-]{6,12}$/;

/** Un numéro de CNI valide. */
export function isValidCniNumber(value: string): boolean {
  return CNI.test(value.trim().toUpperCase());
}

/** L'âge révolu à une date donnée. */
function ageOn(birthDate: string, today: Date): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return -1;

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Valide un profil de KYC.
 *
 * Les règles qui bloquent : majorité, pièce d'identité non expirée, date
 * d'embauche non future, formats de téléphone et de CNI.
 */
export function validateKycProfile(
  profile: KycProfile,
  today: Date = new Date(),
): KycValidation {
  const errors: Record<string, string> = {};
  const { identity, employment } = profile;

  if (identity.birthDate) {
    const age = ageOn(identity.birthDate, today);
    if (age < 0) errors["identity.birthDate"] = "Date de naissance illisible.";
    else if (age < AGE_MAJORITE) {
      errors["identity.birthDate"] = `Il faut avoir ${AGE_MAJORITE} ans pour demander un prêt.`;
    }
  }

  if (identity.idDocumentExpiresAt) {
    const expiry = new Date(identity.idDocumentExpiresAt);
    if (Number.isNaN(expiry.getTime())) {
      errors["identity.idDocumentExpiresAt"] = "Date d'expiration illisible.";
    } else if (expiry.getTime() < today.getTime()) {
      errors["identity.idDocumentExpiresAt"] = "La pièce d'identité est expirée.";
    }
  }

  if (identity.idDocumentNumber && !isValidCniNumber(identity.idDocumentNumber)) {
    errors["identity.idDocumentNumber"] = "Le numéro de CNI est invalide.";
  }

  if (employment.hiredAt) {
    const hired = new Date(employment.hiredAt);
    if (Number.isNaN(hired.getTime())) {
      errors["employment.hiredAt"] = "Date d'embauche illisible.";
    } else if (hired.getTime() > today.getTime()) {
      errors["employment.hiredAt"] = "La date d'embauche ne peut pas être dans le futur.";
    }
  }

  return Object.keys(errors).length === 0
    ? { ok: true, errors: {} }
    : { ok: false, errors };
}

/**
 * Le badge KYC affiché au demandeur.
 *
 * C'est une **projection** des états internes de la machine à états
 * (`src/domain/workflows/kyc.ts`) sur les quatre valeurs affichées. Elle ne
 * crée pas un second vocabulaire : `citizen_profiles.kyc_state` reste le
 * seul propriétaire de l'état.
 */
export function citizenKycBadge(kycState: string): KycBadge {
  if (kycState === "blocked" || kycState === "offboarded") return "rejete";
  if (kycState === "approved" || kycState === "active") return "verifie";
  if (
    kycState === "approval_pending" ||
    kycState === "review_due" ||
    kycState === "review_in_progress"
  ) {
    return "soumis";
  }
  return "incomplet";
}

// ---------------------------------------------------------------------------
// L'inscription
// ---------------------------------------------------------------------------

/** Le type de compte — seul le particulier est ouvert aujourd'hui. */
export type SignupAccountType = "particulier" | "entreprise";

/** Ce que l'inscription attend du demandeur. */
export interface SignupInput {
  accountType: SignupAccountType;
  fullName: string;
  email: string;
  phone: string;
  cniNumber: string;
  password: string;
  passwordConfirm: string;
  /** Le consentement a-t-il été donné ? */
  consent: boolean;
}

/** Le texte du consentement — il est **daté par le serveur** à l'inscription. */
export const SIGNUP_CONSENT_TEXT =
  "J'autorise le Crédit Foncier du Cameroun à vérifier mon identité et les pièces que je dépose, et à traiter mes données personnelles dans le cadre de ma demande de prêt.";

/** La longueur minimale du mot de passe. */
export const MIN_PASSWORD_LENGTH = 8;

/** Le résultat d'une validation de saisie. */
export type SignupValidation = {
  ok: boolean;
  errors: Record<string, string>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valide l'inscription.
 *
 * La validation est **pure** : elle est vérifiable sans base et sans session.
 * L'action serveur s'appuie sur elle — elle ne la réécrit pas.
 */
export function validateSignupInput(input: SignupInput): SignupValidation {
  const errors: Record<string, string> = {};

  if (input.accountType !== "particulier") {
    errors.accountType = "Le compte entreprise n'est pas encore ouvert.";
  }

  if (input.fullName.trim().length < 3) {
    errors.fullName = "Renseignez votre nom complet.";
  }

  if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Renseignez une adresse e-mail valide.";
  }

  if (!isValidPhone(input.phone)) {
    errors.phone = "Renseignez un numéro de téléphone valide.";
  }

  if (!isValidCniNumber(input.cniNumber)) {
    errors.cniNumber = "Renseignez un numéro de CNI valide.";
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Le mot de passe doit compter au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  if (input.password !== input.passwordConfirm) {
    errors.passwordConfirm = "Les deux mots de passe ne sont pas identiques.";
  }

  if (!input.consent) {
    errors.consent = "Vous devez accepter la collecte de vos données pour continuer.";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
