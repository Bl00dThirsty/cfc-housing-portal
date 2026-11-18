import { redirect } from "next/navigation";

import { AuthProvider } from "@/lib/auth-context";
import { getServerProfile } from "@/server/auth/profile";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

/**
 * Console d'administration CFC — porte d'entrée serveur.
 *
 * Le contrôle est fait **côté serveur** : sans session valide, la requête
 * est renvoyée vers `/login`. L'interface n'est qu'un reflet de ce contrôle,
 * jamais sa condition.
 *
 * Le sélecteur de profil métier a été retiré : un agent ne peut plus
 * s'attribuer un autre rôle en un clic. Le rôle vient de
 * `public.staff_assignments`.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getServerProfile().catch(() => null);

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "CITIZEN") {
    redirect("/portail-client");
  }

  return (
    <AuthProvider initialProfile={profile}>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
