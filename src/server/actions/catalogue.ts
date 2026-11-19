"use server";

import { getServerProfile } from "@/server/auth/profile";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { referenceView } from "@/server/queries/reference";
import { type Capability } from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";

/**
 * Paramétrage du catalogue documentaire.
 *
 * Le catalogue est la surface la plus sensible de la plateforme : une
 * modification du jeu de pièces exigés change la règle applicable aux
 * dossiers. L'écriture se fait donc en deux temps — **vérification de la
 * capacité côté action**, puis écriture privilégiée via le client
 * `service_role`. La RLS reste la barrière pour tout accès direct.
 */

export type CatalogueResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CatalogueSnapshot = {
  services: {
    code: string;
    label: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
  }[];
  natures: { code: string; label: string; description: string | null }[];
  documentTypes: {
    code: string;
    label: string;
    nature_code: string;
    issuing_authority: string | null;
    validity_months: number | null;
    accepted_mime: string[];
    max_size_bytes: number;
    min_count: number;
    max_count: number | null;
    valid_from: string;
    valid_to: string | null;
  }[];
  requirements: {
    id: string;
    service_code: string;
    stage: string;
    doc_type_code: string;
    required: boolean;
    min_count: number;
    max_count: number | null;
    effective_from: string;
    effective_to: string | null;
  }[];
};

async function authorise(capability: Capability): Promise<CatalogueResult<null>> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };
  if (!hasCapability(profile.role, capability, profile.capabilities)) {
    return {
      ok: false,
      error: "Votre habilitation ne permet pas de modifier le catalogue.",
    };
  }
  return { ok: true, data: null };
}

export async function listCatalogueAction(): Promise<CatalogueResult<CatalogueSnapshot>> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };

  const supabase = await createServerSupabaseClient();

  const [services, natures, documentTypes, requirements] = await Promise.all([
    supabase
      .from(referenceView("service"))
      .select("code, label, description, is_active, sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from(referenceView("document_nature"))
      .select("code, label, description")
      .is("deleted_at", null)
      .order("code", { ascending: true }),
    supabase
      .from(referenceView("document_type"))
      .select(
        "code, label, nature_code, issuing_authority, validity_months, accepted_mime, max_size_bytes, min_count, max_count, valid_from, valid_to",
      )
      .is("deleted_at", null)
      .order("code", { ascending: true }),
    supabase
      .from(referenceView("service_document_requirement"))
      .select(
        "id, service_code, stage, doc_type_code, required, min_count, max_count, effective_from, effective_to",
      )
      .is("deleted_at", null)
      .order("service_code", { ascending: true })
      .order("stage", { ascending: true }),
  ]);

  const error = services.error ?? natures.error ?? documentTypes.error ?? requirements.error;
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: {
      services: (services.data ?? []) as CatalogueSnapshot["services"],
      natures: (natures.data ?? []) as CatalogueSnapshot["natures"],
      documentTypes: (documentTypes.data ?? []) as CatalogueSnapshot["documentTypes"],
      requirements: (requirements.data ?? []) as CatalogueSnapshot["requirements"],
    },
  };
}

export async function upsertDocumentTypeAction(input: {
  code: string;
  label: string;
  nature_code: string;
  issuing_authority: string | null;
  validity_months: number | null;
  max_size_bytes: number;
  min_count: number;
  max_count: number | null;
}): Promise<CatalogueResult<null>> {
  const auth = await authorise("catalogue:write");
  if (!auth.ok) return auth;

  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!code) return { ok: false, error: "Le code de la pièce est obligatoire." };

  // L'écriture du référentiel passe par une **fonction** de la plateforme :
  // le schéma `ref` n'est pas exposé à l'API, et c'est la fonction qui
  // vérifie l'habilitation — `security definer` contourne la RLS.
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_upsert_document_type", {
    p_code: code,
    p_label: input.label.trim(),
    p_nature_code: input.nature_code,
    p_issuing_authority: input.issuing_authority?.trim() || null,
    p_validity_months: input.validity_months,
    p_max_size_bytes: input.max_size_bytes,
    p_min_count: Math.max(1, input.min_count),
    p_max_count: input.max_count,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function upsertServiceAction(input: {
  code: string;
  label: string;
  description: string;
  is_active: boolean;
}): Promise<CatalogueResult<null>> {
  const auth = await authorise("catalogue:write");
  if (!auth.ok) return auth;

  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!code) return { ok: false, error: "Le code du service est obligatoire." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_upsert_service", {
    p_code: code,
    p_label: input.label.trim(),
    p_description: input.description.trim() || null,
    p_is_active: input.is_active,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function upsertNatureAction(input: {
  code: string;
  label: string;
  description: string;
}): Promise<CatalogueResult<null>> {
  const auth = await authorise("catalogue:write");
  if (!auth.ok) return auth;

  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!code) return { ok: false, error: "Le code de la nature est obligatoire." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_upsert_document_nature", {
    p_code: code,
    p_label: input.label.trim(),
    p_description: input.description.trim() || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

/**
 * Exigence documentaire — versionnée par date d'effet.
 *
 * Une ligne vivante (`effective_to is null`) n'est jamais réécrite : elle est
 * fermée à la date du jour et une nouvelle ligne est ouverte. Un dossier
 * ouvert sous l'ancienne règle reste donc auditable sous cette règle.
 */
export async function upsertRequirementAction(input: {
  service_code: string;
  stage: string;
  doc_type_code: string;
  required: boolean;
  min_count: number;
  max_count: number | null;
}): Promise<CatalogueResult<null>> {
  const auth = await authorise("catalogue:write");
  if (!auth.ok) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createServerSupabaseClient();

  // La ligne vivante est **fermée**, jamais réécrite : un dossier ouvert sous
  // l'ancienne règle reste auditable sous cette règle.
  const { error: closeError } = await supabase.rpc("cfc_close_service_requirement", {
    p_service_code: input.service_code,
    p_stage: input.stage,
    p_doc_type_code: input.doc_type_code,
    p_effective_to: today,
  });

  if (closeError) return { ok: false, error: closeError.message };

  const { error } = await supabase.rpc("cfc_open_service_requirement", {
    p_service_code: input.service_code,
    p_stage: input.stage,
    p_doc_type_code: input.doc_type_code,
    p_required: input.required,
    p_min_count: Math.max(1, input.min_count),
    p_max_count: input.max_count,
    p_effective_from: today,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function deleteRequirementAction(input: {
  service_code: string;
  stage: string;
  doc_type_code: string;
}): Promise<CatalogueResult<null>> {
  const auth = await authorise("catalogue:write");
  if (!auth.ok) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("cfc_close_service_requirement", {
    p_service_code: input.service_code,
    p_stage: input.stage,
    p_doc_type_code: input.doc_type_code,
    p_effective_to: today,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
