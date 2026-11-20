/**
 * Client Supabase pour les Server Components et les Server Actions.
 *
 * Lit les cookies de la requête courante et propage le rafraîchissement de
 * session à la réponse (via `cookies().set`, qui échoue hors action serveur —
 * d'où le `try/catch`).
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requirePublicEnv } from "@/server/env";

export async function createServerSupabaseClient() {
  const env = requirePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Écriture impossible depuis un Server Component : le rafraîchissement
          // est repris par le middleware sur la requête suivante.
        }
      },
    },
  });
}
