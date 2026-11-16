/**
 * Middleware CFC — rafraîchissement de session et contrôle d'accès.
 *
 * Responsabilités :
 * 1. Rafraîchir la session Supabase sur chaque requête (le JWT expire ; le
 *    cookie doit être renouvelé avant toute décision).
 * 2. Refuser l'accès à `/portail-cfc/**` sans session authentifiée, en renvoyant
 *    l'agent vers **sa** porte (`/portail-cfc/login`).
 * 3. **Contrôler l'habilitation sur la route** : un agent n'ouvre que les
 *    écrans de son rôle, un emprunteur jamais la console.
 * 4. Écarter de `/login` un utilisateur déjà authentifié, en le renvoyant
 *    vers sa page d'atterrissage **déduite de son rôle réel** (lu en base),
 *    jamais codée en dur.
 *
 * Les deux portes sont distinctes : `/login` est celle de l'emprunteur,
 * `/portail-cfc/login` celle de l'agent. Un emprunteur authentifié qui ouvre
 * la porte agent est renvoyé vers la sienne, et réciproquement.
 */

import { NextResponse, type NextRequest } from "next/server";

import { resolveRoleForUser } from "@/server/auth/landing";
import {
  ACCESS_DENIED_PATH,
  AGENT_PORTAL_ROOT,
  canAgentOpenRoute,
} from "@/config/rbac/route-access";
import { CITIZEN_LANDING, landingPathForRole } from "@/config/rbac/sidebar-by-role";
import { refreshSession } from "@/server/supabase/middleware";

/** Porte d'entrée de l'emprunteur. */
const CITIZEN_LOGIN_PATH = "/login";

/** Porte d'entrée de l'agent. */
const AGENT_LOGIN_PATH = "/portail-cfc/login";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const { supabase, response, user } = await refreshSession(request);

  const isAdminRoute = pathname.startsWith(AGENT_PORTAL_ROOT);
  const isCitizenLogin = pathname === CITIZEN_LOGIN_PATH;
  const isAgentLogin = pathname === AGENT_LOGIN_PATH;

  /**
   * La racine publique est la porte d'entrée du Guichet Unique : elle mène
   * à la connexion. La redirection est posée ici pour être une **vraie 307**
   * et non un rendu statique qui redirige côté client.
   */
  if (pathname === "/") {
    const role = user ? await resolveRoleForUser(supabase, user.id) : null;
    const target = role ? landingPathForRole(role) : CITIZEN_LOGIN_PATH;
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user) {
    // La porte agent mène à elle-même : la rediriger vers elle-même serait
    // une boucle infinie. Elle est donc exclue du renvoi.
    if (isAdminRoute && !isAgentLogin) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = AGENT_LOGIN_PATH;
      loginUrl.search = "";
      if (search) loginUrl.searchParams.set("next", `${pathname}${search}`);
      const redirect = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    return response;
  }

  // Le rôle réel, lu dans le registre de référence : jamais codé en dur.
  const role = await resolveRoleForUser(supabase, user.id);
  const landing = landingPathForRole(role ?? "CITIZEN");
  const isStaffLanding = landing.startsWith(AGENT_PORTAL_ROOT);

  /**
   * La console CFC est **fermée par défaut**.
   *
   * Un emprunteur qui l'ouvre va à son portail ; un agent dont le rôle ne
   * porte pas l'écran demandé reçoit un refus explicite, plutôt que la page
   * d'un autre pôle.
   */
  if (isAdminRoute && !isAgentLogin) {
    const allowed =
      role !== null && role !== "CITIZEN" && canAgentOpenRoute(role, pathname);

    if (!allowed) {
      const target =
        role === null || role === "CITIZEN"
          ? CITIZEN_LANDING
          : `${ACCESS_DENIED_PATH}?route=${encodeURIComponent(pathname)}`;

      const redirect = NextResponse.redirect(new URL(target, request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  if (isCitizenLogin) {
    // Un agent n'a rien à faire du portail citoyen : il va à sa console.
    const redirect = NextResponse.redirect(new URL(landing, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (isAgentLogin) {
    // Un emprunteur n'a rien à faire de la console : il garde sa porte.
    const target = isStaffLanding ? landing : CITIZEN_LOGIN_PATH;
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // La racine de la console n'est pas une page : c'est une **entrée de rôle**.
  // La redirection est posée ici pour être une vraie 307 ; un `redirect()` dans
  // la page ne le serait pas — le gabarit de la console serait déjà envoyé,
  // et le navigateur recevrait un 200 suivi d'un rafraîchissement de page.
  if (pathname === AGENT_PORTAL_ROOT) {
    const redirect = NextResponse.redirect(new URL(landing, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tout le site, sauf les fichiers statiques et les images — on exclut
     * `api`, `trpc`, `_next` et les fichiers pour ne pas payer le
     * rafraîchissement de session sur les assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
