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
import { isStaffRole } from "@/lib/auth-data";

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
  if (!supabase) return landingPathForRole("CITIZEN");

  const { data } = await supabase
    .from("staff_assignments")
    .select("role")
    .eq("actor_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const role = (data as { role?: string } | null)?.role;
  if (typeof role === "string" && isStaffRole(role)) {
    return landingPathForRole(role);
  }

  return landingPathForRole("CITIZEN");
}
