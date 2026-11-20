/**
 * Accès au catalogue des modèles d'e-mail (`ref.email_template`).
 *
 * Le catalogue est **versionné** : une ligne = une version. La version
 * courante est la plus récente dont la période de validité couvre l'instant
 * présent. Si aucune ligne n'est exploitable (catalogue vide, base
 * indisponible, code inconnu), le **modèle par défaut** embarqué prend le
 * relais : le service d'e-mail ne dépend jamais du référentiel pour
 * fonctionner.
 */

import "server-only";

import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { referenceView } from "@/server/queries/reference";
import { defaultTemplateFor, EMAIL_TEMPLATE_CODES } from "./defaults";
import { isVersionEffective, type VersionedTemplate } from "./versioning";
import type { EmailTemplateContent, EmailTemplateRow } from "./types";

/** Source de lecture du catalogue. */
export interface TemplateLookupOptions {
  /**
   * `true` : lecture par la clé de service (chaîne d'envoi, sans session).
   * `false` (défaut) : lecture par la session de l'agent — les politiques RLS
   * s'appliquent.
   */
  service?: boolean;
}

/** Modèle résolu et provenance de la résolution. */
export interface ResolvedTemplate {
  /** Modèle retenu. */
  template: EmailTemplateContent;
  /** `true` quand le modèle par défaut a été utilisé (catalogue muet). */
  isFallback: boolean;
}

/** Convertit une ligne du catalogue en modèle exploitable. */
export function toTemplateContent(row: EmailTemplateRow): EmailTemplateContent {
  return {
    code: row.code,
    version: row.version,
    label: row.label,
    subject: row.subject_template,
    html: row.html_template,
    text: row.text_template,
    eventType: row.event_type,
    audience: row.audience,
    isActive: row.is_active,
    variables: row.variables ?? [],
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  };
}

/**
 * Lit les lignes du catalogue pour un code donné.
 *
 * Ne lève jamais : une base indisponible se traduit par une liste vide, et
 * l'appelant bascule sur le modèle par défaut.
 */
async function readRows(
  code: string,
  options: TemplateLookupOptions = {},
): Promise<EmailTemplateRow[]> {
  try {
    const client = options.service ? getAdminClient() : await createServerSupabaseClient();
    const { data, error } = await client
      .from(referenceView("email_template"))
      .select("*")
      .eq("code", code)
      .is("deleted_at", null);

    if (error || !data) return [];
    return data as EmailTemplateRow[];
  } catch {
    return [];
  }
}

/** Les versions encore en vigueur d'un code, de la plus ancienne à la plus récente. */
function effectiveRows(rows: EmailTemplateRow[], at: Date = new Date()): EmailTemplateRow[] {
  return rows
    .filter((row) =>
      isVersionEffective(
        {
          code: row.code,
          version: row.version,
          effective_from: row.effective_from,
          effective_to: row.effective_to,
          is_active: row.is_active,
          deleted_at: row.deleted_at,
        },
        at,
      ),
    )
    .sort((a, b) => a.version - b.version);
}

/**
 * Modèle courant d'un code : la version effective la plus récente.
 *
 * Repli sur le modèle par défaut si le catalogue ne dit rien.
 */
export async function getActiveTemplate(
  code: string,
  options: TemplateLookupOptions = {},
): Promise<ResolvedTemplate> {
  const rows = await readRows(code, options);
  const current = effectiveRows(rows).pop();

  if (current) {
    return { template: toTemplateContent(current), isFallback: false };
  }

  const fallback = defaultTemplateFor(code);
  if (fallback) {
    return { template: fallback, isFallback: true };
  }

  // Code inconnu : on renvoie un modèle neutre, l'envoi échouera proprement
  // sur la variable manquante plutôt que de lever une exception opaque.
  return {
    template: {
      code,
      version: 0,
      label: code,
      subject: "Notification CFC Habitat",
      html: "<p>Notification CFC Habitat.</p>",
      text: "Notification CFC Habitat.",
      eventType: code,
      audience: "citizen",
      isActive: true,
      variables: [],
      effectiveFrom: "1970-01-01T00:00:00.000Z",
      effectiveTo: null,
    },
    isFallback: true,
  };
}

/** Historique complet d'un code (toutes versions, anciennes comprises). */
export async function getTemplateHistory(
  code: string,
  options: TemplateLookupOptions = {},
): Promise<EmailTemplateContent[]> {
  const rows = await readRows(code, options);
  return rows
    .sort((a, b) => b.version - a.version)
    .map((row) => toTemplateContent(row));
}

/** Variables déclarées par le modèle courant d'un code. */
export async function getTemplatePlaceholders(
  code: string,
  options: TemplateLookupOptions = {},
): Promise<string[]> {
  const { template } = await getActiveTemplate(code, options);
  return template.variables;
}

/** Vue catalogue : une ligne par code, avec sa version courante. */
export interface CatalogueEntry {
  code: string;
  label: string;
  audience: EmailTemplateContent["audience"];
  eventType: string;
  isActive: boolean;
  version: number;
  variables: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  /** `true` quand la version courante provient du modèle par défaut. */
  isFallback: boolean;
}

/**
 * Liste le catalogue courant : la dernière version connue de chaque code.
 *
 * Les codes sans ligne en base sont complétés par le modèle par défaut,
 * pour que l'éditeur ne présente jamais un trou.
 */
export async function listCatalogue(
  options: TemplateLookupOptions = {},
): Promise<CatalogueEntry[]> {
  let rows: EmailTemplateRow[] = [];

  try {
    const client = options.service ? getAdminClient() : await createServerSupabaseClient();
    const { data, error } = await client
      .from(referenceView("email_template"))
      .select("*")
      .is("deleted_at", null);

    if (!error && data) rows = data as EmailTemplateRow[];
  } catch {
    rows = [];
  }

  const byCode = new Map<string, EmailTemplateRow[]>();
  for (const row of rows) {
    const bucket = byCode.get(row.code);
    if (bucket) bucket.push(row);
    else byCode.set(row.code, [row]);
  }

  const entries: CatalogueEntry[] = [];

  // Les codes connus du service sont toujours listés : un modèle absent de la
  // base reste éditable (la publication en crée la version 1).
  for (const code of EMAIL_TEMPLATE_CODES) {
    const codeRows = byCode.get(code);
    byCode.delete(code);

    if (!codeRows || codeRows.length === 0) {
      const fallback = defaultTemplateFor(code);
      if (!fallback) continue;
      entries.push({
        code,
        label: fallback.label,
        audience: fallback.audience,
        eventType: fallback.eventType,
        isActive: fallback.isActive,
        version: fallback.version,
        variables: fallback.variables,
        effectiveFrom: fallback.effectiveFrom,
        effectiveTo: fallback.effectiveTo,
        isFallback: true,
      });
      continue;
    }

    const current = [...codeRows].sort((a, b) => b.version - a.version)[0];
    const template = toTemplateContent(current);
    entries.push({
      code,
      label: template.label,
      audience: template.audience,
      eventType: template.eventType,
      isActive: template.isActive,
      version: template.version,
      variables: template.variables,
      effectiveFrom: template.effectiveFrom,
      effectiveTo: template.effectiveTo,
      isFallback: false,
    });
  }

  // Codes présents en base mais inconnus du service : ils restent visibles.
  for (const [code, codeRows] of byCode) {
    const current = [...codeRows].sort((a, b) => b.version - a.version)[0];
    const template = toTemplateContent(current);
    entries.push({
      code,
      label: template.label,
      audience: template.audience,
      eventType: template.eventType,
      isActive: template.isActive,
      version: template.version,
      variables: template.variables,
      effectiveFrom: template.effectiveFrom,
      effectiveTo: template.effectiveTo,
      isFallback: false,
    });
  }

  return entries.sort((a, b) => a.code.localeCompare(b.code));
}

/** Vue d'une version, reduced to what the editor needs. */
export type { VersionedTemplate };
