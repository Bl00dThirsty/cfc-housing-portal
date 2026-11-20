export const REGISTER_KEYS = [
  "promoters",
  "bet-experts",
  "notary-offices",
  "subsidies",
  "recovery",
] as const;

export type RegisterKey = (typeof REGISTER_KEYS)[number];

export const REGISTER_LABELS: Record<
  RegisterKey,
  { title: string; description: string; table: string }
> = {
  promoters: {
    title: "Partenaires immobiliers",
    description: "Promoteurs et programmes immobiliers partenaires du dispositif.",
    table: "registers_promoters",
  },
  "bet-experts": {
    title: "Bureaux d'études techniques",
    description: "BET, experts et qualifications mobilisables sur les dossiers.",
    table: "registers_bet_experts",
  },
  "notary-offices": {
    title: "Études notariales",
    description: "Offices notariaux partenaires et leurs références d'enregistrement.",
    table: "registers_notary_offices",
  },
  subsidies: {
    title: "Subventions",
    description: "Subventions, sources de financement et décisions d'éligibilité.",
    table: "registers_subsidies",
  },
  recovery: {
    title: "Recouvrement",
    description: "Dossiers en arriéré, étapes, notifications et escalades.",
    table: "registers_recovery_cases",
  },
};

export interface RegisterRecord {
  id: string;
  label: string;
  region: string | null;
  status: string;
  updatedAt: string;
  fields: { label: string; value: string }[];
}

export type RegisterInput = Record<string, string | number | boolean | null>;

export type ValidationResult =
  | { ok: true; value: RegisterInput }
  | { ok: false; errors: Record<string, string> };

export function validateRegisterInput(
  key: RegisterKey,
  input: RegisterInput,
): ValidationResult {
  const errors: Record<string, string> = {};
  const label = typeof input.label === "string" ? input.label.trim() : "";
  if (label.length < 2 || label.length > 160) {
    errors.label = "Renseignez un libellé de 2 à 160 caractères.";
  }
  if (input.region !== null && input.region !== undefined && typeof input.region !== "string") {
    errors.region = "La région doit être un texte.";
  }
  if (
    input.status !== "active" &&
    input.status !== "inactive" &&
    input.status !== "suspended"
  ) {
    errors.status = "Choisissez un statut valide.";
  }
  if (key === "subsidies" && (typeof input.amount !== "number" || input.amount < 0)) {
    errors.amount = "Le montant doit être positif.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ...input,
      label,
      region: typeof input.region === "string" ? input.region.trim() : null,
    },
  };
}
