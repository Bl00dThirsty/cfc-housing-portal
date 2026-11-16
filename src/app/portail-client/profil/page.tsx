import { ProfilePanel } from "@/components/profile/profile-panel";
import { getServerProfile } from "@/server/auth/profile";
import { getAdminClient } from "@/server/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Profil de l'emprunteur.
 *
 * La page rend l'identité, la situation du dossier unique client et la
 * déconnexion. Elle est servie par le rôle de service : un emprunteur ne lit
 * que sa propre fiche.
 */
export default async function CitizenProfilePage() {
  const profile = await getServerProfile().catch(() => null);

  const admin = getAdminClient();
  const { data: citizen } = profile
    ? await admin
        .from("citizen_profiles")
        .select("affiliation_status, kyc_state, is_diaspora")
        .eq("id", profile.actorId)
        .maybeSingle()
    : { data: null };

  const { data: dossier } = profile
    ? await admin
        .from("dossiers")
        .select("duc_code")
        .eq("citizen_id", profile.actorId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
        Mon profil
      </h1>

      <ProfilePanel
        identity={{
          fullName: profile?.fullName ?? "Emprunteur",
          email: profile?.email ?? "",
          phone: profile?.phone ?? null,
          roleLabel: profile?.roleLabel ?? "Emprunteur",
          role: profile?.role ?? "CITIZEN",
        }}
        dossier={{
          ducCode: (dossier as { duc_code: string } | null)?.duc_code ?? null,
          affiliation:
            (citizen as { affiliation_status: string } | null)?.affiliation_status ?? null,
          kycState: (citizen as { kyc_state: string } | null)?.kyc_state ?? null,
          isDiaspora: (citizen as { is_diaspora: boolean } | null)?.is_diaspora ?? false,
        }}
      />
    </div>
  );
}
