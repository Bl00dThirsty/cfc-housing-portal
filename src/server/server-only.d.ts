/**
 * Déclaration du module `server-only`.
 *
 * Le paquet `server-only` est fourni par Next.js (alias webpack vers
 * `next/dist/compiled/server-only`) mais n'est pas un paquet npm de premier
 * niveau dans ce dépôt. Cette déclaration donne au vérificateur de types ce
 * que le bundler applique déjà : interdire l'import de `server-only` depuis un
 * Client Component.
 */
declare module "server-only";
