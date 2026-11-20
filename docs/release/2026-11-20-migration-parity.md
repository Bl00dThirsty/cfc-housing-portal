# Migration parity — 2026-11-20

Local: 85 files, max `20261119161940`.
Hosted project `yyqfqsmsfaccsstwlpog`, branch `main`: 53 applied, max
`20261117130000`, status `MIGRATIONS_FAILED`.
Pending: 32 versions (see `check-migration-parity.mjs` output).

No hosted command was run. A separately approved pass must resolve the failed
branch state, replay migrations from an empty local database, review the diff,
and only then apply to a confirmed target. This runbook is not an apply order.

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
