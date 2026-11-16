"use server";

import { getServerProfile } from "@/server/auth/profile";
import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";
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
  if (!hasCapability(profile.role, capability)) {
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
  const ref = supabase.schema("ref");

  const [services, natures, documentTypes, requirements] = await Promise.all([
    ref
      .from("service")
      .select("code, label, description, is_active, sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    ref
      .from("document_nature")
      .select("code, label, description")
      .is("deleted_at", null)
      .order("code", { ascending: true }),
    ref
      .from("document_type")
      .select(
        "code, label, nature_code, issuing_authority, validity_months, accepted_mime, max_size_bytes, min_count, max_count, valid_from, valid_to",
      )
      .is("deleted_at", null)
      .order("code", { ascending: true }),
    ref
      .from("service_document_requirement")
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

  const admin = getAdminClient();
  const { error } = await admin
    .schema("ref")
    .from("document_type")
    .upsert(
      {
        code,
        label: input.label.trim(),
        nature_code: input.nature_code,
        issuing_authority: input.issuing_authority?.trim() || null,
        validity_months: input.validity_months,
        max_size_bytes: input.max_size_bytes,
        min_count: Math.max(1, input.min_count),
        max_count: input.max_count,
        accepted_mime: ["application/pdf", "image/jpeg", "image/png"],
        valid_from: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    );

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

  const admin = getAdminClient();
  const { error } = await admin
    .schema("ref")
    .from("service")
    .upsert(
      {
        code,
        label: input.label.trim(),
        description: input.description.trim() || null,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    );

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

  const admin = getAdminClient();
  const { error } = await admin
    .schema("ref")
    .from("document_nature")
    .upsert(
      {
        code,
        label: input.label.trim(),
        description: input.description.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    );

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
  const admin = getAdminClient();
  const ref = admin.schema("ref");

  const { error: closeError } = await ref
    .from("service_document_requirement")
    .update({ effective_to: today })
    .eq("service_code", input.service_code)
    .eq("stage", input.stage)
    .eq("doc_type_code", input.doc_type_code)
    .is("effective_to", null);

  if (closeError) return { ok: false, error: closeError.message };

  const { error } = await ref.from("service_document_requirement").upsert(
    {
      service_code: input.service_code,
      stage: input.stage,
      doc_type_code: input.doc_type_code,
      required: input.required,
      min_count: Math.max(1, input.min_count),
      max_count: input.max_count,
      effective_from: today,
      effective_to: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "service_code,stage,doc_type_code,effective_from" },
  );

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
  const admin = getAdminClient();

  const { error } = await admin
    .schema("ref")
    .from("service_document_requirement")
    .update({ effective_to: today })
    .eq("service_code", input.service_code)
    .eq("stage", input.stage)
    .eq("doc_type_code", input.doc_type_code)
    .is("effective_to", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
