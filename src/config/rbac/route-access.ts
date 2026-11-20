/**
 * Contrôle d'accès aux routes de la console CFC.
 *
 * La navigation d'un agent est filtrée par ses grants effectifs
 * (`sidebar-by-role.ts`), mais une entrée masquée **n'est pas une protection** :
 * la route elle-même doit refuser le passage. Cette politique déduit les
 * routes permises de la navigation filtrée, à partir des grants Supabase.
 *
 * Le contrôle est fait dans le middleware, avant tout rendu : aucune page ne
 * peut être oubliée.
 *
 * La réponse est **fermée par défaut**. Une route de la console qui
 * n'apparaît dans la navigation d'aucun rôle est refusée : une page
 * d'agent orpheline ne doit jamais rester accessible.
 */

import { STAFF_ROLES, type Capability, type StaffRole } from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";
import {
  getDeclaredNavRoutePaths,
  getSidebarSectionsForRole,
  landingPathForRole,
} from "@/config/rbac/sidebar-by-role";

/** Racine de la console CFC. */
export const AGENT_PORTAL_ROOT = "/portail-cfc";

/**
 * Routes accessibles à tout agent authentifié, quel que soit son rôle.
 *
 * La porte d'entrée, l'écran de refus et la page de profil ne dépendent
 * d'aucun pôle : ils appartiennent à l'agent, pas à son rôle.
 */
export const COMMON_AGENT_ROUTES = [
  "/portail-cfc/login",
  "/portail-cfc/acces-refuse",
  "/portail-cfc/profil",
  "/portail-cfc/support",
] as const;

/** Écran de refus d'accès. */
export const ACCESS_DENIED_PATH = "/portail-cfc/acces-refuse";

/** Retire la chaîne de requête d'une URL de navigation. */
function routeOf(href: string): string {
  const index = href.indexOf("?");
  return index === -1 ? href : href.slice(0, index);
}

/**
 * Rôles autorisés sur chaque route, déduits de la navigation.
 *
 * La table est reconstruite à la demande : elle reste petite (douze rôles) et
 * reste alignée sur les écrans et capacités de la navigation.
 */
function rolesByRoute(
  dynamicRole?: StaffRole,
  assignedCapabilities?: readonly Capability[],
): Map<string, Set<StaffRole>> {
  const map = new Map<string, Set<StaffRole>>();

  for (const role of STAFF_ROLES) {
    for (const section of getSidebarSectionsForRole(
      role,
      role === dynamicRole ? assignedCapabilities : undefined,
    )) {
      for (const item of section.items) {
        const hrefs = [item.href, ...(item.subItems?.map((sub) => sub.href) ?? [])];
        for (const href of hrefs) {
          if (!href) continue;
          const route = routeOf(href);
          const roles = map.get(route) ?? new Set<StaffRole>();
          roles.add(role);
          map.set(route, roles);
        }
      }
    }
  }

  return map;
}

/**
 * La route est-elle l'une de celles que tout agent peut ouvrir ?
 *
 * La racine de la console est une **entrée de rôle** : elle mène à l'écran
 * du pôle, elle n'en est pas un. Elle est donc ouverte à tout agent, mais
 * par égalité exacte — un préfixe ouvrirait toute la console.
 */
export function isCommonAgentRoute(pathname: string): boolean {
  const route = routeOf(pathname);
  if (route === AGENT_PORTAL_ROOT) return true;

  return COMMON_AGENT_ROUTES.some(
    (common) => route === common || route.startsWith(`${common}/`),
  );
}

/**
 * Le rôle peut-il ouvrir cette route ?
 *
 * Une page de détail hérite de son écran : `/portail-cfc/clients/<id>` suit
 * le sort de `/portail-cfc/clients`. Le **préfixe le plus long** l'emporte,
 * pour qu'une sous-route précise ne soit pas ouverte par un préfixe plus
 * large.
 */
export function canAgentOpenRoute(
  role: StaffRole,
  pathname: string,
  assignedCapabilities?: readonly Capability[],
): boolean {
  const route = routeOf(pathname);
  if (isCommonAgentRoute(route)) return true;

  // Operational dossier summaries are a shared staff screen. The dynamic
  // detail route shows no KYC documents or full contact profile; row access
  // still passes through the dossier RLS policy.
  if (route.startsWith(`${AGENT_PORTAL_ROOT}/dossiers/`)) {
    return hasCapability(role, "dossier:read", assignedCapabilities);
  }

  const visibleRolesByRoute = rolesByRoute(role, assignedCapabilities);
  const declaredRoutes = getDeclaredNavRoutePaths();
  let bestRoute: string | null = null;

  for (const declaredRoute of declaredRoutes) {
    const candidate = routeOf(declaredRoute);
    if (route !== candidate && !route.startsWith(`${candidate}/`)) continue;
    if (bestRoute === null || candidate.length > bestRoute.length) {
      bestRoute = candidate;
    }
  }

  return bestRoute ? visibleRolesByRoute.get(bestRoute)?.has(role) ?? false : false;
}

/** Keep the assigned role's landing URL inside its current live grants. */
export function accessibleLandingPath(
  role: StaffRole,
  assignedCapabilities?: readonly Capability[],
): string {
  const preferred = landingPathForRole(role);
  if (canAgentOpenRoute(role, preferred, assignedCapabilities)) return preferred;

  const firstAvailable = getSidebarSectionsForRole(role, assignedCapabilities)
    .flatMap((section) => section.items)
    .find((item) => item.href)?.href;
  return firstAvailable ?? ACCESS_DENIED_PATH;
}
