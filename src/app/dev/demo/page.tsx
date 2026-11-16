import { DemoPanel } from "./demo-panel";
import { getAdminClient } from "@/server/supabase/admin";
import { getServerProfile } from "@/server/auth/profile";
import { getPublicEnv } from "@/server/env";

export const dynamic = "force-dynamic";

/**
 * Le panneau de démonstration.
 *
 * La page ne porte **aucun** garde `NODE_ENV` dispersé : l'accès est réglé
 * par la table d'accès unique (`src/config/rbac/route-access.ts`), et le
 * middleware ferme la porte en production. Cette page ne fait que **lire** —
 * les décisions passent par les actions de démonstration.
 */
export default async function DemoPage() {
  if (!getPublicEnv()) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-16 text-sm text-destructive">
        Le panneau de démonstration a besoin de la configuration Supabase.
      </p>
    );
  }

  const profile = await getServerProfile().catch(() => null);
  const admin = getAdminClient();

  let citizen: { id: string; email: string; fullName: string } | null = null;
  let dossier: {
    ducCode: string;
    kycState: string;
    onboardingState: string;
    ducStatus: string;
    advisor: string | null;
  } | null = null;

  if (profile) {
    const { data: citizenRow } = await admin
      .from("citizen_profiles")
      .select("id, email, full_name")
      .eq("id", profile.actorId)
      .maybeSingle();

    const { data: dossierRow } = await admin
      .from("dossiers")
      .select("duc_code, onboarding_state, duc_status, advisor")
      .eq("citizen_id", profile.actorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: stateRow } = await admin
      .from("citizen_profiles")
      .select("kyc_state")
      .eq("id", profile.actorId)
      .maybeSingle();

    citizen = citizenRow
      ? {
          id: citizenRow.id,
          email: citizenRow.email ?? "",
          fullName: citizenRow.full_name ?? "Emprunteur",
        }
      : null;

    dossier = dossierRow
      ? {
          ducCode: dossierRow.duc_code,
          kycState: stateRow?.kyc_state ?? "pre_boarding",
          onboardingState: dossierRow.onboarding_state ?? "kyc",
          ducStatus: dossierRow.duc_status ?? "non_active",
          advisor: dossierRow.advisor ?? null,
        }
      : null;
  }

  return <DemoPanel citizen={citizen} dossier={dossier} />;
}
