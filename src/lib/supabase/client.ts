/**
 * Client Supabase pour le navigateur.
 *
 * Singleton paresseux : le client n'est instancié qu'au premier usage réel
 * (effet ou gestionnaire d'événement), jamais au chargement du module — un
 * `next build` sans configuration Supabase doit réussir.
 *
 * Il vit dans la couche cliente et non dans `src/server/**` : c'est du code
 * exécuté dans le navigateur, et l'interface ESLint interdit aux composants
 * d'atteindre la couche serveur.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requirePublicEnv } from "@/server/env";

let browserClient: SupabaseClient | undefined;

/** Client Supabase partagé par le code exécuté dans le navigateur. */
export function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const env = requirePublicEnv();
  browserClient = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return browserClient;
}

/**
 * Accès au référentiel déclarable (schéma `ref`).
 *
 * PostgREST choisit le schéma par l'en-tête `Accept-Profile` (RFC 6906) :
 * écrire `ref.document_type` comme nom de table ne fonctionne pas.
 * `supabase.schema("ref")` pose l'en-tête automatiquement.
 */
export function getBrowserReferenceClient() {
  return getBrowserClient().schema("ref");
}

/** Réinitialise le singleton (tests, changement d'environnement). */
export function resetBrowserClient(): void {
  browserClient = undefined;
}
