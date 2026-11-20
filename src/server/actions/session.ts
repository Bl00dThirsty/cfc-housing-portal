"use server";

/**
 * La déconnexion.
 *
 * Elle est **côté serveur** : c'est le serveur qui tient les cookies de
 * session, et c'est lui qui doit les rendre. Une déconnexion faite dans le
 * navigateur laisse parfois un cookie derrière — et l'agent reste
 * « connecté » à un écran qu'il n'a plus le droit de voir.
 */

import { createServerSupabaseClient } from "@/server/supabase/server";

export type SignOutResult = { ok: true } | { ok: false; error: string };

export async function signOutAction(): Promise<SignOutResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (caught) {
    return {
      ok: false,
      error: caught instanceof Error ? caught.message : "Déconnexion impossible.",
    };
  }
}
