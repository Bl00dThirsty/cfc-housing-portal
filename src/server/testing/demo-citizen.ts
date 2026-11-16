import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Le compte d'un demandeur de démonstration.
 *
 * Ce module est **sûr dans le graphe client** : il ne touche pas à
 * `process.env.NEXT_PUBLIC_*`. Les modules d'actions importés par un
 * composant client sont concaténés pour le navigateur — une affectation à
 * `process.env.NEXT_PUBLIC_X` y devient une affectation à une constante, et
 * la construction échoue.
 *
 * L'environnement de la suite de bout en bout, lui, reste dans
 * `e2e-accounts.ts`, qui n'est jamais importé par l'interface.
 */

/** Le mot de passe des comptes de démonstration. */
export const DEMO_PASSWORD = process.env.CFC_DEV_PASSWORD ?? "CfcDev2026!";

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
 * Crée — ou réutilise — un compte d'emprunteur de démonstration.
 *
 * Le profil citoyen est créé dans la foulée : les écrans et les actions
 * lisent `citizen_profiles`, pas seulement `auth.users`.
 */
export async function ensureDemoCitizen(
  admin: SupabaseClient,
  email: string,
  fullName: string,
): Promise<string> {
  const existing = await findUserByEmail(admin, email);

  let userId = existing?.id ?? null;

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
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
