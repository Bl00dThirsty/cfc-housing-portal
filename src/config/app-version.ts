/**
 * La version affichée dans l'interface.
 *
 * Elle vient du `package.json`, par l'intermédiaire de `next.config.ts` :
 * l'écran ne l'écrit **jamais** en dur. Une version affichée ici, et une
 * autre dans le manifeste, divergent au premier déploiement.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "v0.0.0";
