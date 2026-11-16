import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { loadOnboardingDraft } from "@/server/actions/onboarding";
import { getPublicEnv } from "@/server/env";
import { getKycProfileQuery } from "@/server/queries/kyc-profile";
import { listServices } from "@/server/queries/services";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { EMPTY_DRAFT } from "@/domain/entities/onboarding";
import { KYC_DOCUMENT_CODES } from "@/domain/entities/kyc-profile";

/**
 * L'assistant de dossier — la route qui rend le parcours.
 *
 * Elle charge trois choses : le **catalogue** des services (une donnée), le
 * **brouillon** du demandeur, et les **pièces** qu'il a déjà déposées. Les
 * pièces servent à deux choses : marquer « déjà fournie » celles du KYC, et
 * reprendre celles qu'il a envoyées.
 */
export default async function OnboardingPage() {
  const configured = getPublicEnv() !== null;

  let signedIn = false;
  let citizenId: string | null = null;

  if (configured) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = user !== null;
    citizenId = user?.id ?? null;
  }

  const [services, draft, kycView] = configured && citizenId
    ? await Promise.all([
        listServices(),
        loadOnboardingDraft(),
        getKycProfileQuery(citizenId),
      ])
    : [[], EMPTY_DRAFT, null];

  // Les pièces du KYC : celles qui sont **déjà fournies** par le demandeur.
  const providedCodes = (kycView?.documents ?? [])
    .map((document) => document.docCode)
    .filter((code) => KYC_DOCUMENT_CODES.includes(code));

  // Les pièces **envoyées** : tout ce qu'il a déposé, KYC ou service.
  const sentCodes = (kycView?.documents ?? []).map((document) => document.docCode);

  return (
    <OnboardingWizard
      services={services}
      initialDraft={draft}
      signedIn={signedIn}
      providedCodes={providedCodes}
      sentCodes={sentCodes}
    />
  );
}
