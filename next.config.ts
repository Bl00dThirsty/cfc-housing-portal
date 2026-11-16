import type { NextConfig } from "next";

import packageJson from "./package.json";

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
};

export default nextConfig;
