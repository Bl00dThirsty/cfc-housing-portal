# Borrower Request Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a borrower create, follow, and manage several concurrent loan requests with per-dossier data and authorization.

**Execution status:** Core implementation is on `develop`. The portfolio/detail UI, explicit-ID actions and KYC flow, forward migrations, request-scoped notification dispatch, and local E2E journey are implemented. See the spec's implementation record and the final verification results below; broader mock-data cleanup is tracked separately.

**Architecture:** Keep `dossiers` as the request aggregate. Add an RLS-scoped request portfolio and request detail route; pass an explicit dossier ID through every onboarding mutation and query; reuse submitted actor-level KYC for new dossiers; use existing regional assignment, audit, and notification RPCs with the explicit target.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase SSR/Postgres/RLS, shadcn UI primitives, Vitest, pgTAP.

## Global Constraints

- Preserve the current CFC visual system and shadcn component conventions.
- Read product, document, process, agency, and staff data from Supabase; never use mock request/advisor/catalogue records in UI code.
- Derive the actor ID from the authenticated server session and verify ownership of every dossier ID.
- Do not mutate hosted Supabase projects or push/merge code during this plan.
- Do not reset the local database; apply only the new forward migration after reviewing the local migration state.
- New SQL uses explicit dossier IDs and retains existing audit/event/notification behavior.

---

### Task 1: Add domain tests for request lifecycle and agency routing

**Files:**
- Create: `src/domain/entities/borrower-request.test.ts`
- Create: `src/domain/entities/borrower-request.ts`

**Interfaces:**
- Produce `BorrowerRequestStatus`, `BorrowerRequestCardModel`, `canWithdrawBorrowerRequest(state)`, and `selectAgencyForBorrower(agencies, region, isDiaspora, routableRegions)`.
- Agency selection receives persisted agency/active-manager data; it must never invent an agency or advisor.

- [ ] Write failing tests for a draft, paused, under-review, active, and closed request card; `canWithdrawBorrowerRequest` is true only for `kyc`, `service`, or `documents`; region normalization selects a real agency whose region has an active manager; no candidate returns `null`.
- [ ] Run `npx vitest run src/domain/entities/borrower-request.test.ts` and confirm failures are missing exports/behavior.
- [ ] Implement the minimum domain types and deterministic mapping functions.
- [ ] Re-run the focused test and confirm all lifecycle/routing cases pass.

### Task 2: Add an RLS-scoped portfolio read model and tests

**Files:**
- Create: `src/server/queries/borrower-requests.ts`
- Create: `src/server/queries/borrower-requests.test.ts`
- Modify: `src/server/queries/citizen-space.ts`

**Interfaces:**
- `listBorrowerRequests(userId: string)` returns owned request summaries ordered by updated/created time and resolves service labels from `referenceView("service")`.
- `getCitizenSpace(userId: string, dossierId?: string)` reads exactly `dossierId` when provided and preserves latest-request compatibility only when omitted.

- [ ] Write tests for mapping multiple requests, null service catalogue rows, and no fallback to another dossier when an explicit ID is supplied.
- [ ] Run the focused tests and confirm they fail for the expected absent query behavior.
- [ ] Implement explicit filters and database-backed label resolution; surface query errors instead of substituting examples.
- [ ] Run focused tests and existing `citizen-space` tests.

### Task 3: Add explicit-ID onboarding server-action tests

**Files:**
- Create: `src/server/actions/borrower-requests.test.ts`
- Modify: `src/server/actions/onboarding.test.ts` or existing `src/server/actions/onboarding.e2e.local.test.ts`
- Modify: `src/server/actions/onboarding.ts`

**Interfaces:**
- `startBorrowRequestAction(): Promise<{ok:true; dossierId:string; dossierCode:string}|{ok:false; error:string}>`
- `saveServiceAction(serviceCode: string, dossierId: string)`
- `setPriorClientCaseAction({priorClientCase, dossierId})`
- `submitServiceApplicationAction(dossierId)`
- `withdrawBorrowRequestAction(dossierId)`
- `loadOnboardingDraft(dossierId?: string)` and `loadOnboardingState(dossierId?: string)`

- [ ] Write tests that authenticate through session-derived citizen ID, reject an unowned dossier, pass the exact dossier ID through each action, and reuse the initial incomplete KYC request while creating a distinct request for an already-KYC-submitted borrower.
- [ ] Run focused tests and verify expected failures before implementation.
- [ ] Implement safe request creation from owned profile/KYC data and a live agency/manager catalogue; preserve the CFC DUC sequence and return a controlled error if no regional assignment route exists.
- [ ] Change onboarding query/mutation helpers to use the requested ID, never `order(...).limit(1)` when an explicit ID is given.
- [ ] Run action tests and existing onboarding action tests.

### Task 4: Add explicit-target database transitions and pgTAP tests

**Files:**
- Create using `npx supabase migration new borrower_request_management`: the generated `supabase/migrations/<timestamp>_borrower_request_management.sql`
- Create: `supabase/tests/borrower_request_management.test.sql`
- Modify: `src/server/actions/onboarding.ts`

**Interfaces:**
- Replace latest-dossier RPCs with `set_prior_client_case(p_dossier_id uuid, p_case text)` and `submit_service_application(p_dossier_id uuid)`.
- Add an ownership-checked `withdraw_borrower_request(p_dossier_id uuid)` RPC that closes only a caller-owned draft and writes a `REQUEST_WITHDRAWN` dossier event atomically.
- Retain `private.assign_dossier_to_manager(p_dossier_id)` for assignment, history, and in-app staff notification.

- [ ] Add pgTAP assertions for multiple borrower dossiers, cross-owner denial, explicit-ID transitions, draft-only withdrawal, audit event retention, and notification/assignment behavior.
- [ ] Run the SQL test against the current local schema before adding migration changes and confirm it fails on the missing explicit-ID RPC behavior.
- [ ] Generate the migration filename via the Supabase CLI; add secure SQL functions with `auth.uid()` ownership checks, `FOR UPDATE`, restricted grants, and no public security-definer API.
- [ ] Run `npx supabase migration up --local` only after inspecting `npx supabase migration list --local`; do not run `db reset`.
- [ ] Run the focused pgTAP suite using the command shown by `npx supabase test db --help` and verify expected access controls.

### Task 5: Support repeat applications using verified KYC

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/onboarding/onboarding-wizard.tsx`
- Modify: `src/components/onboarding/service-picker.tsx`
- Modify: `src/components/onboarding/service-documents.tsx`
- Modify: `src/domain/entities/onboarding.ts`
- Modify: `src/server/actions/kyc-profile.ts`

**Interfaces:**
- Onboarding accepts a selected dossier ID and a server-derived `kycSubmitted` flag.
- The wizard omits the KYC step for previously submitted KYC and starts at service selection for a new request.
- KYC mutations retain actor-level identity but write request-specific copies only to the explicit dossier when one is provided.

- [ ] Add tests for a submitted KYC borrower resuming service selection without invoking KYC submission and an incomplete first request still opening the KYC wizard.
- [ ] Run the focused tests and observe failure.
- [ ] Implement route parsing/ownership checks and the KYC-step filtering without allowing clients to override `kycSubmitted`.
- [ ] Pass dossier IDs to service, prior-case, and submit actions and keep document uploads bound to that same ID.
- [ ] Run focused tests, the existing onboarding component tests, and onboarding local integration tests.

### Task 6: Build the client request portfolio and detail workspace

**Files:**
- Create: `src/app/portail-client/demandes/page.tsx`
- Create: `src/app/portail-client/demandes/[id]/page.tsx`
- Create: `src/components/portail-client/borrower-request-list.tsx`
- Create: `src/components/portail-client/borrower-request-card.tsx`
- Modify: `src/app/portail-client/page.tsx`
- Modify: `src/components/portail-client/client-header.tsx`
- Modify: `src/components/portail-client/onboarding-waiting.tsx`

**Interfaces:**
- Portfolio route renders data returned by `listBorrowerRequests` and a new-request action.
- Detail route calls `getCitizenSpace(userId, id)`, returns not-found for unauthorized/missing IDs, and reuses request-aware dashboard, timeline, checklist, upload, and support components.
- Existing `/portail-client` remains a landing/most-recent request view with a route to all requests.

- [ ] Write component tests for zero state, multiple active cards, status badges, CTA destinations, and accessible progress labels.
- [ ] Run focused tests and confirm the components are missing.
- [ ] Implement compact CFC-style cards with DUC, catalogue service label, persisted state, progress/phase, dates, and next action.
- [ ] Add a request-specific workspace and details links; anchor support and document upload to its dossier ID.
- [ ] Add an accessible confirmation dialog for draft withdrawal and explain that retained history remains available.
- [ ] Run component tests and the local borrower E2E journey.

### Task 7: Document, seed, and verify the end-to-end lifecycle

**Files:**
- Modify: `docs/superpowers/specs/2026-11-18-borrower-request-management.md`
- Modify: `docs/superpowers/plans/2026-11-18-borrower-request-management.md`
- Modify local/staging-only seed fixtures under `supabase/` after auditing existing seed behavior.
- Modify/add: `src/server/actions/borrower-requests.e2e.local.test.ts`

- [ ] Add local/staging database fixtures for first request, multiple concurrent requests, paused, submitted with missing pieces, active, and withdrawn cases without adding demo rows to production setup.
- [ ] Run `npx vitest run` for changed features, `npm run typecheck`, and focused `npm run lint -- <changed files>`.
- [ ] Run the complete local request journey against the running local Supabase stack without resetting its data.
- [ ] Review `git diff --check`, verify no mock request/advisor fixture is imported into production UI, and update the spec/plan with executed results and remaining cross-cutting roadmap items.
- [ ] Do not commit, push, or run production/staging migrations in this implementation pass.

## Plan self-review

- Spec coverage maps to Tasks 1–7: request-state and routing rules, query isolation, action isolation, atomic database transitions, KYC reuse, portfolio/detail UI, data fixtures, and verification.
- No placeholder implementation details are used; CLI-generated migration names are intentional because Supabase owns the timestamp format.
- Types remain consistent across tasks: every request mutation accepts an explicit `dossierId`, the optional onboarding draft ID exists only for the registration flow, and the server derives KYC submission state.

## Local execution record

- Local database migrations: request management, exact-DUC KYC submission, and multi-request profile consistency were applied without resetting the database.
- Local database tests: borrower request management, 21 assertions passed; profile self-service, 27 assertions passed.
- Local Supabase E2E: `src/server/actions/onboarding.e2e.local.test.ts`, 2 tests passed. It exercises signup, exact request ID resume, KYC, service selection, prior-client state, event/notification persistence, and reload.
- Request UI/action coverage: borrower request action tests, 6 passed; portfolio tests, 3 passed, including concurrent independent requests.
- `npm test`: 448 passed, 17 intentionally skipped across local SMTP/Supabase-only suites. `npm run test:system`: 40 passed. `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- The pinned Next Google-font loader failed against Google's new query-based font URLs. The same Plus Jakarta Sans variable font is now self-hosted from the upstream WOFF2 subsets under its OFL license; production build passes without a build-time external font fetch.
- `git diff --check` passes; only Git's existing LF-to-CRLF worktree notices remain. `.tmp-build-check` is absent.
- No commit, push, hosted migration, or hosted seed was performed. `.tmp-build-check` is expected to remain absent and is checked during final cleanup verification.
