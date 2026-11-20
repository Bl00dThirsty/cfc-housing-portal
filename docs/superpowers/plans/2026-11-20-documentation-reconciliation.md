# Documentation Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the docs describe the system that actually exists, and mark completed work with evidence while preserving the meaning of intentionally unchecked boxes.

**Architecture:** Three documentation-only tasks: remove the obsolete `/accueil` claim, resolve the 14 cross-document contradictions against source code and tests, then add a dated status addendum to each of the nine implementation plans. No application code changes.

**Tech Stack:** Markdown, `git diff --check`, `grep`/ripgrep for evidence, `npm test` for current counts.

## Global Constraints

- Documentation only: no application behaviour or database change. The one comment-only correction in `src/app/page.tsx` is permitted.
- Source of truth order: current source code + passing tests → dated status audit → reference docs.
- Next.js 15.5.25, React 19, Tailwind 4 (from `package.json`).
- The old `/dev/demo` panel does not exist; guarded DB-seeded local/staging fixtures superseded it.
- Preserve all pre-existing worktree edits; apply targeted changes only.
- Commit after each task with the exact message shown.

---

### Task 1: Remove the obsolete /accueil claim

**Files:**
- Modify: `src/app/page.tsx:14`
- Modify: `README.md`
- Modify: `docs/CFC-GREENFIELD-REFERENCE.md` (D4 decision)

**Interfaces:**
- Consumes: the real public surface — `/simulator`, `/faq`, `/tracking`, `/verify`.
- Produces: zero references to a public vitrine at `/accueil`; no route is added.

- [ ] **Step 1: Record the failing evidence scan**

Run: `grep -ri "accueil" README.md docs/CFC-GREENFIELD-REFERENCE.md src/app/page.tsx`
Expected: matches include the stale comment `vitrine publique reste accessible sur /accueil` and the D4 decision. Keep the output as the failing baseline.

- [ ] **Step 2: Apply the targeted edits**

In `src/app/page.tsx`, replace the comment:
```ts
/**
 * Root safety net: real requests are redirected by middleware. The public
 * surface is /simulator, /faq, /tracking and /verify; there is no /accueil.
 */
```
In `README.md` and `docs/CFC-GREENFIELD-REFERENCE.md`, replace every claim that a public vitrine exists at `/accueil` with:
```
The public surface consists of `/simulator` (financing simulator), `/faq`,
`/tracking` (own-dossier tracking) and `/verify` (registry lookup not yet
connected). A public marketing vitrine at `/accueil` was considered and
dropped; it is not part of the MVP.
```

- [ ] **Step 3: Verify no stale references remain**

Run: `grep -ri "vitrine publique reste accessible\|/accueil" README.md docs/CFC-GREENFIELD-REFERENCE.md src/app/page.tsx`
Expected: only the explicit "there is no /accueil" statements above.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx README.md docs/CFC-GREENFIELD-REFERENCE.md
git commit -m "docs: drop obsolete /accueil vitrine claim"
```

---

### Task 2: Resolve the 14 contradictions

**Files:**
- Modify: `docs/superpowers/plans/2026-11-12-toast-layer.md`
- Modify: `docs/superpowers/plans/2026-11-12-role-aware-header.md`
- Modify: `docs/superpowers/plans/2026-11-12-interactive-tracking-drawer.md`
- Modify: `docs/superpowers/plans/README.md`
- Modify: `docs/superpowers/specs/2026-11-18-self-service-profiles-and-avatars.md`
- Modify: `docs/CFC-GREENFIELD-REFERENCE.md`
- Create: `docs/superpowers/2026-11-20-contradiction-resolutions.md`

**Interfaces:**
- Consumes: the 14 contradictions catalogued in the 2026-11-20 audit.
- Produces: one resolution document with evidence; corrected stack/count claims in the affected files.

- [ ] **Step 1: Write the resolution table**

Create `docs/superpowers/2026-11-20-contradiction-resolutions.md`:
```markdown
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
```

- [ ] **Step 2: Correct the stack claims**

In each of `2026-11-12-toast-layer.md`, `2026-11-12-role-aware-header.md` and `2026-11-12-interactive-tracking-drawer.md`, replace every `Next.js 16` with `Next.js 15.5.25`.

- [ ] **Step 3: Correct the profile status claim**

In `docs/superpowers/specs/2026-11-18-self-service-profiles-and-avatars.md`, add after the status line:
```
Status note 2026-11-20: core self-service edits, avatar metadata and the
legal-name correction request/review panel are present in code and covered by
tests. Staff/client avatar projections in dossier lists remain open and are
tracked in the self-service plan addendum.
```

- [ ] **Step 4: Verify and commit**

Run: `grep -rn "Next.js 16" docs/superpowers/plans`
Expected: no matches.
Run: `git diff --check`
Expected: no whitespace errors.

```bash
git add docs/superpowers
git commit -m "docs: resolve 2026-11-20 contradictions with evidence"
```

---

### Task 3: Evidence-based status addenda for all nine plans

**Files:**
- Modify: all nine dated files in `docs/superpowers/plans/` (not `README.md`)
- Modify: `docs/superpowers/plans/README.md`

**Interfaces:**
- Consumes: `npm test`, `npm run test:system`, `npm run typecheck`, `npm run lint`, `npm run build`, local pgTAP and smoke results; the contradiction resolution document.
- Produces: one `## Status addendum — 2026-11-20` section per plan, with feature boxes flipped only where evidence exists.

- [ ] **Step 1: Capture current evidence**

Run: `npm test 2>&1 | Select-String -Pattern "Test Files|Tests "`
Record exact counts (currently 91 files passed / 5 skipped, 522 tests passed / 17 skipped).
Run: `npm run test:system 2>&1 | Select-String -Pattern "^ℹ (tests|pass|fail)"`
Record exact counts (currently 47 passed, 0 failed).

- [ ] **Step 2: Append the standard addendum**

Append this block to each of the nine plans, replacing `<PLAN>` with the plan's own subject and `<EVIDENCE>` with the counts captured above:
```markdown
## Status addendum — 2026-11-20

Feature implementation in this plan was assessed against source code, unit
tests, pgTAP and the local smoke matrix. Verified gates: `<EVIDENCE>`.

Boxes whose deliverable is present in code and covered by a passing test are
marked `[x]`. Boxes recording a historical TDD red-phase run, a commit, or a
hosted release remain `[ ]` **by convention** — the checkbox records the
audit trail, not the existence of the feature. No hosted migration, seed,
commit to main, or Vercel write was performed.

Deferred, with reasons: `/verify` registry lookup (no official registry
connection), credit-contract/repayment lifecycle (no owned model), approval
automation (no signed delegation), full staff lifecycle and new role codes
(no business owner), complete accessibility audit (separate slice).
```

- [ ] **Step 3: Flip evidenced feature boxes**

For each plan, change `[ ]` → `[x]` only on steps whose deliverable is a feature verified in the codebase map and covered by a test. Never flip:
- "Run the failing test and confirm it fails" / any TDD red-phase step;
- "Commit" / "committer" steps;
- hosted migration, staging, production or Vercel steps;
- steps whose feature is listed as deferred in the addendum.

Where a feature is verified but its box is intentionally preserved, add the literal suffix ` (preserved: audit trail)` after the step text.

- [ ] **Step 4: Update the status index**

Replace the test-count line in `docs/superpowers/plans/README.md` with the counts from Step 1, and add a final line:
```
Per-plan evidence addenda: 2026-11-20. Checkboxes record implementation and
verification evidence, with TDD-red/commit/hosted boxes intentionally open.
```

- [ ] **Step 5: Verify and commit**

Run: `git diff --check`
Run: `grep -rl "Status addendum — 2026-11-20" docs/superpowers/plans/*.md`
Expected: nine files listed.
Run: `npm test` and `npm run typecheck`
Expected: unchanged green baseline (docs only).

```bash
git add docs/superpowers/plans
git commit -m "docs: add evidence-based 2026-11-20 status addenda"
```

---

## Self-review

- **Spec coverage:** G4 covered by Tasks 1–3; AC5 covered; N3/N6 respected (no `/accueil` route, no mechanical checkbox rewrite).
- **Placeholders:** none — every edit gives exact replacement text.
- **Type consistency:** the addendum heading string is identical in Task 3 Steps 2 and 5; the precedence rule in Task 2 matches Global Constraints.
