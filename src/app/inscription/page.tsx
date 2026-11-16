import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup/signup-form";
import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";

/**
 * La porte d'inscription.
 *
 * Un demandeur déjà connecté n'a rien à faire ici : son parcours continue au
 * KYC. La porte de connexion reste accessible par le lien du formulaire.
 */
export default async function InscriptionPage() {
  const configured = getPublicEnv() !== null;

  if (configured) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) redirect("/onboarding");
  }

  return <SignupForm />;
}
