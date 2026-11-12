import { redirect } from "next/navigation";

import { AuthProvider } from "@/lib/auth-context";
import { ClientHeader } from "@/components/portail-client/client-header";
import { getServerProfile } from "@/server/auth/profile";
import { getPublicEnv } from "@/server/env";

export const dynamic = "force-dynamic";

/**
 * Espace citoyen — coquille authentifiée.
 *
 * Le contrôle est fait **côté serveur** : un agent n'a rien à faire de cet
 * espace, il est renvoyé vers sa console. L'interface n'est qu'un reflet de
 * ce contrôle, jamais sa condition.
 */
export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const profile = getPublicEnv() ? await getServerProfile().catch(() => null) : null;

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "CITIZEN") {
    redirect("/portail-cfc");
  }

  return (
    <AuthProvider initialProfile={profile}>
      <div className="flex min-h-full flex-col">
        <ClientHeader />
        <main className="flex-1">{children}</main>
      </div>
    </AuthProvider>
  );
}
