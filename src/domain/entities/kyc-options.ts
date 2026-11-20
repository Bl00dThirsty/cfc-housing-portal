export const KYC_OPTION_CATEGORIES = [
  "family_status",
  "employment_status",
  "income_origin",
  "income_band",
  "id_document_type",
  "occupation_status",
  "pep_reason",
] as const;

export type KycOptionCategory = (typeof KYC_OPTION_CATEGORIES)[number];

export type KycOption = {
  code: string;
  label: string;
  sortOrder: number;
};

export type KycOptionGroups = Record<KycOptionCategory, KycOption[]>;

export function emptyKycOptionGroups(): KycOptionGroups {
  const groups: Partial<KycOptionGroups> = {};
  for (const category of KYC_OPTION_CATEGORIES) groups[category] = [];
  return groups as KycOptionGroups;
}
