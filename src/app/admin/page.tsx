import { redirect } from "next/navigation";

import { landingPathForRole } from "@/config/rbac/sidebar-by-role";
import { getServerProfile } from "@/server/auth/profile";

export const dynamic = "force-dynamic";

/**
 * Entrée de la console d'administration.
 *
 * `/admin` n'est pas une page : c'est une **entrée de rôle**. Elle mène à
 * l'écran du pôle de l'agent, déduit de son habilitation réelle. La
 * redirection est posée dans le middleware pour être une vraie 307 ; cette
 * page n'est qu'un filet de sécurité.
 */
export default async function AdminPage() {
  const profile = await getServerProfile();
  redirect(profile ? landingPathForRole(profile.role) : "/login");
}
