import { createServerSupabaseClient } from "@/server/supabase/server";
import { fromStoredProfile, type KycProfile } from "@/domain/entities/kyc-profile";
import type { AffiliationStatus } from "@/domain/entities/onboarding";

/**
 * La lecture du parcours du demandeur.
 *
 * Elle rassemble ce que l'agent lit sur un dossier : les **déclarations** du
 * citoyen (le profil KYC), la **copie de travail** de la plateforme (le
 * dossier), l'**état** de la machine, et les **pièces** déclarées.
 *
 * Elle ne déduit rien : l'état vient de `citizen_profiles.kyc_state`, et les
 * pièces de `kyc_documents`.
 */

export interface KycDocumentRow {
  id: string;
  docCode: string;
  label: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  sentAt: string;
}

export interface KycProfileView {
  /** Les déclarations du citoyen. */
  profile: KycProfile;
  /** L'état de la machine à états. */
  kycState: string;
  /** Whether actor-level KYC was already submitted. */
  kycSubmitted: boolean;
  /** Le nom du demandeur — il vient du compte. */
  fullName: string;
  /** Le téléphone de contact, au format international. */
  phone: string;
  /** La situation bancaire. */
  affiliation: AffiliationStatus | null;
  /** Le code du dossier, s'il est ouvert. */
  dossierCode: string | null;
  /** L'avancement du parcours. */
  onboardingState: string | null;
  /** Les pièces déclarées par le demandeur. */
  documents: KycDocumentRow[];
}

/**
 * Lit le parcours d'un citoyen.
 *
 * Un dossier absent n'est pas une erreur : il rend un parcours vide, que
 * l'écran sait remplir.
 */
export async function getKycProfileQuery(citizenId: string, dossierId: string): Promise<KycProfileView> {
  const supabase = await createServerSupabaseClient();

  const [profileResult, dossierResult, documentsResult] = await Promise.all([
    supabase
      .from("citizen_profiles")
      .select("full_name, phone, affiliation_status, kyc_state")
      .eq("id", citizenId)
      .maybeSingle(),
    supabase
      .from("dossiers")
      .select("duc_code, onboarding_state")
      .eq("citizen_id", citizenId)
      .eq("id", dossierId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("kyc_documents")
      .select(
        "id, doc_code, label, category, file_name, file_type, file_size, sent_at",
      )
      .eq("citizen_id", citizenId)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false }),
  ]);

  const citizen = profileResult.data as {
    full_name: string | null;
    phone: string | null;
    affiliation_status: string | null;
    kyc_state: string | null;
  } | null;

  const dossier = dossierResult.data as {
    duc_code: string | null;
    onboarding_state: string | null;
  } | null;

  const documents = (documentsResult.data ?? []) as {
    id: string;
    doc_code: string;
    label: string;
    category: string;
    file_name: string;
    file_type: string;
    file_size: number;
    sent_at: string;
  }[];

  // Le profil déclaratif est une autre table : il porte les quatre groupes
  // de déclarations.
  const { data: kyc } = await supabase
    .from("kyc_profiles")
    .select("identity, residence, employment, compliance, submitted_at")
    .eq("citizen_id", citizenId)
    .maybeSingle();

  const declared = (kyc ?? null) as {
    identity: Record<string, unknown> | null;
    residence: Record<string, unknown> | null;
    employment: Record<string, unknown> | null;
    compliance: Record<string, unknown> | null;
    submitted_at: string | null;
  } | null;

  return {
    profile: fromStoredProfile(declared),
    kycState: citizen?.kyc_state ?? "pre_boarding",
    kycSubmitted: declared?.submitted_at !== null && declared?.submitted_at !== undefined,
    fullName: citizen?.full_name ?? "",
    phone: citizen?.phone ?? "",
    affiliation: (citizen?.affiliation_status as AffiliationStatus | null) ?? null,
    dossierCode: dossier?.duc_code ?? null,
    onboardingState: dossier?.onboarding_state ?? null,
    documents: documents.map((document) => ({
      id: document.id,
      docCode: document.doc_code,
      label: document.label,
      category: document.category,
      fileName: document.file_name,
      fileType: document.file_type,
      fileSize: document.file_size,
      sentAt: document.sent_at,
    })),
  };
}
