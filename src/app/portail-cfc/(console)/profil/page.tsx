import { ProfilePanel } from "@/components/profile/profile-panel";
import { ProfileEditor } from "@/components/profile/profile-editor";
import type { Role } from "@/domain/policies/capabilities";
import { ROLE_SCOPES } from "@/domain/policies/scope";
import { getServerProfile } from "@/server/auth/profile";
import { getAdminClient } from "@/server/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Profil de l'agent.
 *
 * La page rend l'identité, l'habilitation — rôle, pôle, rattachement,
 * périmètre — et la déconnexion. C'est le **reflet** de ce que le middleware
 * a contrôlé : l'agent voit exactement le périmètre qu'il peut exercer.
 */
export default async function AgentProfilePage() {
  const profile = await getServerProfile().catch(() => null);

  const admin = getAdminClient();
  const { data: staff } = profile
    ? await admin
        .from("staff_profiles")
        .select("pole, job_title, agency_id")
        .eq("id", profile.actorId)
        .maybeSingle()
    : { data: null };

  const { data: agency } =
    profile?.agencyId && staff
      ? await admin
          .from("agencies")
          .select("label")
          .eq("id", (staff as { agency_id: string | null }).agency_id ?? "")
          .maybeSingle()
      : { data: null };

  const scope = profile ? ROLE_SCOPES[profile.role as Role] : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
        Mon profil
      </h1>

      <ProfilePanel
        identity={{
          fullName: profile?.fullName ?? "Agent CFC",
          email: profile?.email ?? "",
          phone: profile?.phone ?? null,
          roleLabel: profile?.roleLabel ?? "Agent CFC",
          role: profile?.role ?? "",
        }}
        habilitation={{
          pole: (staff as { pole: string | null } | null)?.pole ?? profile?.pole ?? null,
          agency:
            (agency as { label: string } | null)?.label ?? profile?.agencyLabel ?? null,
          scope: scope ?? null,
          jobTitle: (staff as { job_title: string | null } | null)?.job_title ?? null,
        }}
      />

      {profile ? (
        <div className="mt-4">
          <ProfileEditor
            fullName={profile.fullName}
            email={profile.email}
            pendingEmail={profile.pendingEmail}
            phone={profile.phone}
            avatarUrl={profile.avatarUrl}
            canEditLegalName
            isCitizen={false}
            correctionRequests={[]}
            correctionDossiers={[]}
          />
        </div>
      ) : null}
    </div>
  );
}
