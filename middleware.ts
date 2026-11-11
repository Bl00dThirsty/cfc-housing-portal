/**
 * Middleware CFC — rafraîchissement de session et contrôle d'accès.
 *
 * Responsabilités :
 * 1. Rafraîchir la session Supabase sur chaque requête (le JWT expire ; le
 *    cookie doit être renouvelé avant toute décision).
 * 2. Refuser l'accès à `/admin/**` sans session authentifiée.
 * 3. Écarter de `/login` un utilisateur déjà authentifié, en le renvoyant
 *    vers sa page d'atterrissage **déduite de son rôle réel** (lu en base),
 *    jamais codée en dur.
 */

import { NextResponse, type NextRequest } from "next/server";

import { resolveLandingPathForUser } from "@/server/auth/landing";
import { refreshSession } from "@/server/supabase/middleware";

/** Pages de connexion. */
const LOGIN_PATHS = ["/login", "/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const { supabase, response, user } = await refreshSession(request);

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = LOGIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  /**
   * La racine publique est la porte d'entrée du Guichet Unique : elle s'ouvre
   * sur la connexion. La redirection est posée ici, et non dans une page, pour
   * qu'elle soit une **vraie 307** et non un rendu statique qui redirige côté
   * client.
   */
  if (pathname === "/") {
    const target = user ? await resolveLandingPathForUser(supabase, user.id) : "/login";
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user) {
    if (isAdminRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      if (search) loginUrl.searchParams.set("next", `${pathname}${search}`);
      const redirect = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    return response;
  }

  if (isLoginRoute) {
    const landing = await resolveLandingPathForUser(supabase, user.id);
    const redirect = NextResponse.redirect(new URL(landing, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  /**
   * `/admin` n'est pas une page : c'est une **entrée de rôle**. Elle mène à
   * l'écran du pôle de l'agent, déduit de son habilitation réelle — jamais au
   * tableau de bord d'un autre rôle.
   */
  if (pathname === "/admin") {
    const landing = await resolveLandingPathForUser(supabase, user.id);
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
