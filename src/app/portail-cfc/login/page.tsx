import { redirect } from "next/navigation";

/**
 * Ancienne page de connexion de la console.
 *
 * Il n'existe plus qu'une seule porte d'entrée : `/login`. Cette route est
 * conservée comme redirection, afin que les liens historiques vers
 * `/admin/login` restent valides sans maintenir une seconde surface
 * d'authentification.
 */
export default function AdminLoginRedirect() {
  redirect("/login");
}
