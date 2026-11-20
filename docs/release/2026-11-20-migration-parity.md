# Migration parity — 2026-11-20 (updated 2026-11-20)

Local repo migrations: 92 files, max `20261120140000` (includes `20261120140000_citizen_onboarding_kyc_document_upload.sql`).

Hosted project `yyqfqsmsfaccsstwlpog`, default branch `main`:
- `supabase_migrations.schema_migrations`: **92 applied**, max **`20261120140000`** (DB schema/history aligned with repo as of this update).
- Supabase branch/platform status still reports **`MIGRATIONS_FAILED`** in API metadata; actual database migration state is aligned. If the status remains stale in dashboard/API, treat as platform metadata and verify before future CLI-driven applies.
- `preview_project_status`: `ACTIVE_HEALTHY`.

Previously (earlier on 2026-11-20): hosted had 53 applied (max `20261117130000`) with 38 pending and branch `MIGRATIONS_FAILED`; pending migrations through `20261120133000` were applied via Supabase MCP/CLI, history repaired where MCP-recorded versions differed, and `20261120140000` was added and applied to unblock citizen KYC/onboarding document uploads.

**Operational note:** for future hosted changes, prefer applying repo migrations in version order and recording them in `schema_migrations` consistently; resolve any platform `MIGRATIONS_FAILED` metadata before assuming CLI drift checks are authoritative. Use a separately approved pass for additional production changes.

## Task 3 — anon SECURITY DEFINER EXECUTE (read-only advisor snapshot)

Read-only Supabase MCP `get_advisors({ type: "security" })` against hosted
project `yyqfqsmsfaccsstwlpog`, observed_at `2026-11-20T11:02:53.306Z`. No
hosted write was performed. Counts and remediation links only; individual
findings are not reproduced here.

| Advisor lint | Before | After (hosted) | After (local) | Remediation |
| --- | --- | --- | --- | --- |
| `anon_security_definer_function_executable` (0028) | 10 | 10 — unchanged, no hosted apply | 0 | https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable |
| `authenticated_security_definer_function_executable` (0029) | 39 | 39 — out of scope | 61 — out of scope, unchanged | https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable |
| `auth_leaked_password_protection` | 1 | 1 — out of scope | n/a | https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection |

The "before" anon count is the task-brief advisor finding (10). The hosted
count remains 10 because migration `20261120120000_revoke_anon_definer_execute.sql`
was applied to the local stack only and awaits the separately approved hosted
apply pass described above. Locally the pgTAP assertion moved from RED
(`have: 8, want: 0`) to GREEN (`0`); the hosted/local before delta (10 vs 8)
reflects migration parity, not a partial fix. Authenticated and service-role
EXECUTE grants were preserved (61 and 62 definer functions respectively).

## FK index coverage — 2026-11-20

Local catalog count of public foreign keys lacking a leading-column index:
124 before, 0 after migration `20261120121000_index_audit_foreign_keys.sql`.
The hosted advisor reports 194 unindexed FKs (different count granularity);
no hosted command was run in this pass. Verified locally with
`npx supabase test db --local` (3/3 assertions in
`supabase/tests/20261120_revoke_anon_definer_execute.test.sql`) and
`npm run test:system` (49/49).
