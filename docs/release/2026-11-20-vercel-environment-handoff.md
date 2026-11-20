# Vercel environment handoff — 2026-11-20

Observed (read-only): project `cfc-housing-portal`, 23 environment variables,
all with `target: ["production"]`. Latest deployment from `develop` is a
Preview and therefore has no Supabase configuration.

Required before any Preview demo (NOT performed in this pass):
1. Team scope `team_MDgl5AVt37qLhyXj9wnTrkYB` must be authorized. Use the MCP
   `authorize_team_access` link; it is single-use and expires in 10 minutes.
2. Add Preview + Development targets for `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key), and
   `NEXT_PUBLIC_SITE_URL` using a non-production Supabase target.
3. Add server-side keys only to a non-production target and never prefix them
   with `NEXT_PUBLIC_`.
4. Confirm the production project ref before any Production change; the local
   CLI is currently linked to it.
5. Re-run `npm run build` and the authenticated smoke matrix on the Preview.

Leaked-password protection is an Auth dashboard setting and cannot be set by
SQL; record it as a manual production-hardening step.
