import type { NextConfig } from "next";

import packageJson from "./package.json";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * Pas de CSP complète ici : le rendu Next injecte des scripts et des styles
 * en ligne, et Supabase ouvre un WebSocket. Une CSP mal calibrée casserait
 * l'application en production ; les en-têtes ci-dessous couvrent les risques
 * de base sans dépendre du contenu généré.
 */
const securityHeaders = [
  // Empêche l'interprétation d'un type MIME différent de celui annoncé.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ne divulgue pas le chemin complet vers les sites tiers.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Interdit l'intégration du portail dans une iframe tierce (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Ferme les API navigateur dont le portail n'a pas besoin.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS pendant un an sur le domaine de production.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  /**
   * La version de l'application — **une seule** source.
   *
   * Le `package.json` fait foi : l'interface ne l'écrit jamais en dur. Une
   * version affichée en clair dans l'écran, et une autre dans le manifeste,
   * divergent au premier déploiement.
   */
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${packageJson.version}`,
  },

  /** Ne pas annoncer le framework utilisé (empreinte inutile). */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
