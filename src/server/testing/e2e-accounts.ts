import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadLocalEnvironment } from "../../../scripts/lib/local-env-loading.mjs";

loadLocalEnvironment(process.cwd());

/**
 * Comptes éphémères pour les tests de bout en bout.
 *
 * **Chaque suite a son propre emprunteur.** Les tests partagent la même base,
 * et certaines actions résolvent « le dossier de l'emprunteur » : avec un
 * compte commun, une suite peut journaliser sur le dossier d'une autre. C'est
 * un défaut d'isolation, pas une donnée de test.
 *
 * Les comptes sont **réutilisables** d'une exécution à l'autre : ils sont
 * créés s'ils manquent, réutilisés sinon. Ils restent reserved aux tests et
 * ne touchent pas les comptes de démonstration.
 */

export function getE2eConfiguration(): {
  supabaseUrl: string;
  anonKey: string;
  password: string;
} {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "";
  const password = process.env.CFC_DEV_PASSWORD ?? "";
  const missing = [
    !supabaseUrl ? "SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    !password ? "CFC_DEV_PASSWORD" : null,
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Configure ${missing.join(", ")} before running local E2E tests.`);
  }
  return { supabaseUrl, anonKey, password };
}
function requireServiceKey(): string {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for E2E service access.",
    );
  }
  return key;
}

/** Client de service : contourne la RLS, réservé à la préparation des tests. */
export function serviceClient(): SupabaseClient {
  const { supabaseUrl } = getE2eConfiguration();
  return createClient(supabaseUrl, requireServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Renseigne l'environnement pour les modules serveur importés par la suite. */
export function applyServerEnv(): void {
  const { supabaseUrl, anonKey } = getE2eConfiguration();
  // `Object.assign` et non une affectation pointée : le compilateur remplace
  // `process.env.NEXT_PUBLIC_*` par une constante, et l'affectation directe
  // deviendrait une affectation à une rvalue.
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: requireServiceKey(),
  });
}

/** Trouve un compte par son adresse. */
export async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string } | null> {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const found = data.users.find((user) => user.email === email);
    if (found) return { id: found.id };

    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Crée — ou réutilise — un compte d'emprunteur de test.
 *
 * Le profil citoyen est créé dans la foulée : les écrans et les actions
 * lisent `citizen_profiles`, pas seulement `auth.users`.
 */
export async function ensureE2eCitizen(
  admin: SupabaseClient,
  email: string,
  fullName: string,
): Promise<string> {
  const { password } = getE2eConfiguration();
  const existing = await findUserByEmail(admin, email);

  let userId = existing?.id ?? null;

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  await admin.from("actors").upsert(
    { id: userId, actor_type: "citizen" },
    { onConflict: "id" },
  );

  await admin.from("citizen_profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      affiliation_status: "first_time",
      email,
      is_diaspora: false,
      kyc_state: "identity_capture",
    },
    { onConflict: "id" },
  );

  return userId;
}

/**
 * Ouvre une session réelle et rend le cookie de session.
 *
 * Le cookie est la preuve que la requête est authentifiée : il est rejoué
 * tel quel sur l'application.
 */
export async function signInWithCookie(email: string): Promise<{
  userId: string;
  cookie: string;
  /** Les cookies bruts : une suite les rejoue dans son propre bocal. */
  cookies: { name: string; value: string }[];
  accessToken: string;
}> {
  const { supabaseUrl, anonKey, password } = getE2eConfiguration();
  let captured: { name: string; value: string }[] = [];

  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: (list) => {
        captured = list;
      },
    },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  return {
    userId: data.user.id,
    cookie: captured.map((cookie) => `${cookie.name}=${cookie.value}`).join("; "),
    cookies: captured,
    accessToken: data.session.access_token,
  };
}
