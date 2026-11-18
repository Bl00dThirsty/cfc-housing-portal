/**
 * Page d'atterrissage d'un utilisateur authentifié.
 *
 * Point unique de décision, partagé par le middleware (runtime Edge) et les
 * Server Components (runtime Node) : la route d'atterrissage est **déduite
 * du rôle réel**, lu dans `public.staff_assignments` (registre de référence),
 * jamais codée en dur.
 *
 * Ce module ne dépend ni de `next/headers` ni de `server-only` afin de
 * rester importable depuis le middleware.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { landingPathForRole } from "@/config/rbac/sidebar-by-role";
import { isStaffRole, type AppRole } from "@/lib/auth-data";

/**
 * Rôle réel d'un utilisateur authentifié.
 *
 * Lu dans `public.staff_assignments` (registre de référence), jamais codé en
 * dur. Un utilisateur sans affectation lisible n'a **aucun** rôle : lui
 * attribuer le rôle le plus large serait une escalade de privilège par
 * défaut.
 */
export async function resolveRoleForUser(
  supabase: SupabaseClient | null,
  userId: string,
): Promise<AppRole | null> {
  if (!supabase) return null;

  const now = new Date().toISOString();

  const { data } = await supabase
    .from("staff_assignments")
    .select("role")
    .eq("actor_id", userId)
    .is("deleted_at", null)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("starts_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const role = (data as { role?: string } | null)?.role;
  if (typeof role === "string" && isStaffRole(role)) return role;

  // Un citoyen est un acteur sans affectation : c'est le rôle par défaut
  // d'un compte non staff.
  const { data: actor } = await supabase
    .from("actors")
    .select("actor_type")
    .eq("id", userId)
    .maybeSingle();

  return (actor as { actor_type?: string } | null)?.actor_type === "citizen"
    ? "CITIZEN"
    : null;
}

/**
 * Page d'atterrissage d'un utilisateur authentifié.
 *
 * Un agent est renvoyé vers l'écran de son pôle, un citoyen vers son
 * portail. En l'absence d'affectation lisible, l'utilisateur est renvoyé
 * vers le portail citoyen : l'accès à une console d'administration n'est
 * jamais ouvert par défaut.
 */
export async function resolveLandingPathForUser(
  supabase: SupabaseClient | null,
  userId: string,
): Promise<string> {
  const role = await resolveRoleForUser(supabase, userId);
  return landingPathForRole(role ?? "CITIZEN");
}
