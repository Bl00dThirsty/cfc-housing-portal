# Upstream UI Reference and Local Workflow Gap Audit

## Revalidation — 2026-11-20

**Current local source:** `develop` at `d4c4510aef3d6619681588ddd53225f8b6fa8e98` (`feat: Implement document upload atomicity and workflow controls`), with uncommitted WIP present. **Upstream `main`:** `6fc5cf12d5ec211a7440126d281a75a3d8a81c2d` (`chore(release): version 1.6.3`). Reference feature snapshots remain the commits in the table below. The current upstream `main` tree still contains the legacy `/admin` actors and client workspace, including the prototype client data module; it is a useful UI reference, not the current data model.

This pass rechecked the older gap statements against the current dirty checkout. Staff intake is implemented in code, but the current smoke script has no intake-specific assertion; the client-detail edit remains open:

| Earlier finding | Current evidence | Status |
|---|---|---|
| Staff Guichet had no create-intake action. | `src/app/portail-cfc/(console)/clients/page.tsx` fetches `getStaffIntakeOptions()` when `dossier:create` is granted; `src/components/portail-cfc/dossier-queue-view.tsx` renders `StaffIntakeDialog`; `src/components/portail-cfc/staff-intake-dialog.tsx` calls the persisted `createStaffIntakeAction`. The current `scripts/smoke.mjs` has no intake-specific assertion. | **Implemented; add direct action-level verification before marking fully done.** |
| Client detail had no edit affordance. | `src/app/portail-cfc/(console)/clients/[id]/_components/client-detail-view.tsx` still has only a comment mentioning “Edit Button”; there is no edit button/form or persisted staff profile update action in this view. Self-service profile edits are a separate supported flow. | **Still open.** Keep borrower self-service distinct from a staff-managed, field-authorized KYC correction/edit flow. |

### Current UI and role-workspace findings

- **View toggles are present on the main registries.** The current borrower register has cards/table (`src/components/clients/table/clients-table.tsx`); the staff dossier queue, DUC, operational register, and audit directory have grid/list controls (`src/components/portail-cfc/dossier-queue-view.tsx`, `src/app/portail-cfc/(console)/clients/_components/client-duc-manager.tsx`, `src/components/portail-cfc/operational-register-view.tsx`, `src/components/settings/admin-audit-directory.tsx`). The request to add views should therefore be applied to uncovered role workspaces and the savings ledger where a compact view helps, rather than duplicating controls everywhere.
- **Persisted operational surfaces coexist with explicit schema gaps.** Five routes still return `PersistenceNotice`: promoter directory and profile, BET/expert directory, notary directory, recovery, and subsidies. Their old upstream counterparts contain illustrative records; they are not a source of rows to reseed. Add a persisted domain model, access rules, lifecycle actions, and local fixtures before replacing these notices with operational lists.
- **The local mobile-money route is a persisted register.** `src/app/portail-cfc/(console)/actors/agency/mobile-money/page.tsx` calls the `mobile-money` operational register over savings transactions. The upstream `[id]` detail route is not mirrored. Confirm whether the current read model supports a transaction detail/history route before adding one; do not copy the old static `data.ts`.
- **Stage-aware document upload authorization now exists locally.** `listDossierDocumentTypes()` joins the dossier’s current phase to configured document stages, service requirements, and role upload policy; the `dossier_documents` insert policy calls `private.can_act_on_document(...)` to enforce the current service requirement, phase, chemise, role capability, and dossier scope at the database boundary. This closes the older “upload type is not stage-aware” finding. Continue checking each role’s upload/review surface and its required/optional, missing/rejected, and reason states. The upstream DUC’s `customFiles` and audit-log state are component state, and its upload dialog preselects hard-coded folder/issuer/status values; it is not a replacement for local policy.
- **The DUC review surface was completed in the 2026-11-20 working changes.** The private viewer now requests decision options from active service requirements, phase mapping, current actor grants/scope, and stage-role policy, then offers only permitted validate/reject actions. Rejection requires a reason; the existing database RPC rechecks authorization and writes the decision/event atomically. This closes the shared DUC decision-affordance gap; other role-specific workspaces still need their own route-by-route audit.
- **Credit/finance interaction coverage is uneven.** The upstream client workspace has a savings passbook, transaction dialog, and editable Kanban prototype. The local savings ledger is persisted, while the local “Kanban” is a dossier stage map derived from configured phases and the latest persisted dossier event, not an editable task board. Keep those semantics clear. Every finance role action still needs to map to a persisted transition, and the credit repayment/closure lifecycle must exist before seeding “closed” dossiers. A visual action in an upstream page does not prove that the action is a valid CFC business operation.
- **Prototype evidence is concrete.** At `upstream/feature/client-details-nike-redesign-dedicated-pages` (`a832f368aaca76bd6f0713e042e9fde49eacffac`), the client detail imports `clientsData`, chooses the first record as fallback, and keeps edits in React state; the client creation dialog reads/writes `clientsData`; DUC upload has local `customFiles`; Kanban tasks/comments are local; and the passbook is marked “no backend” in its source. The actor snapshot `upstream/feature/admin-actors-analytics` (`0033d1d53ce3995fb4d152964c4887403b525b27`) includes many actor pages, but the existence of a route is not evidence of durable CRUD, role authorization, or a supported lifecycle.

### Revalidation decision

Use the upstream layouts as an interaction inventory: dedicated details, purposeful filters, denser registers, card/table or grid/list choices, and clear queue-to-detail navigation. Restore each interaction only over the current Supabase read models and authorized server actions. For role completeness, audit the route against its assigned queue, current-stage evidence, allowed decision/upload action, event history, and empty/error/denied states. Do not convert a `PersistenceNotice` into a table of hard-coded example records. The seeded local dataset may populate only lifecycles already supported by schema and server actions; unsupported closure, arrears, subsidy, promoter, BET, or notary-directory data remain explicit model gaps.

**Original audit:** 2026-11-19
**Original local checkout:** `develop` at `fbc70cb06765c1832b46fe370011411b9cff5a75`, with uncommitted WIP present then
**Reference:** `Bl00dThirsty/cfc-housing-portal`; `upstream/main` at `6fc5cf12d5ec211a7440126d281a75a3d8a81c2d` plus the feature snapshots listed below.

This is a source comparison, not a pixel-perfect visual review. The older upstream screens contain useful interaction ideas, but many displayed records and actions are browser-only fixtures. They are evidence for UI coverage, not a safe data or authorization implementation to copy.

## Reference snapshots

| Area | Commit | Reference source |
|---|---|---|
| Role-oriented actor registers | `0033d1d53ce3995fb4d152964c4887403b525b27` | [admin actor pages](https://github.com/Bl00dThirsty/cfc-housing-portal/tree/0033d1d53ce3995fb4d152964c4887403b525b27/src/app/admin/actors) |
| Client detail and edit UI | `a832f368aaca76bd6f0713e042e9fde49eacffac` | [client detail components](https://github.com/Bl00dThirsty/cfc-housing-portal/tree/a832f368aaca76bd6f0713e042e9fde49eacffac/src/app/admin/clients) |
| Savings passbook | `473472420b0f90c1abeedea2c9b23331578b4d31` | [passbook component](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/473472420b0f90c1abeedea2c9b23331578b4d31/src/app/admin/clients/_components/client-savings-passbook.tsx) |
| Client workspace, DUC, Kanban | `856b3602b63472f31508584923c3931d5032a02a` | [workspace components](https://github.com/Bl00dThirsty/cfc-housing-portal/tree/856b3602b63472f31508584923c3931d5032a02a/src/app/admin/clients/_components) |
| Real-document UI experiment | `b992db8e54be0c65ac2cfd00175c6ce9a963fade` | [DUC upload/viewer components](https://github.com/Bl00dThirsty/cfc-housing-portal/tree/b992db8e54be0c65ac2cfd00175c6ce9a963fade/src/app/admin/clients) |
| Guichet filters/details | `17e262e9c503268de2bfd3484036ac3a7fad96ad` | [Guichet implementation](https://github.com/Bl00dThirsty/cfc-housing-portal/tree/17e262e9c503268de2bfd3484036ac3a7fad96ad/src/app/admin) |
| Login and role navigation | `f8acd037d1da3bd981a7eddf0a851c75abaefa08` | [RBAC/sidebar implementation](https://github.com/Bl00dThirsty/cfc-housing-portal/tree/f8acd037d1da3bd981a7eddf0a851c75abaefa08/src) |

The legacy reference uses `/admin/...`; the local application has moved the corresponding staff surfaces under `/portail-cfc/...`.

## Findings

### 1. Borrower detail has a real interaction gap

The upstream client detail has a dedicated edit form with separate identity, financial, technical, and legal sections. Its `client-edit-form.tsx` exposes role-based field groups. The current local detail route is database-backed and correctly limits full KYC to the assigned `GESTIONNAIRE`; it has the tabs and barcode summary, but the current `client-detail-view.tsx` has no edit control or edit form. The only nearby edit affordance is a comment naming an “Edit Button.”

The reference form saves only to component state (`onSave(formData)`) and its role checks are hard-coded in the browser. Rebuild the missing workflow with persisted, field-specific server actions and database authorization. Keep borrower self-service in `/portail-client/profil`; keep KYC fields unavailable to system administrators and non-assigned staff.

Sources: [upstream edit form](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/a832f368aaca76bd6f0713e042e9fde49eacffac/src/app/admin/clients/%5Bid%5D/_components/client-edit-form.tsx); local `src/app/portail-cfc/(console)/clients/[id]/_components/client-detail-view.tsx:114`; local `src/app/portail-cfc/(console)/clients/[id]/page.tsx`.

### 2. Staff intake creation is implemented in the current local checkout

The upstream client area includes `client-creation-dialog.tsx`. The current local `/portail-cfc/clients` route fetches intake options when `dossier:create` is granted and passes them to `DossierQueueView`; the queue renders `StaffIntakeDialog`, whose submit action calls the persisted `createStaffIntakeAction`. This supersedes the 2026-11-19 finding that staff lacked intake creation. The overall authenticated smoke is recorded in `docs/superpowers/plans/README.md`, but `scripts/smoke.mjs` does not assert the intake action itself, so the plan should retain an action-level verification checkbox. Do not replace it with the legacy array-backed client dialog.

The persisted Guichet intake implementation closes the UI and data-flow gap; action-level verification remains open.

Source: [upstream creation dialog](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/a832f368aaca76bd6f0713e042e9fde49eacffac/src/app/admin/clients/_components/client-creation-dialog.tsx); local `src/app/portail-cfc/(console)/clients/page.tsx`, `src/components/portail-cfc/dossier-queue-view.tsx`, `src/components/clients/table/clients-table.tsx`.

### 3. The DUC is safer locally, with one workflow affordance still absent

The older `client-draggable-docs.tsx` offered drag reordering, add, delete, preview, and download controls. Its ordering and add/delete operations only changed React state; adding a file generated a random reference and did not upload a real document. The current local DUC is connected to the document store, provides list and grid views, search, category filtering, upload, and preview. It does not currently persist a manual document order.

Keep the real storage pipeline. If ordering is needed by document review, persist an explicit sort/order field and audit the change. Do not restore fake add/delete controls over immutable document facts; use version/supersede or a reasoned lifecycle action instead.

Sources: [upstream draggable document list](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/a832f368aaca76bd6f0713e042e9fde49eacffac/src/app/admin/clients/%5Bid%5D/_components/client-draggable-docs.tsx); local `src/app/portail-cfc/(console)/clients/_components/client-duc-manager.tsx:129`, `src/app/portail-cfc/(console)/clients/_components/duc-upload-dialog.tsx`, and `src/server/storage/upload.ts`.

### 4. Stage-aware document upload authorization is implemented; role surfaces still need review

The current local `listDossierDocumentTypes()` maps the dossier’s current phase to document stages, filters service requirements, and applies configured role upload policy. The migration `supabase/migrations/20261119153000_document_stage_authorization.sql` adds `private.can_act_on_document(...)`; the insert policy checks current requirement, phase, chemise, role capability, and dossier scope at the database boundary. This supersedes the 2026-11-19 finding that upload was only capability/chemise-aware.

Continue auditing each role’s actual workspace for required/optional, missing/rejected, and review-reason states. The upstream prototype does not establish a valid CFC policy.

At audit time, the local active grants included `document:upload` for `GUICHET`, `GESTIONNAIRE`, `RISQUES_BET`, `NOTAIRE`, `DIASPORA`, `ADMIN`, and `CITIZEN`; `COMITE`, `PMO`, `ANALYSTE`, `RECOUVREMENT`, `ARCHIVISTE`, and `AUDIT` did not have it. This is not by itself proof that the latter roles should upload; the matrix needs an approved role-by-stage assignment. `ANALYSTE` and `ARCHIVISTE` had document validation grants, which also needs an explicit lifecycle/workspace mapping.

Sources: local `src/server/storage/upload.ts:188-208,683-695`, `src/domain/policies/chemise.ts:119`, `supabase/migrations/20260101000005_ref_products.sql:75-99`, and the local `ref.role_capability` query. This stage gap is not fixed by the legacy upstream upload dialog, which is UI-only.

### 5. Several actor screens are intentionally empty, but the role workspaces are therefore incomplete

The following local routes show `PersistenceNotice` instead of a working register:

| Local route | Current reason |
|---|---|
| `/portail-cfc/actors/agency/promoters` and `[id]` | No persisted promoter/programme/convention directory |
| `/portail-cfc/actors/risk-engineering/directory` | No persisted BET/expert directory |
| `/portail-cfc/actors/notary-cadastre/directory` | No persisted notary directory |
| `/portail-cfc/actors/disbursements/recovery` | No debt/arrears case lifecycle |
| `/portail-cfc/actors/disbursements/subsidies` | No subsidy/bonification register |

These notices correctly avoid claiming fake records are real. The reference pages provide useful density, filters, KPI placement, and record-details patterns, but hard-code sample BET firms, named borrowers, overdue balances, recovery status, promoter inventory, and calculated KPI strings directly in client components. Build these modules over persisted register schemas and test fixtures before treating them as operational. At minimum, role workspaces need an honest queue, stage actions, due documents, history, and detail route; a static-looking table with invented rows would be misleading.

Sources: upstream [BET directory](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/0033d1d53ce3995fb4d152964c4887403b525b27/src/app/admin/actors/risk-engineering/directory/page.tsx), [recovery register](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/0033d1d53ce3995fb4d152964c4887403b525b27/src/app/admin/actors/disbursements/recovery/page.tsx), and [promoter register](https://github.com/Bl00dThirsty/cfc-housing-portal/blob/0033d1d53ce3995fb4d152964c4887403b525b27/src/app/admin/actors/agency/promoters/page.tsx); local route files under `src/app/portail-cfc/(console)/actors/`.

### 6. A mobile-money detail route exists upstream and not in the local route tree

The reference has `/admin/actors/agency/mobile-money/[id]` and list/detail support. The current build exposes `/portail-cfc/actors/agency/mobile-money` without an `[id]` route. Confirm whether the underlying mobile-money reconciliation/partner model is supported. If it is, restore a persisted detail page with audit/history; if not, retain a truthful notice instead of importing the upstream static `data.ts` records.

Source: upstream `src/app/admin/actors/agency/mobile-money/[id]/page.tsx` at `a832f368aaca76bd6f0713e042e9fde49eacffac`; local route tree under `src/app/portail-cfc/(console)/actors/agency/mobile-money/`.

### 7. View-mode coverage is broader locally than the old reference, but not universal

Current local list/card or list/grid controls are present in the borrower register, DUC, dossier queue, operational registers, and staff/group/role/workflow/audit directories. Actor registers reuse `OperationalRegisterView`, so they inherit its view switch. Relevant references: `src/components/clients/table/clients-table.tsx:116`, `src/app/portail-cfc/(console)/clients/_components/client-duc-manager.tsx:129`, `src/components/portail-cfc/dossier-queue-view.tsx:68`, `src/components/portail-cfc/operational-register-view.tsx:63`, and the settings directory components.

The savings passbook remains a ledger/table-first screen without an alternate compact/card mode; assess whether a useful summary view is needed for smaller screens. Keep Kanban as a board, but provide a clear path to the same dossier list and detail actions. Do not add a second view that merely repeats dense financial ledger rows without improving phone-size access.

### 8. Features already retained or improved locally

- The client workspace still has borrower selection plus dossier, Kanban, DUC, and savings sections; the client detail includes a barcode, role-specific safe dossier summary, assignment control, information/documents/finance/history tabs.
- Grid/list controls, database-backed records, and explicit empty/error states now cover more than the old table-only client pages.
- The local generic document uploader has actual signed upload, checksum/version handling, and server-side authorization; it is a stronger source of truth than the old add-document mock.
- Current navigation and role permissions are database-backed and fail closed. Keep this over the older static role-to-sidebar assumptions.
- Local synthetic seed examples currently cover the modeled phases through disbursement. `closing_release` remains unsupported until the contract/repayment lifecycle exists; do not create a fake payoff/mainlevée row.
- System administration pages for users/recovery, groups, workflow, roles, SMTP/provider health, and audit are present in the local application and do not appear in these older UI snapshots.

## Recommended implementation order

1. Add the dedicated client-detail edit affordance with narrow persisted actions and current KYC ownership rules; retain the completed staff intake flow.
2. Keep the implemented role-by-service-stage document matrix and DB enforcement; audit that each authorized role sees “required now / optional / missing / rejected / validated” and its permitted upload or review action.
3. Replace the five unsupported actor placeholders with real models only where business lifecycle, owner, access, audit, and retention can be defined; add idempotent local/staging seed examples per supported state.
4. Restore mobile-money details if its data model is approved, then audit every role route for list, detail, filters, applicable view modes, upload/decision actions, and empty/error/denied states.
5. Keep the upstream visual density and useful workflows while removing its static arrays, client-only saves, and unpersisted financial calculations.

## Uncertain items requiring domain evidence

- Which roles should upload, validate, reject, or sign each document type at each process stage, and whether this varies by product/service.
- Whether `ref.service_document_requirement.stage` already matches the persisted dossier phase codes or needs a reviewed mapping.
- Which fields should be editable by GUICHET, GESTIONNAIRE, RISQUES_BET, COMITE, and NOTAIRE after intake; identity/KYC corrections need their own controlled workflow.
- The state machine and authoritative source for arrears, subsidy eligibility/amount, promoter inventory, BET/notary accreditation, and mobile-money reconciliation.
- Whether document order should be manually configurable or strictly derived from catalogue priority and audit chronology.
- Whether phone layouts need a card view for savings ledgers; the upstream passbook itself uses a dense table.
