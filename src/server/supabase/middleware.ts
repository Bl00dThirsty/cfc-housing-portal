/**
 * Client Supabase du middleware.
 *
 * Le middleware doit rafraîchir la session **avant** toute décision
 * d'accès : c'est lui qui réécrit les cookies de session sur la réponse.
 */

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/server/env";

export interface MiddlewareSession {
  /** Client Supabase branché sur les cookies de la requête, `null` si non configuré. */
  supabase: SupabaseClient | null;
  /** Réponse à renvoyer (cookies de session rafraîchis inclus). */
  response: NextResponse;
  /** Utilisateur authentifié, ou `null`. */
  user: { id: string; email?: string } | null;
}

/**
 * Rafraîchit la session et expose le client + la réponse.
 *
 * Si la configuration Supabase est absente, la requête est laissée passer
 * telle quelle : le build et le rendu statique ne doivent pas dépendre de la
 * base.
 */
export async function refreshSession(request: NextRequest): Promise<MiddlewareSession> {
  let response = NextResponse.next({ request });

  const env = getPublicEnv();
  if (!env) {
    return { supabase: null, response, user: null };
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // `getUser()` revalide le JWT côté serveur : `getSession()` se contente de
  // lire le cookie et ne prouve rien.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, response, user: user ? { id: user.id, email: user.email } : null };
}
