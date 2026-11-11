import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Porte d'entrée du Guichet Unique.
 *
 * La redirection est posée dans le middleware pour être une **vraie 307**.
 * Cette page n'est qu'un filet de sécurité : elle ne doit jamais être atteinte,
 * et elle ne le sera pas — mais si elle l'est, elle doit mener à la connexion.
 *
 * L'emprunteur comme l'agent passent par la même porte, et `/login` redirige
 * ensuite chacun vers son écran (portail citoyen ou console de son pôle). La
 * vitrine publique reste accessible sur `/accueil`.
 */
export default function HomePage() {
  redirect("/login");
}
