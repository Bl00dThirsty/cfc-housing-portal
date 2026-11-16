import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // Build output and generated types are artifacts, not source — never lint them.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Layering seam — the domain is pure: no framework, no data layer, no UI.
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "next",
                "next/*",
                "@supabase/*",
                "@supabase/**",
                "@/components/*",
                "@/components/**",
                "@/server/*",
                "@/server/**",
              ],
              message:
                "src/domain/** must stay pure: it may not import react, next, @supabase/*, @/components/** or @/server/**.",
            },
          ],
        },
      ],
    },
  },
  {
    // The UI layer consumes the domain, never the server/data layer directly.
    // Server actions stay reachable: they are designed to be called from a
    // client component. Everything else under @/server/** is server-only.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@supabase/*",
                "@supabase/**",
                "@/server/*",
                "@/server/**",
                "!@/server/actions",
                "!@/server/actions/**",
              ],
              message:
                "src/components/** may not import @supabase/* or the server layer — go through @/server/actions/** or the domain layer.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
