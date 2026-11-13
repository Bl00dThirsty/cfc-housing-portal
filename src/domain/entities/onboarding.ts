import type { SelectedAddress } from "@/domain/entities/address";
import { isValidPhone } from "@/domain/entities/phone";

export type AffiliationStatus = "first_time" | "other_bank" | "cfc_existing" | "non_resident";

export type OnboardingStepId = "account" | "service" | "profile" | "documents";

export type OnboardingDraft = {
  email: string;
  phone: string;
  affiliation: AffiliationStatus | null;
  serviceCode: string | null;
  fullName: string;
  birthDate: string;
  cniNumber: string;
  address: SelectedAddress | null;
  profession: string;
  employer: string;
  monthlyIncome: string;
  dependants: number;
  existingLoans: string;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  email: "",
  phone: "",
  affiliation: null,
  serviceCode: null,
  fullName: "",
  birthDate: "",
  cniNumber: "",
  address: null,
  profession: "",
  employer: "",
  monthlyIncome: "",
  dependants: 0,
  existingLoans: "",
};

export type AffiliationOption = {
  value: AffiliationStatus;
  label: string;
  description: string;
  consequence: string;
};

export const AFFILIATION_OPTIONS: ReadonlyArray<AffiliationOption> = [
  {
    value: "first_time",
    label: "Première fois",
    description: "Vous n'avez jamais eu de compte bancaire ni de crédit immobilier.",
    consequence: "KYC complet : identification, justificatifs de revenus et constitution d'épargne.",
  },
  {
    value: "other_bank",
    label: "Déjà client d'une autre banque",
    description: "Vous êtes déjà bancaire, mais chez un établissement autre que le CFC.",
    consequence:
      "KYC complet et autorisation de consultation de votre historique de crédit auprès de cet établissement.",
  },
  {
    value: "cfc_existing",
    label: "Déjà client du CFC",
    description: "Vous avez déjà un compte ou un dossier au Crédit Foncier du Cameroun.",
    consequence:
      "Aucune nouvelle identification : votre dossier existant est mis à jour et un nouveau dossier est ouvert.",
  },
  {
    value: "non_resident",
    label: "Non-résident / Diaspora",
    description: "Vous vivez hors du Cameroun, ou vous y résidez moins de douze mois.",
    consequence:
      "Vérification renforcée : attestation de conformité de votre banque de résidence et identification du mandataire.",
  },
];

export const ONBOARDING_STEPS: ReadonlyArray<{
  id: OnboardingStepId;
  index: number;
  title: string;
  caption: string;
}> = [
  { id: "account", index: 1, title: "Votre compte", caption: "Identité et situation" },
  { id: "service", index: 2, title: "Votre service", caption: "Produit demandé" },
  { id: "profile", index: 3, title: "Votre dossier", caption: "Coordonnées et revenus" },
  { id: "documents", index: 4, title: "Vos pièces", caption: "Dossier unique client" },
];

export type StepValidation = {
  valid: boolean;
  errors: string[];
  /**
   * Le refus, rattaché à son champ.
   *
   * Une liste de messages oblige l'utilisateur à les deviner un par un ; ici,
   * chaque champ sait ce qu'il lui reproche.
   */
  fields: Record<string, string>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(raw: string): boolean {
  return EMAIL_PATTERN.test(raw.trim());
}

export function isValidCni(raw: string): boolean {
  const value = raw.replace(/[^A-Za-z0-9]/g, "");
  return value.length >= 6 && value.length <= 20;
}

export function isAdult(birthDate: string, reference = new Date()): boolean {
  if (!birthDate) return false;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return false;

  let age = reference.getFullYear() - parsed.getFullYear();
  const monthDelta = reference.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && reference.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return age >= 18;
}

export function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function validateStep(
  step: OnboardingStepId,
  draft: OnboardingDraft,
): StepValidation {
  const errors: string[] = [];
  const fields: Record<string, string> = {};

  const refuse = (field: string, message: string) => {
    errors.push(message);
    fields[field] ??= message;
  };

  switch (step) {
    case "account": {
      if (!isValidEmail(draft.email)) {
        refuse("email", "Renseignez une adresse e-mail valide.");
      }
      if (!isValidPhone(draft.phone)) {
        refuse("phone", "Renseignez un numéro de téléphone valide.");
      }
      if (!draft.affiliation) {
        refuse("affiliation", "Indiquez votre situation bancaire.");
      }
      break;
    }
    case "service": {
      if (!draft.serviceCode) {
        refuse("service", "Choisissez le service pour lequel vous sollicitez un prêt.");
      }
      break;
    }
    case "profile": {
      if (draft.fullName.trim().length < 3) {
        refuse("fullName", "Renseignez votre nom complet.");
      }
      if (!isAdult(draft.birthDate)) {
        refuse("birthDate", "Vous devez être majeur pour solliciter un prêt.");
      }
      if (!isValidCni(draft.cniNumber)) {
        refuse("cniNumber", "Renseignez un numéro de CNI valide.");
      }
      if (!draft.address) {
        refuse("address", "Renseignez votre adresse de résidence.");
      }
      if (parseAmount(draft.monthlyIncome) <= 0) {
        refuse("monthlyIncome", "Renseignez votre revenu mensuel.");
      }
      break;
    }
    case "documents": {
      break;
    }
  }

  return { valid: errors.length === 0, errors, fields };
}

/**
 * L'étape à reprendre.
 *
 * Un visiteur qui revient ne repart pas de zéro : il reprend là où son
 * dossier s'est arrêté. L'ordre est celui du parcours — on ne peut pas
 * choisir son service avant d'avoir dit qui l'on est.
 */
export function resumeStepId(draft: OnboardingDraft): OnboardingStepId {
  if (!draft.phone || !draft.affiliation) return "account";
  if (!draft.serviceCode) return "service";
  if (!draft.fullName.trim() || !draft.cniNumber.trim() || !draft.address) return "profile";
  return "documents";
}

export function stepStatus(
  step: OnboardingStepId,
  draft: OnboardingDraft,
): "done" | "current" | "todo" {
  return validateStep(step, draft).valid ? "done" : "todo";
}
