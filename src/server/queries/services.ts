import { getPublicEnv } from "@/server/env";
import { createServerReferenceClient } from "@/server/supabase/server";
import type {
  DocumentNature,
  DocumentTypeSummary,
  RequirementRow,
  RequiredDocument,
  ServiceSummary,
  ServiceSummaryRow,
} from "@/domain/entities/services";

export type { RequiredDocument, ServiceSummary } from "@/domain/entities/services";

const ONBOARDING_STAGES = ["ONBOARDING", "SAVINGS", "CREDIT_FILE"] as const;

type ServiceRow = ServiceSummaryRow;

type DocumentTypeRow = DocumentTypeSummary;

type NatureRow = DocumentNature;

export async function listServices(): Promise<ServiceSummary[]> {
  const env = getPublicEnv();
  if (!env) return [];

  const ref = await createServerReferenceClient();

  const [
    servicesResult,
    requirementsResult,
    documentTypesResult,
    naturesResult,
    productsResult,
    ratesResult,
  ] = await Promise.all([
    ref
      .from("service")
      .select("code, label, description, audience, is_active, sort_order")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    ref
      .from("service_document_requirement")
      .select("service_code, stage, doc_type_code, required, min_count")
      .is("deleted_at", null),
    ref
      .from("document_type")
      .select("code, label, nature_code, issuing_authority")
      .is("deleted_at", null),
    ref.from("document_nature").select("code, label").is("deleted_at", null),
    // Les produits portent l'apport minimal et la durée maximale : ce sont
    // les deux conditions que la carte doit afficher.
    ref
      .from("product")
      .select("code, label, service_code, min_apport_percent, max_duration_years")
      .is("deleted_at", null)
      .order("code", { ascending: true }),
    // Les barèmes : le taux indicatif du service. Seul le barème **en
    // vigueur** est retenu — un taux périmé ne s'affiche pas.
    ref
      .from("product_rate")
      .select("product_code, annual_rate, savings_rate, valid_from, valid_to")
      .is("deleted_at", null),
  ]);

  if (servicesResult.error) return [];

  const services = (servicesResult.data ?? []) as (ServiceRow & {
    audience: string | null;
  })[];
  const requirements = (requirementsResult.data ?? []) as RequirementRow[];
  const documentTypes = (documentTypesResult.data ?? []) as DocumentTypeRow[];
  const natures = (naturesResult.data ?? []) as NatureRow[];
  const products = (productsResult.data ?? []) as {
    code: string;
    label: string;
    service_code: string;
    min_apport_percent: number | null;
    max_duration_years: number | null;
  }[];
  const rates = (ratesResult.data ?? []) as {
    product_code: string;
    annual_rate: number;
    savings_rate: number | null;
    valid_from: string;
    valid_to: string | null;
  }[];

  const documentByCode = new Map(documentTypes.map((doc) => [doc.code, doc]));
  const natureByCode = new Map(natures.map((nature) => [nature.code, nature]));

  const today = new Date().toISOString().slice(0, 10);

  return services.map((service) => ({
    code: service.code,
    label: service.label,
    description: service.description,
    audience: service.audience ?? null,
    products: products
      .filter((product) => product.service_code === service.code)
      .map((product) => {
        // Le barème en vigueur : le plus récent qui n'est pas périmé.
        const current = rates
          .filter(
            (rate) =>
              rate.product_code === product.code &&
              rate.valid_from <= today &&
              (!rate.valid_to || rate.valid_to >= today),
          )
          .sort((a, b) => b.valid_from.localeCompare(a.valid_from))[0];

        return {
          code: product.code,
          label: product.label,
          minApportPercent: product.min_apport_percent,
          maxDurationYears: product.max_duration_years,
          indicativeRate: current?.annual_rate ?? null,
          savingsRate: current?.savings_rate ?? null,
        };
      }),
    documents: requirements
      .filter(
        (requirement) =>
          requirement.service_code === service.code &&
          (ONBOARDING_STAGES as readonly string[]).includes(requirement.stage),
      )
      .map((requirement) => {
        const document = documentByCode.get(requirement.doc_type_code);
        const nature = document ? natureByCode.get(document.nature_code) : undefined;
        return {
          docTypeCode: requirement.doc_type_code,
          label: document?.label ?? requirement.doc_type_code,
          natureCode: document?.nature_code ?? "AUTRE",
          natureLabel: nature?.label ?? document?.nature_code ?? "Autre",
          issuingAuthority: document?.issuing_authority ?? null,
          required: requirement.required,
          minCount: requirement.min_count,
          stage: requirement.stage,
        } satisfies RequiredDocument;
      }),
  }));
}

export async function listDocumentNatures(): Promise<NatureRow[]> {
  const env = getPublicEnv();
  if (!env) return [];

  const ref = await createServerReferenceClient();
  const { data, error } = await ref
    .from("document_nature")
    .select("code, label")
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (error) return [];
  return (data ?? []) as NatureRow[];
}
