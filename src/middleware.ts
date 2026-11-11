/**
 * Point d'entrée Next.js du middleware.
 *
 * L'implémentation vit à la racine du dépôt (`middleware.ts`), conformément à
 * l'emplacement demandé. Next.js ne recherche toutefois le middleware que
 * dans le répertoire qui contient `app/` — ici `src/`, puisque l'application
 * utilise un dossier `src`. Ce fichier fait le lien ; il ne contient aucune
 * logique.
 */

export { config, middleware } from "../middleware";
