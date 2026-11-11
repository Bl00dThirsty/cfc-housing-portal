/**
 * Doublure du module `server-only` pour les tests.
 *
 * Le paquet `server-only` lève une erreur à l'import hors d'un contexte
 * serveur : c'est un garde-fou de bundler, pas une garantie runtime. Les
 * tests tournent sur Node et doivent pouvoir importer les modules serveur.
 */
export {};
