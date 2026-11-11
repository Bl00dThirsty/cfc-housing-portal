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

  const [servicesResult, requirementsResult, documentTypesResult, naturesResult] =
    await Promise.all([
      ref
        .from("service")
        .select("code, label, description, is_active, sort_order")
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
    ]);

  if (servicesResult.error) return [];

  const services = (servicesResult.data ?? []) as ServiceRow[];
  const requirements = (requirementsResult.data ?? []) as RequirementRow[];
  const documentTypes = (documentTypesResult.data ?? []) as DocumentTypeRow[];
  const natures = (naturesResult.data ?? []) as NatureRow[];

  const documentByCode = new Map(documentTypes.map((doc) => [doc.code, doc]));
  const natureByCode = new Map(natures.map((nature) => [nature.code, nature]));

  return services.map((service) => ({
    code: service.code,
    label: service.label,
    description: service.description,
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
