# CFC Housing Portal — MVP Completion & Release Hardening Design

**Date:** 2026-11-20
**Status:** Approved for implementation planning
**Owner pass:** three sequential slices, local + PR-ready only

## 1. Context

An exhaustive audit of the codebase, the nine implementation plans, the seven specs, the live Supabase project and the Vercel project established that:

- The portal is functionally broad and green on every local gate (typecheck, lint, 522 unit tests, 47 system tests, production build, 77/77 smoke, local pgTAP).
- Five register domains are visible in the console only as `PersistenceNotice` stubs: promoters, BET experts, notary offices, subsidies, recovery.
- The hosted Supabase project is **32 migrations behind** the repository and its `main` branch reports `MIGRATIONS_FAILED`.
- Live Supabase advisors still report `SECURITY DEFINER` functions executable by `anon`/`authenticated`, leaked-password protection disabled, and 194 unindexed foreign keys.
- All 23 Vercel environment variables are Production-target only, yet the latest `develop` deployment is a Preview.
- The plan/spec corpus contains 14 cross-document contradictions and 171 unchecked boxes, many of which are *not* missing features.

The user's decisions for this pass:

1. Proceed with all three workstreams, phased.
2. This is an **MVP / demonstration** target — not every planned feature must ship.
3. `/accueil` is obsolete: update the documentation, do not build the route.
4. Implement the five stubbed registers with real persistence and working CRUD.
5. **Every profile receives a notification** for register events, with role-safe payloads.
6. Keep all changes **local + PR-ready**. Do not mutate hosted Supabase, hosted seeds, or Vercel configuration in this pass.

## 2. Goals and non-goals

### Goals
- G1 — Replace all five `PersistenceNotice` stubs with persisted, audited, RLS-protected registers offering list, detail, create, edit and delete.
- G2 — Fan out one role-safe in-app notification per register event to every active actor, with optional email through the existing provider.
- G3 — Produce a local, verifiable, PR-ready release-hardening set: migration parity report, least-privilege RPC grants, FK indexes, Vercel env-var plan, and an accidental-production-push guard.
- G4 — Reconcile the documentation: remove obsolete `/accueil` references, resolve contradictory claims with evidence, and mark completed tasks accurately.
- G5 — Prove everything locally with the project's existing verification gates.

### Non-goals (explicitly out of MVP scope)
- N1 — Applying any migration or fixture to hosted Supabase; running `system:staging` or `system:production`.
- N2 — Writing Vercel environment variables or changing team access; the consent link and env plan are hand-off items only.
- N3 — Building `/accueil`, implementing document verification against an official registry, or enabling approval-threshold automation without a signed CFC delegation.
- N4 — Modelling the credit-contract/repayment lifecycle, debt closure, or release rows. This invariant remains documented as blocked.
- N5 — Creating new staff role codes, completing the full staff-availability lifecycle, or a full route-by-route accessibility audit.
- N6 — Rewriting the entire plan checkbox corpus mechanically; historical TDD-red and commit boxes keep their meaning.

## 3. Architecture — three slices

| Slice | Scope | Hosted writes | Exit gate |
|---|---|---|---|
| 1 — Release hardening | Migration parity, RPC grants, FK indexes, Vercel env plan, production-push guard | **None** | Local DB replay + pgTAP + advisors snapshot + documented runbook |
| 2 — Registers & notifications | Five tables, RLS, RPCs/actions, UI, notification fan-out, fixtures | **None** | Local CRUD smoke + RLS matrix + notification tests |
| 3 — Documentation | `/accueil` cleanup, contradiction reconciliation, status marking | **None** | `git diff --check` + doc review |

Each slice preserves the existing dirty worktree: no `git reset`, no force-push, no discarding WIP. Slices do not depend on each other for verification, but the order above is preferred so the security baseline is agreed before adding new write paths.

## 4. Slice 1 — Release hardening (local + PR-ready)

### 4.1 Migration parity
- Capture the authoritative local migration list (`supabase/migrations/*.sql`, 85 files, max `20261119161940`) and the hosted list (53 applied in `supabase_migrations.schema_migrations`, max `20261117130000`).
- Add a read-only preflight script, `scripts/check-migration-parity.mjs`, that compares a supplied applied-migration snapshot with local files and prints pending versions without secrets. It is **reporting only**; it never pushes.
- Extend the `system:production` command plan so it refuses to proceed when the target's applied set is behind the local set, requiring an explicit, reviewed apply step first.
- Write a runbook section in `docs/` describing the exact, manual apply sequence for a later, separately approved pass. Record the `MIGRATIONS_FAILED` branch state as a blocker to resolve before any hosted apply.

### 4.2 Least-privilege RPC grants
- Enumerate every `SECURITY DEFINER` function in schema `public` from `pg_proc`/`information_schema`, classify each as *publicly required* or *internal only*.
- Add one forward-only migration that, by default, `REVOKE EXECUTE ... FROM anon, public` on all `SECURITY DEFINER` functions in `public`, then re-grants only a reviewed allowlist to `authenticated` and/or `service_role`. No function is re-granted to `anon` unless it contains its own token/capability check and the need is documented in the migration comment.
- Do not add `SECURITY DEFINER` to any new function in this pass. New register writes use RLS-gated table access or server-only service-role code, not new definer functions.
- Regenerate the local advisor snapshot and record the before/after counts as evidence. Leaked-password protection remains a dashboard-only action and is recorded as such.

### 4.3 Foreign-key indexes
- Generate a forward-only migration adding covering indexes for the unindexed foreign keys reported by the advisor, prioritizing audit columns (`created_by`, `updated_by`, `deleted_by`) and dossier/actor links. Verify the local index count improvement with a read-only query.

### 4.4 Vercel and local CLI guards
- Document the required Vercel env-var targets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`/publishable key, `NEXT_PUBLIC_SITE_URL` for Preview and Development, with server keys scoped as appropriate. Do not write them.
- Record the team-consent link regeneration procedure; the current link is single-use and expires in 10 minutes.
- Add a guard to `scripts/system.mjs` that compares `supabase/.temp/project-ref` with the explicitly validated target ref and refuses ambiguous ad-hoc pushes. Recommend `supabase unlink` when the linked ref is the production ref and the target is not production.

## 5. Slice 2 — Registers & role-safe notifications

### 5.1 Data model
Five new tables in `public`, each following the project's standard audit-column convention (`created_at/by`, `updated_at/by`, `deleted_at/by`) via `private.attach_audit_trigger()`:

| Table | Purpose | Key fields |
|---|---|---|
| `registers_promoters` | Promoter/SIC directory + detail | code, legal name, registration, region, city, contact, status |
| `registers_promoter_relationships` | Promoter↔dossier relationship history | promoter_id, dossier_id, relationship type, validity window, notes |
| `registers_bet_experts` | BET/expert directory | firm, expert name, specialization, qualification reference + expiry, region, contact, status |
| `registers_notary_offices` | Notary office directory | office, notary name, registration, city, region, contact, status |
| `registers_subsidies` | Subsidy eligibility/approval record | code, label, funding source, eligibility rule, amount, approval reference, dossier link, status |
| `registers_recovery_cases` | Arrears/recovery case | case code, dossier link, arrears stage, amount due, notices, promise date, escalation level, assigned actor, status |

### 5.2 Authorization model
- `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY` on every new table.
- `SELECT` policy: `TO authenticated USING (private.has_capability('register:read'))`. No `anon` grant. No `auth.role()` and no `user_metadata` in any policy.
- `INSERT`, `UPDATE`, `DELETE` policies: `TO authenticated`, gated by `private.has_capability('register:write')`; `UPDATE` carries both `USING` and `WITH CHECK` so a row cannot be moved outside the permitted scope.
- New capabilities `register:read` and `register:write` are added to `ref.capability` and granted to the appropriate role×capability rows in the idempotent reference seed. `ADMIN` keeps its locked bootstrap grants. Roles without a business owner remain ungranted rather than silently broad.
- Writes from server actions go through the session client so RLS applies; no new `SECURITY DEFINER` functions are introduced.

### 5.3 Application layer
- Server queries: one scoped list query and one detail query per register, returning explicit `empty`, `forbidden`, and `query-error` states. No fabricated rows.
- Server actions: create, update, delete with Zod validation, capability checks, and success/failure results through the existing `action-feedback` convention.
- UI: list pages use the shared data-table engine with search/filter/sort/selection and table/card parity; detail pages show persisted history with breadcrumbs. A single shared form pattern covers create/edit. All pages provide explicit populated, empty, error, permission-denied and retry states.
- Local/staging fixtures: idempotent, tagged, with inserted/updated/skipped counts; never imported into production paths.

### 5.4 Role-safe notification fan-out
- A single server-side dispatcher, `notifyRegisterEvent()`, is invoked atomically after a successful register write. It uses the existing server-only service-role client so it can insert on behalf of recipients without exposing a new definer RPC.
- Recipients are all **active** actors: citizens with a live `citizen_profiles` row and staff with an active assignment window (`starts_at`/`ends_at` honoured, as in `20261118190000`).
- Payload rules:
  - Every recipient gets a generic title and event type.
  - Recipients **with** `register:read` additionally receive the register label and a deep link to the detail page.
  - Recipients **without** it receive a generic announcement with **no record identifier, no dossier data, no CNI, phone or email** of any other person.
- Idempotency: one notification per register event, keyed by event id and protected by the existing notification dedupe mechanism; re-running a write never duplicates.
- Email is optional and uses the existing provider/template system with the same role-safe payload. If no provider is configured, the in-app notification still succeeds and is never rolled back by an email failure.
- The dispatcher is covered by tests asserting the recipient set and that payloads differ correctly by role.

## 6. Slice 3 — Documentation reconciliation

- Remove every `/accueil` reference: the stale comment in `src/app/page.tsx`, `README.md`, and `docs/CFC-GREENFIELD-REFERENCE.md` (D4). Replace with the actual public surface (`/simulator`, `/faq`, `/tracking`, `/verify`).
- Adopt `package.json` as the single source of truth: Next.js 15.5.25, React 19, Tailwind 4. Correct the "Next.js 16" claims in the three older plans.
- Mark the old `/dev/demo` panel as superseded by guarded, database-seeded local/staging fixtures in the greenfield reference and plan P9; no route exists in `src/app`.
- Reconcile the 14 identified contradictions with evidence. Where documents disagree, prefer **current source code + passing tests**, then the dated status audit, then the reference docs.
- Update test counts to current measurements (91 test files passed / 5 skipped, 522 tests passed / 17 skipped, 47 system tests, 77/77 smoke).
- Add a dated status addendum to each of the nine plans: flip feature-implementation boxes where code and tests provide evidence; explicitly preserve TDD-red, commit, and hosted-release boxes with a note explaining why they remain unchecked.
- Record `/verify`, the credit-contract lifecycle, official approval thresholds, full staff lifecycle, new role codes, and the accessibility audit as **deferred with reasons**, not silently forgotten.

## 7. Error handling and observability

- New register writes surface query errors explicitly; a missing schema or capability is reported, never converted to an empty success or fabricated data.
- Notification email failures are logged and isolated from the in-app write, matching the existing `notify` behaviour.
- Every new server action returns the project's discriminated `{ ok }` result and uses the single toast layer.
- Audit events use the existing append-only `dossier_events` / admin-audit mechanisms; no new audit table.

## 8. Verification plan (local only)

1. `supabase db reset` replay from empty, then apply all forward migrations including the new ones.
2. pgTAP suites: RLS/capability matrix for all six new tables; notification recipient set and role-safe payload assertions; idempotency of register fixtures and fan-out.
3. `npm test`, `npm run test:system`, `npm run typecheck`, `npm run lint`, `npm run build`.
4. Authenticated local smoke covering the five new list/detail routes, create/edit/delete, and notification receipt for at least two roles.
5. Supabase advisor snapshot before/after; record remaining findings with severity and owner.
6. `git diff --check` and a secret scan. No hosted command is executed in this pass.

## 9. Acceptance criteria

- AC1 — All five stub screens render persisted data; CRUD works and is audited.
- AC2 — Every active actor receives exactly one role-safe notification per register event; no cross-role PII leaks.
- AC3 — All new tables have RLS enabled and forced; no `anon` EXECUTE on any `SECURITY DEFINER` function; advisor `anon`/`authenticated` definer counts are reduced or each remaining case has a documented justification.
- AC4 — A migration parity report and an unexecuted, reviewed apply runbook exist; hosted Supabase and Vercel are untouched.
- AC5 — No `/accueil` reference remains; the 14 contradictions are resolved in writing; each plan has an evidence-based status addendum.
- AC6 — Every local gate in §8 passes and is recorded with commands and counts.

## 10. Spec self-review

- **Placeholders:** none; all table names, capabilities, and paths are concrete. The only external dependency is the separately approved hosted apply, explicitly out of scope.
- **Internal consistency:** the "no new `SECURITY DEFINER`" rule in §4.2/§5.2 matches the service-role dispatcher in §5.4; the role-safe payload rule is identical in §5.4 and AC2.
- **Scope check:** three slices are sequential and independently verifiable; each fits one implementation plan. The umbrella holds only shared decisions.
- **Ambiguity check:** "every active actor" is defined in §5.4; "done" for a register is defined in AC1; "local + PR-ready" is defined in N1/N2 and §3. `/accueil` is documentation-only by G4/N3.
