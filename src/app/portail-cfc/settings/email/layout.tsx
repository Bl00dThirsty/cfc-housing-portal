import { redirect } from "next/navigation";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";

export const dynamic = "force-dynamic";

/**
 * Paramétrage de la messagerie — porte d'entrée serveur.
 *
 * Le contrôle est fait **côté serveur** : l'habilitation `catalogue:write`
 * est exigée pour atteindre l'éditeur de modèles et le journal des
 * livraisons. Masquer le lien de navigation ne serait pas un contrôle.
 */
export default async function EmailSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getServerProfile().catch(() => null);

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "CITIZEN" || !hasCapability(profile.role, "catalogue:write")) {
    redirect("/portail-cfc/analytics");
  }

  return <>{children}</>;
}
