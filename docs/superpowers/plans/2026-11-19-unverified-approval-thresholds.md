# Unverified Approval Thresholds Implementation Plan

> **For agentic workers:** Execute inline with an independent test checkpoint. Preserve the existing dirty worktree; do not commit or push this focused data correction.

**Goal:** Stop the seed and current database from presenting the three unverified approval bands as active CFC policy.

**Architecture:** Keep approval-threshold data database-owned. Remove the three unsupported seed rows and add a forward-only migration that retires only those exact codes. The test verifies that none of these rows is effective after the migration; the workflow remains blocked from decision automation until an approved delegation is loaded.

**Tech Stack:** Supabase CLI 3.2.0, PostgreSQL 15, pgTAP, `supabase/seed.sql`.

## Global Constraints

- Only local Supabase is used for this implementation checkpoint; no `--remote` flag or hosted database operation.
- Do not reset the local database or rewrite an already applied migration.
- Do not replace the removed bands with public-web thresholds or any guessed values.
- Preserve all unrelated dirty worktree files.

---

### Task 1: Prove unsupported approval bands are inactive

**Files:**
- Create: `supabase/tests/unverified_approval_thresholds.test.sql`
- Modify: `supabase/seed.sql`
- Create: a CLI-generated migration under `supabase/migrations/`

**Interfaces:**
- Consumes: `ref.approval_threshold(code, effective_from, effective_to, deleted_at)`.
- Produces: no active rows for `CGR_DELEGATION`, `CRC_ARBITRAGE`, or `PCA_INSTITUTIONNEL` until an approved catalogue replaces them.

- [ ] **Step 1: Add the failing pgTAP assertion**

```sql
begin;
select plan(1);
select is(
  (
    select count(*)::integer
    from ref.approval_threshold
    where code in ('CGR_DELEGATION', 'CRC_ARBITRAGE', 'PCA_INSTITUTIONNEL')
      and deleted_at is null
      and effective_from <= current_date
      and (effective_to is null or effective_to >= current_date)
  ),
  0,
  'unverified approval bands are not effective'
);
select * from finish();
rollback;
```

- [ ] **Step 2: Run only the new local database test and confirm the expected failure**

Run: `npx supabase test db supabase/tests/unverified_approval_thresholds.test.sql`  
Expected: one failed assertion reporting the current effective unverified seed rows.

- [ ] **Step 3: Remove the unsupported rows from the repeatable seed**

Delete the `insert into ref.approval_threshold ...` block for those three codes in `supabase/seed.sql`. Keep the explanatory section heading so it is clear that no threshold catalogue is supplied yet.

- [ ] **Step 4: Generate and add a forward-only migration**

Run: `npx supabase migration new retire_unverified_approval_thresholds`  
In the generated file, mark only the three exact codes with `deleted_at = coalesce(deleted_at, now())` and `updated_at = now()` where `deleted_at is null`. Do not touch any other threshold row.

- [ ] **Step 5: Verify the migration and seed boundary locally**

Run: `npx supabase migration up`  
Run: `npx supabase test db supabase/tests/unverified_approval_thresholds.test.sql`  
Expected: the migration applies to the local stack and the pgTAP assertion passes.

- [ ] **Step 6: Check the patch**

Run: `git diff --check`  
Expected: no whitespace errors. Confirm the generated migration contains only exact-code retirement and `supabase/seed.sql` no longer inserts these three values.

## Follow-up plans

This focused correction does not implement the staff admin console, the approved CFC delegation, loan-contract activation, or phase-complete fixture coverage. Those remain tracked in `docs/superpowers/specs/2026-11-19-admin-governance-console.md` and `docs/superpowers/specs/2026-11-19-commercial-counter-workflow.md` and must be delivered as separate vertical slices.

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
