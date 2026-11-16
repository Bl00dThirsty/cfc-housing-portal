import { AuthProvider } from "@/lib/auth-context";
import { UpdatePasswordForm } from "./update-password-form";

export const dynamic = "force-dynamic";

/**
 * Réinitialisation du mot de passe.
 *
 * La page est atteinte depuis le lien de récupération envoyé par Supabase.
 * Le jeton de récupération est traité par le client Supabase ; le formulaire
 * applique ensuite le nouveau mot de passe via `updateUser`.
 */
export default function ResetPasswordPage() {
  return (
    <AuthProvider>
      <UpdatePasswordForm />
    </AuthProvider>
  );
}
