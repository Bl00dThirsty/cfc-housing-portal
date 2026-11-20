# CFC Implementation Plans

## Status audit — 2026-11-20

Each plan was checked against the current code, passing tests, local Supabase records, and the authenticated local smoke run. Checkboxes mark implementation and verification that have evidence. Historical red-phase runs remain unchecked when their output was not retained; commits and hosted releases remain open unless the plan says otherwise.

| Plan | Status | Evidence and remaining work |
|---|---|---|
| [Interactive dossier tracking](2026-11-12-interactive-tracking-drawer.md) | Core implemented and locally verified | Tracking detail, per-step history, clickable steps; covered by current unit tests and smoke. TDD red-phase and commit boxes remain open. |
| [Role-aware header](2026-11-12-role-aware-header.md) | Core implemented and locally verified | Shared CFC header, role actions, client and staff shells; current smoke confirms both contexts. TDD red-phase and commit boxes remain open. |
| [Shared data-table engine](2026-11-12-shared-data-table-engine.md) | Partial | Pure engine, store, hook, table, toolbar, savings passbook, and email tables exist. Client directory, analytics tabs, and most staff tables still need migration. |
| [Signup, KYC, and onboarding](2026-11-12-signup-kyc-onboarding-journey.md) | Core flow implemented; one planned demo superseded | Signup, four-step KYC, service selection, document upload, and tracking pass local checks. The old `/dev/demo` panel is replaced by guarded, database-seeded local/staging fixtures to avoid runtime mock data. |
| [Toast layer](2026-11-12-toast-layer.md) | Partial | Root toaster, action feedback, and real-time notification/chat foundations are present. Logout feedback and complete write-action coverage remain open. |
| [Borrower request management](2026-11-18-borrower-request-management.md) | Core implemented and locally verified | Multiple request portfolio, request-specific detail/actions, ownership-scoped transitions, and 21 pgTAP assertions pass. Query edge-case coverage and lifecycle fixtures such as withdrawal remain open. |
| [Self-service profiles and avatars](2026-11-18-profile-self-service.md) | Partial | Own profile edits, private avatar storage, KYC name guard/correction actions, and 27 pgTAP assertions pass. Staff/client avatar projections and the assigned-manager correction decision UI remain open. |
| [System bootstrap and completion roadmap](2026-11-18-system-bootstrap.md) | In progress | Local/staging/production command boundaries, password template, assignment, seed, cache recovery, and governance groundwork exist. The broad runtime mock audit, finance workflows, empty-database replay, staging release, and route-level UI/accessibility work remain open. |
| [Governance and stage fixtures](2026-11-19-governance-and-stage-fixtures.md) | In progress | Governance modules, stage-aware upload enforcement, and the DUC validation/rejection UI are implemented. The local seed has 100 dossiers across five modeled phases, 98 borrower accounts, 16 staff accounts, and 2,656 private synthetic PDFs. The versioned manifest, credit closure, and external-party directories remain open. |
| [Unverified approval thresholds](2026-11-19-unverified-approval-thresholds.md) | Implemented; local assertion passes | Unsupported rows are absent from the repeatable seed and retired by a forward-only migration. The expected pre-fix failure was not recorded; local test and final diff check pass. |

## Verification recorded in this audit

- `npm test`: 95 files passed / 5 skipped, 531 tests passed / 17 skipped (2026-11-20 reconciliation verification).
- `npm run test:system`: 50 passed, 0 failed.
- `npm run typecheck`, `npm run lint`, and `npm run build`: passed (2026-11-20).
- Stage-decision coverage: 5 domain-policy cases, 2 server-action cases, and 2 UI cases pass; rejection requires a reason and the review actions use the existing atomic database decision RPC.
- Authenticated local smoke: 77/77 passed after correcting stale role and request-selection expectations.
- Local seed repeat: 100 dossiers, 2,656 demo document rows and Storage objects, 100 active assignments, 100 assignment notifications, and no duplicate dossier/document-type rows.
- Local profile pgTAP: 27 assertions passed. Borrower request pgTAP: 21 passed. Approval-threshold pgTAP: 1 passed.

The local Supabase stack and temporary Next.js server were stopped after verification. No hosted migration, hosted seed, commit, or push was performed.

Per-plan evidence addenda: 2026-11-20. Checkboxes record implementation and
verification evidence, with TDD-red/commit/hosted boxes intentionally open.