import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { AuthProvider } from "@/lib/auth-context";
import { getServerProfile } from "@/server/auth/profile";
import { loadOnboardingDraft } from "@/server/actions/onboarding";
import { getPublicEnv } from "@/server/env";
import { getKycProfileQuery } from "@/server/queries/kyc-profile";
import { listServices } from "@/server/queries/services";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { EMPTY_DRAFT } from "@/domain/entities/onboarding";
import { KYC_DOCUMENT_CODES } from "@/domain/entities/kyc-profile";
import { emptyKycOptionGroups } from "@/domain/entities/kyc-options";
import { listKycOptions } from "@/server/queries/kyc-options";

/**
 * L'assistant de dossier — la route qui rend le parcours.
 *
 * Elle charge trois choses : le **catalogue** des services (une donnée), le
 * **brouillon** du demandeur, et les **pièces** qu'il a déjà déposées. Les
 * pièces servent à deux choses : marquer « déjà fournie » celles du KYC, et
 * reprendre celles qu'il a envoyées.
 *
 * Le demandeur connecté doit pouvoir **partir** : le menu d'identité — et la
 * déconnexion qu'il porte — est donc rendu ici, avec le profil résolu côté
 * serveur.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>;
}) {
  const { dossier: dossierId } = await searchParams;
  const configured = getPublicEnv() !== null;

  let signedIn = false;
  let citizenId: string | null = null;
  let profile = null;

  if (configured) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = user !== null;
    citizenId = user?.id ?? null;

    if (signedIn) {
      profile = await getServerProfile().catch(() => null);
    }
  }

  if (profile && profile.role !== "CITIZEN") redirect("/portail-cfc");
  if (signedIn && !dossierId) redirect("/portail-client/demandes");
  if (signedIn && dossierId && !/^[0-9a-f-]{36}$/i.test(dossierId)) {
    redirect("/portail-client/demandes");
  }

  const [services, draft, kycView, kycOptionsResult] = configured
    ? await Promise.all([
        listServices(),
        signedIn && dossierId ? loadOnboardingDraft(dossierId) : Promise.resolve(EMPTY_DRAFT),
        citizenId && dossierId ? getKycProfileQuery(citizenId, dossierId) : Promise.resolve(null),
        listKycOptions(),
      ])
    : [
        [],
        EMPTY_DRAFT,
        null,
        { ok: false as const, error: "Le catalogue KYC nécessite une connexion Supabase configurée." },
      ];

  if (signedIn && !draft.dossierId) redirect("/portail-client/demandes");

  // Les pièces du KYC : celles qui sont **déjà fournies** par le demandeur.
  const providedCodes = (kycView?.documents ?? [])
    .map((document) => document.docCode)
    .filter((code) => KYC_DOCUMENT_CODES.includes(code));

  // Les pièces **envoyées** : tout ce qu'il a déposé, KYC ou service.
  const sentCodes = (kycView?.documents ?? []).map((document) => document.docCode);

  return (
    <AuthProvider initialProfile={profile}>
      <OnboardingWizard
        services={services}
        initialDraft={draft}
        signedIn={signedIn}
        kycSubmitted={kycView?.kycSubmitted ?? false}
        providedCodes={providedCodes}
        sentCodes={sentCodes}
        kycOptions={kycOptionsResult.ok ? kycOptionsResult.options : emptyKycOptionGroups()}
        kycOptionsError={kycOptionsResult.ok ? null : kycOptionsResult.error}
      />
    </AuthProvider>
  );
}
