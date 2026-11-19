/**
 * Résolution serveur du profil connecté et de la page d'atterrissage.
 *
 * Point unique de décision pour « où un utilisateur authentifié doit
 * atterrir ». La réponse est **déduite du rôle réel**, lu dans
 * `public.staff_assignments` (registre de référence), jamais codée en dur.
 */

import "server-only";

import { isCapability, type Capability } from "@/domain/policies/capabilities";
import { type AuthProfile, ROLE_LABELS, isStaffRole } from "@/lib/auth-data";
import { createServerSupabaseClient } from "@/server/supabase/server";

export { resolveLandingPathForUser } from "@/server/auth/landing";

interface AssignmentRow {
  role: string;
  agency_id: string | null;
}

interface StaffProfileRow {
  full_name: string | null;
  pole: string | null;
  agency_id: string | null;
  phone: string | null;
}

interface CitizenProfileRow {
  full_name: string | null;
  phone: string | null;
}

interface AgencyRow {
  id: string;
  label: string;
}

interface ActorRow {
  id: string;
  actor_type: "citizen" | "staff" | "service";
}

async function getOwnAvatarUrl(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorId: string,
): Promise<string | null> {
  const { data: media } = await supabase
    .from("actor_profile_media")
    .select("avatar_path")
    .eq("actor_id", actorId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!media?.avatar_path) return null;

  const { data } = await supabase.storage
    .from("profile-avatars")
    .createSignedUrl(media.avatar_path, 300);
  return data?.signedUrl ?? null;
}

async function getAssignedCapabilities(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  role: string,
): Promise<Capability[]> {
  const { data, error } = await supabase
    .from("cfc_role_capabilities")
    .select("capability")
    .eq("role_code", role);
  if (error) return [];
  return [...new Set((data ?? []).map((row) => row.capability).filter(isCapability))];
}

/**
 * Page d'atterrissage d'un utilisateur authentifié.
 *
 * Réexportée depuis `src/server/auth/landing.ts`, module partagé avec le
 * middleware.
 */

/**
 * Profil complet de l'utilisateur de la requête courante.
 *
 * `null` si aucune session n'est établie.
 */
export async function getServerProfile(): Promise<AuthProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: actorData } = await supabase
    .from("actors")
    .select("id, actor_type")
    .eq("id", user.id)
    .maybeSingle();

  const actor = (actorData ?? null) as ActorRow | null;
  const actorType = actor?.actor_type ?? "citizen";
  const email = user.email ?? "";
  const pendingEmail = user.new_email ?? null;
  const now = new Date().toISOString();
  const avatarUrl = await getOwnAvatarUrl(supabase, user.id);

  if (actorType !== "staff") {
    const { data: citizenData } = await supabase
      .from("citizen_profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const citizen = (citizenData ?? null) as CitizenProfileRow | null;

    return {
      actorId: user.id,
      actorType,
      role: "CITIZEN",
      roleLabel: "Emprunteur",
      pole: null,
      agencyId: null,
      agencyLabel: null,
      fullName: citizen?.full_name ?? (user.user_metadata?.full_name as string) ?? email,
      email,
      phone: citizen?.phone ?? null,
      avatarUrl,
      pendingEmail,
    };
  }

  const [{ data: assignmentData }, { data: staffData }] = await Promise.all([
    supabase
      .from("staff_assignments")
      .select("role, agency_id")
      .eq("actor_id", user.id)
      .is("deleted_at", null)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("starts_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("staff_profiles")
      .select("full_name, pole, agency_id, phone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const assignment = (assignmentData ?? null) as AssignmentRow | null;
  const staff = (staffData ?? null) as StaffProfileRow | null;

  /**
   * Fail-closed.
   *
   * Un agent dont l'affectation n'est pas lisible n'a **aucun** rôle. Lui
   * attribuer `ADMIN` — le rôle le plus large — serait une escalade de
   * privilège par défaut : c'est exactement ce que produit une affectation
   * manquante. On refuse donc le profil plutôt que de deviner.
   */
  if (!assignment || !isStaffRole(assignment.role)) {
    return null;
  }

  const role = assignment.role;
  const agencyId = assignment.agency_id ?? staff?.agency_id ?? null;

  let agencyLabel: string | null = null;
  const [agencyResult, capabilities] = await Promise.all([
    agencyId
      ? supabase.from("agencies").select("id, label").eq("id", agencyId).maybeSingle()
      : Promise.resolve({ data: null }),
    getAssignedCapabilities(supabase, role),
  ]);
  agencyLabel = ((agencyResult.data ?? null) as AgencyRow | null)?.label ?? null;

  return {
    actorId: user.id,
    actorType,
    role,
    capabilities,
    roleLabel: ROLE_LABELS[role],
    pole: staff?.pole ?? null,
    agencyId,
    agencyLabel,
    fullName: staff?.full_name ?? email,
    email,
    phone: staff?.phone ?? null,
    avatarUrl,
    pendingEmail,
  };
}
