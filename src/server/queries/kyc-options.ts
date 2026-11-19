import "server-only";

import {
  emptyKycOptionGroups,
  KYC_OPTION_CATEGORIES,
  type KycOptionCategory,
  type KycOptionGroups,
} from "@/domain/entities/kyc-options";
import { referenceView } from "@/server/queries/reference";
import { createServerSupabaseClient } from "@/server/supabase/server";

type KycOptionRow = {
  category: string;
  code: string;
  label: string;
  sort_order: number;
};

export type KycOptionsResult =
  | { ok: true; options: KycOptionGroups }
  | { ok: false; error: string };

function isKycOptionCategory(value: string): value is KycOptionCategory {
  return (KYC_OPTION_CATEGORIES as readonly string[]).includes(value);
}

/** Load effective, ordered KYC field choices from the public reference view. */
export async function listKycOptions(): Promise<KycOptionsResult> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from(referenceView("kyc_option"))
    .select("category, code, label, sort_order")
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    return { ok: false, error: "Les options du formulaire KYC sont indisponibles." };
  }

  const options = emptyKycOptionGroups();
  for (const row of (data ?? []) as unknown as KycOptionRow[]) {
    if (!isKycOptionCategory(row.category)) continue;
    options[row.category].push({
      code: row.code,
      label: row.label,
      sortOrder: Number(row.sort_order),
    });
  }

  if (KYC_OPTION_CATEGORIES.some((category) => options[category].length === 0)) {
    return { ok: false, error: "Le catalogue KYC est incomplet. Contactez l’assistance CFC." };
  }

  return { ok: true, options };
}
