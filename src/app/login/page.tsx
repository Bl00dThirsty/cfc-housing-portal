import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthProvider } from "@/lib/auth-context";
import { getServerProfile, resolveLandingPathForUser } from "@/server/auth/profile";
import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Porte d'entrée **emprunteur** — Guichet Unique citoyen.
 *
 * La connexion de l'agent est ailleurs (`/admin/login`) : les deux portes
 * sont distinctes, tant par leur audience que par les parcours qu'elles
 * autorisent.
 *
 * Un agent déjà authentifié qui arrive ici est renvoyé vers sa console : il
 * n'a rien à faire du portail citoyen.
 */
export default async function CitizenLoginPage() {
  let userId: string | null = null;
  let landing: string | null = null;

  if (getPublicEnv()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      if (userId) landing = await resolveLandingPathForUser(supabase, userId);
    } catch {
      userId = null;
      landing = null;
    }
  }

  if (userId && landing) {
    redirect(landing);
  }

  const profile = userId ? await getServerProfile().catch(() => null) : null;

  return (
    <AuthProvider initialProfile={profile}>
      <Suspense fallback={null}>
        <SignInForm audience="citizen" />
      </Suspense>
    </AuthProvider>
  );
}
