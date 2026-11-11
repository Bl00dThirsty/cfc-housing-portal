import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { loadOnboardingDraft } from "@/server/actions/onboarding";
import { getPublicEnv } from "@/server/env";
import { listServices } from "@/server/queries/services";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { EMPTY_DRAFT } from "@/domain/entities/onboarding";

export default async function OnboardingPage() {
  const configured = getPublicEnv() !== null;

  const [services, draft] = configured
    ? await Promise.all([listServices(), loadOnboardingDraft()])
    : [[], EMPTY_DRAFT];

  let signedIn = false;
  if (configured) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = user !== null;
  }

  return (
    <OnboardingWizard
      services={services}
      initialDraft={draft}
      signedIn={signedIn}
    />
  );
}
