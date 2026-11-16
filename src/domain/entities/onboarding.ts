import type { SelectedAddress } from "@/domain/entities/address";
import { isValidPhone } from "@/domain/entities/phone";
import {
  isValidCniNumber,
  missingRequiredFields,
  validateKycProfile,
  fromStoredProfile,
  EMPTY_KYC_PROFILE,
  type KycProfile,
} from "@/domain/entities/kyc-profile";

export type AffiliationStatus = "first_time" | "other_bank" | "cfc_existing" | "non_resident";

/**
 * Les étapes du parcours.
 *
 * Le dossier passe **avant** le service : on ne choisit pas un prêt avant
 * d'avoir dit qui l'on est — et c'est aussi ce qui permet d'ouvrir la
 * fenêtre des trois situations face au service.
 *
 * Le compte, lui, n'est plus une étape : il est ouvert par `/inscription`,
 * la seule porte qui en crée un.
 */
export type OnboardingStepId = "kyc" | "service" | "documents";

export const ONBOARDING_STEPS: ReadonlyArray<{
  id: OnboardingStepId;
  index: number;
  title: string;
  caption: string;
}> = [
  { id: "kyc", index: 1, title: "Vos informations", caption: "Identité, résidence, emploi" },
  { id: "service", index: 2, title: "Votre service", caption: "Produit demandé" },
  { id: "documents", index: 3, title: "Vos pièces", caption: "Dossier unique client" },
];

/**
 * Le brouillon du parcours.
 *
 * Ce que le demandeur **déclare** vit dans `profile` : c'est la forme du
 * profil KYC, et elle est la seule. Le nom, le téléphone et la situation
 * bancaire viennent du **compte** : ils sont écrits à l'inscription, et le
 * parcours les relit — il ne les redemande pas.
 */
export type OnboardingDraft = {
  /** Le service choisi : il commande les pièces exigées. */
  serviceCode: string | null;
  /** Le dossier ouvert par l'inscription — il reçoit les pièces déposées. */
  dossierId: string | null;
  /** Le nom du demandeur — il vient du compte. */
  fullName: string;
  /** Le téléphone de contact — il vient du compte. */
  phone: string;
  /** La situation bancaire — elle vient du compte. */
  affiliation: AffiliationStatus | null;
  /** Ce que le demandeur déclare. */
  profile: KycProfile;
};

/** Un profil vide — le point de départ d'un brouillon. */
export { EMPTY_KYC_PROFILE, fromStoredProfile };

export const EMPTY_DRAFT: OnboardingDraft = {
  serviceCode: null,
  dossierId: null,
  fullName: "",
  phone: "",
  affiliation: null,
  profile: EMPTY_KYC_PROFILE,
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

export function parseAmount(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

/**
 * Valide une étape du parcours.
 *
 * L'étape du KYC délègue au **domaine du profil** : les règles de majorité,
 * de pièce d'identité et de date d'embauche y vivent, une seule fois.
 */
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
    case "kyc": {
      if (!isValidPhone(draft.phone)) {
        refuse("phone", "Renseignez un numéro de téléphone valide.");
      }
      if (!draft.affiliation) {
        refuse("affiliation", "Indiquez votre situation bancaire.");
      }

      for (const field of missingRequiredFields(draft.profile)) {
        refuse(field, "Ce champ est obligatoire.");
      }

      const validation = validateKycProfile(draft.profile);
      for (const [field, message] of Object.entries(validation.errors)) {
        refuse(field, message);
      }

      if (
        draft.profile.identity.idDocumentNumber &&
        !isValidCniNumber(draft.profile.identity.idDocumentNumber)
      ) {
        refuse("identity.idDocumentNumber", "Le numéro de CNI est invalide.");
      }

      break;
    }
    case "service": {
      if (!draft.serviceCode) {
        refuse("service", "Choisissez le service pour lequel vous sollicitez un prêt.");
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
 * dossier s'est arrêté. L'ordre est celui du parcours — le dossier d'abord,
 * le service ensuite, les pièces pour finir.
 */
export function resumeStepId(draft: OnboardingDraft): OnboardingStepId {
  if (!validateStep("kyc", draft).valid) return "kyc";
  if (!draft.serviceCode) return "service";
  return "documents";
}

export function stepStatus(
  step: OnboardingStepId,
  draft: OnboardingDraft,
): "done" | "current" | "todo" {
  return validateStep(step, draft).valid ? "done" : "todo";
}

/**
 * L'adresse choisie, telle qu'elle est déclarée.
 *
 * Elle est **une** fois : le profil KYC porte la ville, le quartier et le
 * lieu-dit, et l'adresse complète n'est écrite que sur le dossier.
 */
export function addressLabelOf(address: SelectedAddress | null): string | null {
  return address?.label ?? null;
}
