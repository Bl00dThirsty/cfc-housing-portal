# Contradiction resolutions — 2026-11-20

Precedence: source code + passing tests → dated status audit → reference docs.

| # | Conflict | Resolution |
|---|---|---|
| C1 | 171 unchecked boxes read as "not built" | Checkbox ≠ feature state; see `plans/README.md` and Task 3 addenda |
| C2 | 508 vs 517 unit tests on 2026-11-20 | Use the current measured count recorded in Task 3 addenda |
| C3 | Next.js 16 vs 15 in plans | `package.json` pins 15.5.25; correct the three older plans |
| C4 | 44 vs 42 tables | 44 is the planned table count; 42 was a mid-migration snapshot; shared engine now covers the current set |
| C5 | Approval-threshold Step 2 unchecked | Pre-fix failing run not retained; safety fix itself implemented and asserted |
| C6 | `/dev/demo` exists? | No `src/app/dev/**` route exists; superseded by guarded DB-seeded fixtures |
| C7 | Profile correction UI done vs open | Code + tests exist; status label stands, plan boxes corrected in Task 3 |
| C8 | 7 vs 12 staff roles | 12 typed roles are in force; reference's 7-role matrix is historical |
| C9 | One active credit contract | Invariant acknowledged, unmodelled; explicitly deferred out of MVP |
| C10 | Public tracking lookup | Own-dossier only; public DUC lookup out of scope |
| C11 | `/verify/[code]` fake CNI | No registry connection; page states indisponible, no fake certificate |
| C12 | Duplicate/mixed step labels in P9/P10 | Authoring defects; preserved but annotated, not silently rewritten |
| C13 | Unowned organisational poles | Recorded as deferred; no role/code invented |
| C14 | `system:staging` unverified | Distinct staging ref still absent; staging path remains unexecuted |
