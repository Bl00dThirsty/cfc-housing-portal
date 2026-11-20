# Governance Console and Workflow Coverage Plan

## Objective

Bring the existing CFC portal toward a complete, data-backed operating system: expose secure administrative workflows, close role-specific workflow gaps, and provision repeatable local/staging cases for the business stages the database already supports. Preserve the CFC design system, retain equivalent grid/list views, and keep production free of demonstration identities and transactions.

## Guardrails

- Supabase remains authoritative for actors, assignments, capabilities, workflow state, documents, ledgers, and operational records.
- The admin user directory does not expose borrower KYC. Only the assigned, authorized GESTIONNAIRE may inspect or decide KYC.
- Password operations send expiring Auth links; the app never displays, emails, or stores a reusable password.
- SMTP credentials stay in deployment secret storage. UI may show non-secret status and delivery health.
- Every fixture is synthetic, tagged/idempotent, and limited to loopback local or the dedicated staging target. Production seeding stays disabled.
- Do not add records to unsupported business registers just to avoid an empty table. Show a clear empty state until its schema and workflow exist.
- Keep multiple open borrower requests, while enforcing at most one active credit contract once the contract lifecycle exists.

## Work sequence

### 1. Staff account governance

1. Add an admin-only staff directory read model that includes disabled/invited state, active role, agency, last sign-in, and authorized profile-photo URL without returning KYC fields.
2. Add secure staff invitation, profile update, role/agency reassignment, enable/disable, and recovery-link actions. Reuse Auth and audited database RPCs; never use the legacy plaintext-password creation RPC.
3. Add the users route to the ADMIN capability-filtered navigation and build search, role/status filters, metrics, and equivalent card/table modes from one authorized result set.
4. Verify server action authorization, self-disable behavior, invitation/recovery email outcomes, no password leakage, and route access.

### 2. Governance modules

1. [x] Map groups to the existing pole and agency catalogues; manage membership only through effective-dated staff assignments.
2. [x] Add a permissions console over `ref.role`, `ref.capability`, and `ref.role_capability`; drive profile, middleware, navigation, route, server-action, and RLS checks from persisted grants; keep the bootstrap `ADMIN` role locked.
3. [x] Expose process and step editors through guarded RPCs; add audited step ordering. Phase codes remain fixed and display read-only.
4. [x] Correct email authorization to email capabilities; add non-secret provider health, guarded test-send, and delivery review. Environment secrets remain outside the browser.
5. [x] Add the audit stream and readiness view with safe metadata only.

### 3. Phase-aware staff work

1. [x] Link each dossier phase to effective service-document requirements and receiving staff roles/assignments through the persisted document stage and role-policy catalogues.
2. [x] Enforce the same phase, role, dossier assignment, chemise, and document-type rule in the upload action and database policy/RPC.
3. [x] Show stage-eligible upload types and add validation/rejection controls to the shared DUC viewer only when the signed-in role, persisted capability, dossier scope, active phase, requirement, document state, and stage-role policy allow the action.
4. [x] Persist decisions, rejection reasons, and dossier audit events through the atomic decision RPC; notify the borrower after the decision and retain current KYC isolation. Assignment changes already create an in-app notification for the newly assigned manager.

### 4. Local/staging workflow fixtures

1. [~] Extend stable local/staging synthetic cases across KYC/épargne, BET, committee, notary, and disbursement stages. The current local run has 100 dossiers (20 per modeled phase) and 2,656 catalog-driven private synthetic PDFs. Add a formal versioned manifest and closing fixture after the credit lifecycle model is available.
2. [~] Use real catalogues, assignments, savings ledger entries, committee rows, offers, notary instruments, and planned disbursement rows where the current schema supports them. Do not invent repayment or release rows without a credit-contract ledger.
3. Make every fixture idempotent and tagged; print coverage and inserted/updated/skipped counts without exposing secrets.
4. Verify re-seeding does not duplicate actors, assignments, ledger entries, notifications, or documents; verify production rejection.

### 5. UI coverage and completion

1. Preserve the CFC visual system, add focused density and useful detail affordances, and ensure search/filter/sort/selection behave identically in every view mode.
2. Add explicit populated, empty, error, permission-denied, and retry states for all supported modules.
3. Run database tests, targeted component/action tests, typecheck, lint, production build, local bootstrap and fixture coverage checks.
4. Run the Impeccable detector once for changed UI targets; classify inherited font findings separately from regressions.

## Current implementation status

- [x] Staff account directory, invitations, recovery links, profile updates, assignment, activation, and search/list/card views.
- [x] Persisted poles/agencies console with guarded writes and search/list/card views.
- [x] Persisted workflow process/step console, phase reference view, and audited step order.
- [x] Mail provider health, non-secret SMTP/Resend metadata, delivery aggregates, and rate-limited test delivery.
- [x] Correct SYSTAC reconciliation filter; retain existing list/grid controls.
- [x] Add effective permission management for all 12 typed staff roles with a complete capability catalogue, live navigation and route grants, RPC-only database writes, and audited revocations.
- [x] Reconcile local/staging grants with least-privilege KYC, PMO, Audit, and system-administrator boundaries.
- [~] Seed 100 local dossiers across five currently modeled phases (20 per phase), with 98 borrower accounts, 16 staff accounts, 2,656 private synthetic PDF documents, savings ledgers, committee, offer, notary, and planned-disbursement registers. Local data was verified; hosted staging was not seeded in this audit. Report the unmodeled debt-closure phase instead of fabricating repayment rows.
- [x] Add schema-backed stage-specific uploads and review decisions with a reasoned rejection UI; current-phase, requirement, capability, scope, and role policy checks are covered by unit/server-action/component tests and the existing atomic database RPC.
- [ ] Add a versioned seed manifest for supported finance stages.
- [ ] Model credit contract/repayment lifecycle before seeding debt closure and release rows.
- [x] Add metadata-only audit history and live governance/workflow/email readiness indicators, with capability-guarded list/card views.
- [ ] Add persisted external-party directories.

## Completion criteria

- ADMIN can reach every implemented governance page through capability-filtered navigation; non-admin routes/actions are denied server-side.
- Staff invitation and password reset never expose or set a reusable password; every result clearly distinguishes sent, skipped, and failed delivery.
- Disabled accounts can be reactivated without leaving them without an active staff assignment.
- Role edits are not presented as effective until server, middleware, UI, and RLS all use the same database-backed grants.
- Every implemented workflow phase has a persisted local/staging example, with no runtime mock fallback and no production fixture rows.
- Role-specific upload and decision actions are checked against phase, assignment, capability, and data scope at the server/database boundary.

## Status addendum — 2026-11-20

Feature implementation in this plan was assessed against source code, unit
tests, pgTAP and the local smoke matrix. Verified gates: `95 unit-test files passed / 5 skipped; 531 tests passed / 17 skipped; 50 system tests passed / 0 failed`.

Boxes whose deliverable is present in code and covered by a passing test are
marked `[x]`. Boxes recording a historical TDD red-phase run, a commit, or a
hosted release remain `[ ]` **by convention** — the checkbox records the
audit trail, not the existence of the feature. No hosted migration, seed,
commit to main, or Vercel write was performed.

Deferred, with reasons: `/verify` registry lookup (no official registry
connection), credit-contract/repayment lifecycle (no owned model), approval
automation (no signed delegation), full staff lifecycle and new role codes
(no business owner), complete accessibility audit (separate slice).