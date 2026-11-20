# Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current codebase locally verifiable and PR-ready for release without touching hosted Supabase or Vercel.

**Architecture:** Four reporting/guard utilities and two forward-only migrations added to the existing local tooling. No application behaviour changes except the explicit-failure guard in `scripts/system.mjs`. All findings are written to a dated runbook in `docs/`.

**Tech Stack:** Node 24 scripts (`node:test`), Supabase CLI 3.2.0 (pinned), PostgreSQL 15 / pgTAP, Next.js 15.5.25.

## Global Constraints

- Local + PR-ready only: no hosted Supabase migration, seed, reset, or Vercel write in this plan.
- Forward-only migrations; never run `supabase db reset` against a hosted target.
- Next.js 15.5.25, React 19, Tailwind 4; Supabase CLI pinned to `3.2.0` in `package.json`.
- No new `SECURITY DEFINER` function in schema `public`; no `auth.role()` or `user_metadata` in any RLS policy.
- Never print secrets; reuse `redactSensitiveOutput` for all child-process output.
- Preserve the existing dirty worktree: no `git reset`, no force-push, no discarding WIP.
- Commit after each task with the exact message shown.

---

### Task 1: Migration parity reporter

**Files:**
- Create: `scripts/check-migration-parity.mjs`
- Create: `scripts/check-migration-parity.test.mjs`
- Create: `docs/release/2026-11-20-migration-parity.md`

**Interfaces:**
- Consumes: `supabase/migrations/*.sql` filenames; an applied-version list from `supabase_migrations.schema_migrations`.
- Produces: `parseMigrationVersions(filenames)`, `findPendingMigrations(localVersions, appliedVersions)`, `readLocalMigrationVersions(dir?)`, `formatParityReport(localVersions, appliedVersions)`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/check-migration-parity.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

import {
  findPendingMigrations,
  formatParityReport,
  parseMigrationVersions,
} from "./check-migration-parity.mjs";

test("parses only 14-digit sql migration version prefixes", () => {
  assert.deepEqual(
    parseMigrationVersions([
      "20261119161940_cfc_staff_intake_routing_catalogue.sql",
      "20261119161940_cfc_staff_intake_routing_catalogue.txt",
      "notes.sql",
    ]),
    ["20261119161940"],
  );
});

test("reports pending versions in ascending order", () => {
  const local = ["20261117130000", "20261119141515", "20261119161940"];
  const applied = ["20261117130000", "20261119141515"];
  assert.deepEqual(findPendingMigrations(local, applied), ["20261119161940"]);
});

test("format includes counts and pending versions without secrets", () => {
  const report = formatParityReport(
    ["20261117130000", "20261119161940"],
    ["20261117130000"],
  );
  assert.match(report, /Local migrations: 2/);
  assert.match(report, /Applied migrations: 1/);
  assert.match(report, /Pending: 1/);
  assert.match(report, /20261119161940/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/check-migration-parity.test.mjs`
Expected: FAIL — `Cannot find module './check-migration-parity.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/check-migration-parity.mjs
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MIGRATIONS_DIR = path.join(PROJECT_ROOT, "supabase", "migrations");

export function parseMigrationVersions(filenames) {
  return filenames
    .filter((name) => name.endsWith(".sql"))
    .map((name) => name.slice(0, -4).match(/^(\d{14})_/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
}

export function findPendingMigrations(localVersions, appliedVersions) {
  const applied = new Set(appliedVersions);
  return localVersions.filter((version) => !applied.has(version));
}

export async function readLocalMigrationVersions(dir = MIGRATIONS_DIR) {
  return parseMigrationVersions(await readdir(dir));
}

export function formatParityReport(localVersions, appliedVersions) {
  const pending = findPendingMigrations(localVersions, appliedVersions);
  return [
    `Local migrations: ${localVersions.length}`,
    `Applied migrations: ${appliedVersions.length}`,
    `Pending: ${pending.length}`,
    ...pending.map((version) => `  - ${version}`),
  ].join("\n");
}

async function main() {
  const appliedPath = process.argv[2];
  if (!appliedPath) {
    console.error("Usage: node scripts/check-migration-parity.mjs <applied-versions.json>");
    process.exitCode = 1;
    return;
  }
  const { readFile } = await import("node:fs/promises");
  const applied = JSON.parse(await readFile(appliedPath, "utf8"));
  if (!Array.isArray(applied) || !applied.every((v) => typeof v === "string")) {
    throw new Error("applied-versions.json must be an array of version strings");
  }
  console.log(formatParityReport(await readLocalMigrationVersions(), applied));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Parity check failed.");
    process.exitCode = 1;
  });
}
```

- [ ] **Step 4: Run the test and the CLI**

Run: `node --test scripts/check-migration-parity.test.mjs`
Expected: 3 tests pass.
First create `docs/release/2026-11-20-applied-versions.json` from the 53 hosted version strings reported by `supabase_migrations.schema_migrations` (read-only MCP query). Then run:
`node scripts/check-migration-parity.mjs docs/release/2026-11-20-applied-versions.json`
Expected: prints `Pending: 32` and the 32 versions after `20261117130000`.

- [ ] **Step 5: Write the recorded snapshot and runbook**

Create `docs/release/2026-11-20-migration-parity.md`:
```markdown
# Migration parity — 2026-11-20

Local: 85 files, max `20261119161940`.
Hosted project `yyqfqsmsfaccsstwlpog`, branch `main`: 53 applied, max
`20261117130000`, status `MIGRATIONS_FAILED`.
Pending: 32 versions (see `check-migration-parity.mjs` output).

No hosted command was run. A separately approved pass must resolve the failed
branch state, replay migrations from an empty local database, review the diff,
and only then apply to a confirmed target. This runbook is not an apply order.
```

- [ ] **Step 6: Commit**

```bash
git add scripts/check-migration-parity.mjs scripts/check-migration-parity.test.mjs docs/release/
git commit -m "chore(release): add read-only migration parity reporter"
```

---

### Task 2: Refuse ambiguous remote targets

**Files:**
- Modify: `scripts/system.mjs:305-315`
- Test: `scripts/system.test.mjs`

**Interfaces:**
- Consumes: `supabase/.temp/project-ref` and the validated `environment.projectRef`.
- Produces: `assertUnambiguousLocalLink(targetRef, root = PROJECT_ROOT)` — throws when a stored link exists and differs from `targetRef`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/system.test.mjs` (use `node:test` `mock` and a temporary directory):
```js
test("assertUnambiguousLocalLink rejects a different linked project ref", async () => {
  const root = await mkdtemp(join(tmpdir(), "cfc-link-"));
  await mkdir(join(root, "supabase", ".temp"), { recursive: true });
  await writeFile(join(root, "supabase", ".temp", "project-ref"), "production-ref\n");
  assert.throws(
    () => assertUnambiguousLocalLink("staging-ref", root),
    /linked to a different project/,
  );
  await rm(root, { recursive: true, force: true });
});

test("assertUnambiguousLocalLink accepts a matching ref or no link", async () => {
  const root = await mkdtemp(join(tmpdir(), "cfc-link-"));
  assert.doesNotThrow(() => assertUnambiguousLocalLink("staging-ref", root));
  await mkdir(join(root, "supabase", ".temp"), { recursive: true });
  await writeFile(join(root, "supabase", ".temp", "project-ref"), "staging-ref\n");
  assert.doesNotThrow(() => assertUnambiguousLocalLink("staging-ref", root));
  await rm(root, { recursive: true, force: true });
});
```

Add imports at the top of the test file:
```js
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/system.test.mjs`
Expected: FAIL — `assertUnambiguousLocalLink is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add after `createSystemCommandEnvironment` in `scripts/system.mjs`:
```js
export function assertUnambiguousLocalLink(targetRef, root = PROJECT_ROOT) {
  const linkFile = path.join(root, "supabase", ".temp", "project-ref");
  if (!existsSync(linkFile)) return;
  const linkedRef = readFileSync(linkFile, "utf8").trim();
  if (!linkedRef || linkedRef === targetRef) return;
  throw new Error(
    `The local Supabase CLI is linked to a different project (${linkedRef}); ` +
      `unlink it before targeting ${targetRef}.`,
  );
}
```

Add `readFileSync` to the `node:fs` import on line 2:
```js
import { existsSync, readFileSync } from "node:fs";
```

Call it in `runSystem` immediately after the anon-key check:
```js
  if (name !== "local") assertUnambiguousLocalLink(environment.projectRef);
```

- [ ] **Step 4: Run the tests**

Run: `node --test scripts/system.test.mjs`
Expected: all tests pass, including the two new ones and the existing command-plan tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/system.mjs scripts/system.test.mjs
git commit -m "fix(release): refuse remote pushes under an ambiguous local link"
```

---

### Task 3: Revoke anonymous EXECUTE on SECURITY DEFINER functions

**Files:**
- Create: `supabase/migrations/20261120120000_revoke_anon_definer_execute.sql`
- Create: `supabase/tests/20261120_revoke_anon_definer_execute.test.sql`

**Interfaces:**
- Consumes: `pg_proc.prosecdef` and `pg_namespace.nspname = 'public'`.
- Produces: zero `SECURITY DEFINER` functions in `public` executable by `anon`; the dispatch route continues to work through the service-role client already used in `src/app/api/events/dispatch/route.ts:46`.

- [ ] **Step 1: Write the failing pgTAP assertion**

```sql
-- supabase/tests/20261120_revoke_anon_definer_execute.test.sql
begin;
select plan(2);

select is(
  (select count(*)::int
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosecdef
     and has_function_privilege('anon', p.oid, 'EXECUTE')),
  0,
  'no SECURITY DEFINER function in public is executable by anon'
);

select is(
  (select count(*)::int
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosecdef
     and has_function_privilege('public', p.oid, 'EXECUTE')),
  0,
  'no SECURITY DEFINER function in public is executable by PUBLIC'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test against the local stack to verify it fails**

Run: `npx supabase test db --local 2>&1 | Select-String -Pattern "revoke_anon_definer_execute"`
Expected: the two assertions FAIL with counts greater than 0 (matches the live advisor finding of 10 anon-executable definer functions).

- [ ] **Step 3: Write the forward-only migration**

```sql
-- supabase/migrations/20261120120000_revoke_anon_definer_execute.sql
-- Least privilege: SECURITY DEFINER functions in public are internal or
-- authenticated-only. No public/anon EXECUTE is retained. The event dispatch
-- route uses the service-role client (src/app/api/events/dispatch/route.ts),
-- so revoking cfc_dispatch_token_valid from anon does not break the relay.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function %s from anon, public', fn.signature);
  end loop;
end $$;

-- Keep the documented internal grants explicit. These are the roles the app
-- actually uses; anon and PUBLIC are deliberately absent.
grant execute on function public.cfc_my_context() to authenticated, service_role;
grant execute on function public.cfc_dispatch_token_valid(text) to authenticated, service_role;
```

- [ ] **Step 4: Apply locally and re-run the assertion**

Run: `npx supabase migration up --local`
Run: `npx supabase test db --local 2>&1 | Select-String -Pattern "revoke_anon_definer_execute"`
Expected: both assertions pass with count `0`.

- [ ] **Step 5: Capture the advisor before/after snapshot**

Run (read-only, hosted): Supabase MCP `get_advisors` with `type: "security"`.
Record only counts and remediation links in `docs/release/2026-11-20-migration-parity.md`. Do not mutate hosted state.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261120120000_revoke_anon_definer_execute.sql supabase/tests/20261120_revoke_anon_definer_execute.test.sql docs/release/2026-11-20-migration-parity.md
git commit -m "fix(db): revoke anon execute on security definer functions"
```

---

### Task 4: Index uncovered audit foreign keys

**Files:**
- Create: `supabase/migrations/20261120121000_index_audit_foreign_keys.sql`
- Modify: `docs/release/2026-11-20-migration-parity.md`

**Interfaces:**
- Consumes: `pg_constraint` rows of type `f` in `public` without a leading-column index.
- Produces: covering indexes on every audit-column FK, recorded count improvement.

- [ ] **Step 1: Write the failing assertion**

Append to `supabase/tests/20261120_revoke_anon_definer_execute.test.sql`:
```sql
select is(
  (select count(*)::int
   from pg_constraint c
   join pg_class t on t.oid = c.conrelid
   join pg_namespace n on n.oid = c.connamespace
   where c.contype = 'f' and n.nspname = 'public'
     and not exists (
       select 1 from pg_index i
       where i.indrelid = c.conrelid
         and i.indkey[0] = c.conkey[1]
     )),
  0,
  'every public foreign key has a covering index'
);
```
Change `select plan(2)` to `select plan(3)`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase test db --local 2>&1 | Select-String -Pattern "revoke_anon_definer_execute"`
Expected: the new assertion FAILS with a large count (advisor reported 194).

- [ ] **Step 3: Write the migration**

```sql
-- supabase/migrations/20261120121000_index_audit_foreign_keys.sql
-- Covering indexes for audit-column foreign keys. Generated from the local
-- catalog; IF NOT EXISTS keeps the migration replayable on a fresh database.
do $$
declare
  constraint_row record;
  column_name text;
begin
  for constraint_row in
    select c.conname, c.conrelid, c.conkey, t.relname, n.nspname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'
  loop
    select a.attname into column_name
    from pg_attribute a
    where a.attrelid = constraint_row.conrelid
      and a.attnum = constraint_row.conkey[1];

    execute format(
      'create index if not exists %I on %I.%I (%I)',
      'idx_' || left(constraint_row.relname, 40) || '_' || left(column_name, 30),
      constraint_row.nspname,
      constraint_row.relname,
      column_name
    );
  end loop;
end $$;
```

- [ ] **Step 4: Apply locally and re-run the assertions**

Run: `npx supabase migration up --local`
Run: `npx supabase test db --local 2>&1 | Select-String -Pattern "revoke_anon_definer_execute"`
Expected: 3 assertions pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261120121000_index_audit_foreign_keys.sql supabase/tests/20261120_revoke_anon_definer_execute.test.sql
git commit -m "perf(db): index uncovered foreign keys"
```

---

### Task 5: Vercel environment handoff note

**Files:**
- Create: `docs/release/2026-11-20-vercel-environment-handoff.md`

**Interfaces:**
- Consumes: observed Vercel project state (23 env vars, all Production-target; latest `develop` deployment is a Preview).
- Produces: an explicit, unexecuted checklist for a later approved pass.

- [ ] **Step 1: Write the handoff document**

```markdown
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
```

- [ ] **Step 2: Verify no environment values were written**

Run: `git status --short`
Expected: only the new doc plus earlier task files; no `.env*` and no Vercel config change.

- [ ] **Step 3: Commit**

```bash
git add docs/release/2026-11-20-vercel-environment-handoff.md
git commit -m "docs(release): record Vercel environment handoff steps"
```

---

## Self-review

- **Spec coverage:** G3 covered by Tasks 1–5; N1/N2 honoured (no hosted writes); AC3 covered by Task 3; AC4 covered by Tasks 1, 2 and 5; AC6 verification commands are embedded in each task.
- **Placeholders:** none — every code step contains complete source.
- **Type consistency:** `parseMigrationVersions` returns 14-digit strings used by `findPendingMigrations` and `formatParityReport`; `assertUnambiguousLocalLink(targetRef, root)` signature is identical in tests and implementation.
