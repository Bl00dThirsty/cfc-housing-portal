# CFC Portal Completion Roadmap

> This roadmap tracks the wider system-completion work. The product boundary, architecture, workflows, data model, authorization matrix, Mermaid diagrams, and research links are in [the system specification](../specs/2026-11-18-cfc-system-completion-design.md).

## Goal

Make the portal a trustworthy operating system for local development, staging, and production. Every operational screen must use the selected Supabase project, enforce its real permission scope, and show useful details and recovery states. No production route may fall back to synthetic data.

## Working constraints

- Work on `develop`; preserve the current uncommitted work and existing branch history.
- Keep the CFC visual system and compose the existing shadcn/Radix components.
- The database owns operational records, audit facts, assignment, authorization scope, and savings balances.
- Migrations are forward-only. Never rewrite an applied migration or reset a hosted database.
- Local and staging seeds may create synthetic users/data only after validating their target. Production never runs demo seeds.
- Do not run a cloud migration or remove cloud records as part of local implementation verification.
- A UI state never claims a successful write until the database action commits.

## Implemented foundation

- [x] Pin the project-local Supabase CLI and add `system:local`, `system:staging`, `system:production`, and system command tests.
- [x] Load local secrets from `.env.local` without printing them; reject non-loopback local seed targets.
- [x] Keep staging and production refs isolated; production command plans contain no fixture seed/reset path.
- [x] Correct the password-changed Auth notification template path and validate Supabase configuration.
- [x] Clear stale Next production webpack resolver caches before `npm run build`, preserving development caches used by active local servers.
- [x] Replace sample adviser selection with regional GESTIONNAIRE eligibility, database-serialized round robin, assignment history, reasoned admin reassignment, and a durable in-app notification in the assignment transaction.
- [x] Scope KYC/profile access to the citizen or current assigned GESTIONNAIRE; give other staff/admin a safe dossier projection.
- [x] Replace fake client queues/Kanban, analytics values, and actor sample registers with Supabase reads or explicit persistence notices.
- [x] Persist savings operation submission and approval/rejection; make balance changes database-controlled.
- [x] Use database process phase/step labels for tracking and analytics; make email preview values operator-entered only.
- [x] Add the shared Tooltip component/provider and explain the audited same-region reassignment rule.
- [x] Apply the analytics, process catalogue, and retry-safe savings-ledger migrations to the local Supabase stack.
- [x] Make database role/agency resolution and app profile readers honor staff assignment start/end windows; verify future and expired rows are denied in local pgTAP.
- [x] Write architecture, lifecycle, authorization, seed ownership, route inventory, and deployment documentation with Mermaid class/sequence/state diagrams.

## Workstream 1 — Prove access and assignment boundaries

- [ ] Run assignment unit/integration coverage for first assignment, wrap-around fairness, no eligible manager, admin reassignment, same-region rejection, missing reason, and concurrent submissions.
- [x] Verify expired and future-dated staff assignments grant no database capabilities.
- [ ] Test direct PostgREST reads as a citizen, assigned manager, former manager, different-region manager, unrelated staff member, and system admin.
- [ ] Test KYC Storage metadata/download authorization under the same actor matrix, including old signed URL behavior after reassignment.
- [ ] Verify notification creation is atomic with assignment and that a failed/declined email cannot roll back or hide the in-app notification.
- [ ] Add the real staff lifecycle: invite identity, activate/deactivate, assign role/agency, manage assignment eligibility, audit each change, and prevent disabling a staff member with unresolved assigned work without a reassignment path.
- [ ] Confirm the authoritative region source in the persisted intake model; missing/unverified region must remain unassigned and visible to administrators.

## Workstream 2 — Complete the database source-of-truth audit

- [ ] Scan production modules for mock/sample/demo/fallback data, static record arrays, hard-coded sample identities, and client-only business mutations. Record every match with file, route, source table, and action.
- [ ] Separate test fixtures, versioned reference seed inputs, UI copy, and operational data in the report; remove runtime operational fixtures and misleading demos.
- [ ] Verify `supabase/seed.sql` owns reference data and the Auth-dependent seeder owns only local/staging fixtures. Ensure both are idempotent and produce a count/manifest without secret output.
- [ ] Verify every data-bearing route distinguishes empty, forbidden, and query-error states. A missing schema or catalog must be reported; it must never be turned into fabricated rows or a silent empty success.
- [ ] Reconcile all dashboard totals against source queries and ensure no aggregate endpoint exposes names, emails, KYC payloads, transaction references, or other per-person details.

## Workstream 3 — Define missing register schemas before building screens

The current register pages only show persisted rows when a backing table exists. They must not grow local fake CRUD. For each missing module, obtain a business owner and define lifecycle/status transitions, record owner, visibility, retention, required evidence, role/capability policy, audit events, and notifications before writing a migration.

- [ ] Promoter/SIC directory and promoter relationship history.
- [ ] Expert/BET directory, qualification evidence, assignments, and report-review workflow.
- [ ] Notary directory/engagement lifecycle.
- [ ] Recovery and arrears cases, stages, notices, promises, and escalation trail.
- [ ] Subsidy eligibility, approval, amount, funding source, and disbursement reconciliation.
- [ ] Any missing committee, insurance, land-title, or reconciliation actions not already represented by persisted tables.
- [ ] For each approved schema, add local/staging-only seed examples, RLS policies, server queries/actions, a list/detail page, empty/error states, audit coverage, and a route-level test.

## Workstream 4 — Finish the savings accounting lifecycle

- [ ] Confirm transaction types, allowed channels, posting/withdrawal roles, limits, references, and maker-checker rules with the finance owner.
- [x] Add per-account idempotency keys and payload fingerprints for retry-safe submissions; keep provider references as a separate duplicate check.
- [x] Add scoped full reversals that append a reasoned, linked compensating entry; never edit or delete a posted fact.
- [x] Enforce reversal maker-checker, capability, scope, one-reversal-per-source, and atomic balance/audit writes in Postgres.
- [x] Cover retry, mismatch, independent validation, maker-checker, reversal retry/linkage, balance, source immutability, and capability denial in local ledger tests.
- [ ] Test concurrent approvals, approve-vs-reject races, invalid/negative amounts, insufficient funds, wrong dossier ownership, retries, duplicate references, and audit actor/time.
- [ ] Reconcile account balance, ledger-derived balance, citizen statement, operational register, and aggregate analytics after reload.
- [ ] Obtain Finance sign-off on limits, external reference policy, full reversals, and whether/when partial adjustments are allowed.
- [ ] Add statement filters/periods, export/print, and helpful explanations of pending, posted, rejected, and reversed states without exposing another client's data.

## Workstream 5 — Finish the interface and guide

- [ ] Review every route under `src/app` against the route-access catalogue and the data-source inventory.
- [ ] Add detail pages for supported operational records with breadcrumbs, persisted history, safe identifiers, actionable empty/error states, and role-appropriate actions.
- [ ] Add contextual tooltips/inline help to KYC evidence requirements, phase codes, savings status, reassignment, committee decisions, disbursement matching, and exports. Keep essential policy guidance visible without hover.
- [ ] Verify keyboard focus, screen-reader labels, mobile/narrow layouts, high zoom, reduced motion, and disabled/pending states.
- [ ] Check action feedback and form persistence after server errors; confirm irreversible decisions; provide retry or return links.
- [ ] Confirm CFC typography, palette, density, spacing, and existing design tokens remain consistent across new states.

## Workstream 6 — Reproducible system and release checks

- [x] Run `npm run system:local` against the existing local database: apply pending migrations, refresh reference data, idempotently provision 14 local development accounts, and start Next.js. A clean reset/replay remains open.
- [x] Run `npm run test:system` (38/38), the full Vitest suite (411 passed, 17 intentionally skipped), `npm run typecheck`, and `npm run lint`.
- [x] Run `npm run build`; the optimized Next.js 15.5.25 production build completed without errors after removing the stale resolver-cache entry.
- [x] Apply migration `20261118190000_staff_assignment_validity.sql` and run local pgTAP (14/14).
- [x] Run authenticated smoke checks across citizen, GESTIONNAIRE, GUICHET, notary, committee, and admin routes; all 76/76 checks passed, including role-specific CRM visibility and database-backed analytics.
- [ ] Re-run local migration status and replay from an empty database; inspect only local Supabase advisors for changed policies/functions/indexes.
- [ ] Confirm staging credentials name a distinct configured staging project before running `npm run system:staging`. Run hosted staging only when that explicit target exists.
- [ ] Review the complete diff and secret scan. Keep production untouched until an explicit release review; the production command migrates only after its target and operator confirmation are verified.
- [ ] When every gate passes, integrate the reviewed `develop` work into `main` using the agreed repository workflow. Do not force-push or discard preserved WIP.

The local system and smoke checks were run against the existing local Supabase database rather than an empty reset. No staging or production command, hosted database migration, deployment, commit, or push has been performed. The broader route-completion and savings reconciliation workstreams above remain open as documented; passing the current gates does not mean the portal is feature-complete.

## Verification commands

```bash
npm run test:system
npm test
npm run typecheck
npm run lint
npm run build
npm run smoke
```

`npm run smoke` requires the relevant server and accounts to be running. `npm run system:local` may require Docker to be started first. Staging and production commands require their explicit secrets and project refs; no example values should be copied into production.
