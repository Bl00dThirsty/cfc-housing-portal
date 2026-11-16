/**
 * Client Supabase « service role ».
 *
 * **Strictement serveur.** Cette clé contourne toutes les politiques RLS :
 * l'import de ce module depuis un composant client est une erreur de
 * compilation, pas une simple erreur d'exécution (`import "server-only"`).
 *
 * Usage réservé aux traitements de fond (réconciliation SYSTAC, imports
 * cartographiques) et aux Server Actions qui écrivent via des fonctions
 * `security definer` en base.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requirePublicEnv, requireServiceRoleKey } from "@/server/env";

let adminClient: SupabaseClient | undefined;

/** Client `service_role`, instancié à la demande. */
export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const env = requirePublicEnv();
  const serviceRoleKey = requireServiceRoleKey();

  adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}
