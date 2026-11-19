# Self-Service Profiles and Avatars Implementation Plan

> **For agentic workers:** Execute inline using the executing-plans skill. Follow the approved feature spec at `docs/superpowers/specs/2026-11-18-self-service-profiles-and-avatars.md`. Work on the current `develop` checkout and preserve all existing worktree changes.

**Goal:** Give every client and staff member safe self-service identity/contact/photo controls, and a reviewed legal-name correction path after KYC submission.

**Execution status:** Implemented on `develop` and verified against the local Supabase database. Hosted Auth settings and rollout checks remain deployment work.

**Architecture:** Keep identity in the existing Auth and role-specific profile records. Add a minimal actor-photo record with private Storage, narrow server mutations, and an assigned-GESTIONNAIRE-only correction workflow. Propagate photos only into people views that already have authorization to read the corresponding actor.

**Tech Stack:** Next.js 15 server components/actions, React, TypeScript, Supabase Auth/Postgres/Storage/RLS, pgTAP, Vitest, existing CFC and shadcn/Radix components.

## Global Constraints

- Supabase Auth owns the confirmed email; email changes require confirmation.
- `staff_assignments` owns staff role and scope; profile actions never write authorization fields.
- KYC state is platform-owned; clients cannot change submitted legal names without assigned-manager review.
- Client profile and latest non-deleted dossier copies change atomically.
- Client avatars remain private and visible only to their owner and currently assigned GESTIONNAIRE.
- Do not use demo identities, mock profile records, public client-photo URLs, or service-role credentials in browser code.
- Preserve CFC visual tokens, existing route groups, and current uncommitted work.

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/<timestamp>_profile_self_service.sql` | Media and correction tables, policies, private bucket, narrow RPCs, confirmed-email synchronization, audit and notification transitions. |
| `supabase/tests/profile_self_service.test.sql` | Database ownership, state guard, and assigned-review access cases. |
| `src/server/actions/profile.ts` | Session-derived profile updates, correction request/review, media metadata, and email-change request result. |
| `src/server/actions/profile.test.ts` | Server-action validation and caller-identity cases. |
| `src/server/auth/profile.ts` | Server-side current-user profile and own-avatar projection. |
| `src/lib/auth-data.ts` and `src/lib/auth-context.tsx` | Shared avatar URL shape and browser identity refresh. |
| `src/components/profile/profile-editor.tsx` | Editable contact/photo controls and client correction request. |
| `src/components/profile/profile-panel.tsx` | Shared read-only authorization details plus editor entry point and photo. |
| `src/app/portail-cfc/(console)/profil/page.tsx` and `src/app/portail-client/profil/page.tsx` | Pass server-derived editability, role, KYC, and avatar state into the shared panel. |
| `src/server/queries/staff-dossiers.ts` | Authorized client avatar projection for staff dossier views. |
| `src/components/layout/user-menu.tsx`, `src/components/portail-cfc/admin-sidebar.tsx`, and existing client-card/detail components | Render stored photos with initials fallback. |
| Existing KYC action and assigned-manager dossier review component | Enforce submitted-name lock and render correction decisions. |

## Task 1: Database ownership and image boundaries

**Files:** migration, pgTAP file.

- [ ] Add a failing pgTAP ownership matrix covering client owner, assigned GESTIONNAIRE, unassigned GESTIONNAIRE, another client, same-agency staff, and wrong-region staff.
- [ ] Add `actor_profile_media` with `actor_id` FK/PK, private object path, and audit timestamps; enable and force RLS.
- [ ] Add the private `profile-avatars` bucket with raster MIME allowlist and bounded upload size.
- [ ] Add Storage insert/update/delete policies for the owner path and read policy using the same actor-visibility predicates as profile data.
- [ ] Add correction-request table with status/reviewer fields, RLS, and a partial unique index permitting one pending request per citizen.
- [ ] Add narrow self-profile and correction-request database functions. Derive actor from `auth.uid()`; use a restricted search path; grant only required execution.
- [ ] Add a database guard that rejects direct client legal-name changes after KYC submission, including changes through `saveKycDraftAction`.
- [ ] Add a confirmed Auth email synchronization trigger for citizen profile and non-deleted dossier email copies.
- [ ] Run the migration and pgTAP file against the local Supabase stack only. Do not link or mutate staging/production.

## Task 2: Session-derived profile actions and auth projection

**Files:** `src/server/actions/profile.ts`, action tests, `src/server/auth/profile.ts`, `src/lib/auth-data.ts`, `src/lib/auth-context.tsx`.

- [ ] Write failing action tests for unauthorized session, staff/client self-update, forbidden role/agency fields, phone normalization, name correction eligibility, and pending email state.
- [ ] Implement `updateOwnProfileAction(input: { fullName: string; phone: string })` with a discriminated result `{ ok: true; message: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }`.
- [ ] Implement create/read/decide actions for name correction; never accept the reviewer actor ID from the browser.
- [ ] Implement avatar metadata set/remove actions; validate object path belongs to current actor and let Storage RLS enforce object access.
- [ ] Use Supabase Auth's authenticated email update flow; show a pending confirmation result and do not write the proposed email into profile/dossier tables.
- [ ] Extend `AuthProfile` and `AdminUser` with `avatarUrl: string | null`; resolve only the current actor's own photo in the auth context using Storage RLS and a short-lived URL.
- [ ] Refresh server and browser profile state after successful edits; do not cache signed URLs as durable records.

## Task 3: Shared profile editor and account photos

**Files:** shared profile components, client/staff profile pages, user-menu/sidebar, Vitest component files.

- [ ] Write failing component cases for save/cancel, accessible field errors, photo fallback, pending email confirmation, and staff authorization fields remaining read-only.
- [ ] Call `npx shadcn@latest docs avatar field input dialog` before changing UI composition; reuse existing installed components.
- [ ] Add a keyboard-accessible editor with name/phone fields, image preview/progress/replace/remove, and explicit save feedback.
- [ ] Display email confirmation state without replacing the current Auth email early.
- [ ] Display submitted client legal name as read-only and show the request form, pending status, reviewer result, and history.
- [ ] Add `AvatarImage` to profile header, user menu, and staff sidebar, retaining the existing initials fallback.
- [ ] Preserve the existing CFC styling and check mobile layout at narrow viewports.

## Task 4: Authorized avatar projection and reviewer workflow

**Files:** dossier query, people views, assigned-manager review UI, associated tests.

- [ ] Write failing query/component cases for authorized client photo display and initials fallback when photo access is absent.
- [ ] Batch-load visible avatar metadata for staff dossier rows and sign URLs through the authenticated Storage client; never use admin Storage signing without a separate explicit authorization check.
- [ ] Render client photos in dossier list, Kanban, workspace, and detail surfaces only where their current client row is already readable.
- [ ] Add correction-request status/action UI for the assigned GESTIONNAIRE on the relevant dossier/KYC view.
- [ ] On approval, update citizen profile and latest non-deleted dossier name, close request, and append the dossier event atomically. On rejection, preserve the current name and require an explanation.
- [ ] Ensure stale/unassigned reviewers cannot decide after a dossier reassignment.

## Task 5: Verification and documentation

- [ ] Run targeted Vitest suites for profile actions, profile components, existing KYC draft flow, and affected client/staff avatar views.
- [ ] Run `supabase test db --local` and confirm the profile ownership matrix passes.
- [ ] Run `npm run typecheck` and `npm run lint`.
- [ ] Review `git diff` and `git status` to ensure existing worktree changes and `.tmp-build-check` remain intact.
- [ ] Update the feature spec with implementation status, migrations, verified commands, and any deployment-only Auth configuration note.
- [ ] Do not deploy to, seed, or migrate any hosted project as part of this implementation.

## Execution notes

The product owner approved inline implementation. This checkout is already on `develop`, and the user explicitly asked to preserve its existing WIP; do not create a worktree from only committed state or reset/stash the current work. The newly requested borrower request register is a separate design and implementation plan so it does not expand this profile feature's migration or approval boundary.

## Local execution record

- Forward-only local migrations: profile self-service, audit-column compatibility, exact-DUC KYC submission, and multi-request legal-name consistency.
- `supabase/tests/profile_self_service.test.sql`: 27 assertions passed locally.
- `src/server/actions/profile.test.ts`: 4 action tests passed. `npm run typecheck` and `npm run lint` pass after the feature integration.
- No hosted migrations, Auth setting changes, commit, or push were performed. Verify full Vitest/build results in the borrower-request plan's final execution record.
