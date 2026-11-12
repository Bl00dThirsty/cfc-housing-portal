import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { landingPathForRole } from "@/config/rbac/sidebar-by-role";
import { AuthProvider } from "@/lib/auth-context";
import { getServerProfile } from "@/server/auth/profile";
import { getPublicEnv } from "@/server/env";

export const dynamic = "force-dynamic";

/**
 * Porte d'entrée **agent** — console d'administration.
 *
 * Distincte de `/login` (qui est celle de l'emprunteur) :
 *
 * - pas d'inscription ni de lien magique — un compte agent est **provisionné**
 *   par la Direction Générale, il ne se crée pas en libre-service ;
 * - l'atterrissage est l'écran du pôle, déduit de l'habilitation réelle.
 *
 * Un emprunteur authentifié qui arrive ici est renvoyé vers sa porte.
 */
export default async function AgentLoginPage() {
  const profile = getPublicEnv() ? await getServerProfile().catch(() => null) : null;

  if (profile) {
    if (profile.role === "CITIZEN") {
      redirect("/login");
    }
    redirect(landingPathForRole(profile.role));
  }

  return (
    <AuthProvider initialProfile={null}>
      <Suspense fallback={null}>
        <SignInForm audience="staff" />
      </Suspense>
    </AuthProvider>
  );
}
