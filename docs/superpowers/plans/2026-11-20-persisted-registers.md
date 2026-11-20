# Persisted Registers & Role-Safe Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five `PersistenceNotice` stub domains with real, audited, RLS-protected registers offering CRUD and a role-safe notification to every active actor.

**Architecture:** Six new `public` tables (five registers plus promoter relationships), two new capabilities wired through the existing three-layer RBAC, server-only queries/actions, a service-role notification fan-out, and list/detail/form pages built on the existing data-table engine. No new `SECURITY DEFINER` function is introduced.

**Tech Stack:** Next.js 15.5.25 App Router, React 19, Zod 3, Supabase (RLS + service-role client), Vitest 3, pgTAP, Tailwind 4 + existing UI kit.

## Global Constraints

- Local + PR-ready only; no hosted Supabase or Vercel write.
- Next.js 15.5.25, React 19, Tailwind 4; Supabase CLI pinned to `3.2.0`.
- New tables: `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`; policies `TO authenticated` with capability predicates; no `anon`; no `auth.role()` or `user_metadata`.
- No new `SECURITY DEFINER` function in schema `public`; notification fan-out uses the server-only admin client.
- Every register write emits exactly one role-safe notification per active actor; no cross-role PII in payloads.
- French UI copy in the CFC tone; explicit empty/error/forbidden/retry states.
- Preserve the dirty worktree; commit after each task with the exact message shown.

---

### Task 1: Register domain types and capability taxonomy

**Files:**
- Create: `src/domain/entities/registers.ts`
- Create: `src/domain/entities/registers.test.ts`
- Modify: `src/domain/policies/capabilities.ts`
- Modify: `src/domain/policies/permissions.ts`

**Interfaces:**
- Consumes: existing `Capability`, `Role`, `hasCapability` from `src/domain/policies/`.
- Produces: `REGISTER_KEYS`, `RegisterKey`, `RegisterRecord`, `REGISTER_LABELS`, `validateRegisterInput(key, input)` returning `{ ok: true; value } | { ok: false; errors: Record<string,string> }`.

- [ ] **Step 1: Write the failing domain test**

```ts
// src/domain/entities/registers.test.ts
import { describe, expect, it } from "vitest";

import { REGISTER_KEYS, REGISTER_LABELS, validateRegisterInput } from "./registers";

describe("register taxonomy", () => {
  it("exposes exactly the five stub domains", () => {
    expect(REGISTER_KEYS).toEqual([
      "promoters",
      "bet-experts",
      "notary-offices",
      "subsidies",
      "recovery",
    ]);
  });

  it("has a French label for every register", () => {
    for (const key of REGISTER_KEYS) {
      expect(REGISTER_LABELS[key].title.length).toBeGreaterThan(3);
    }
  });

  it("rejects a short label and accepts a valid promoter", () => {
    const bad = validateRegisterInput("promoters", { label: "A" });
    expect(bad.ok).toBe(false);
    const good = validateRegisterInput("promoters", {
      label: "Promotion Saint-Paul",
      region: "Centre",
      status: "active",
    });
    expect(good.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/domain/entities/registers.test.ts`
Expected: FAIL — cannot find `./registers`.

- [ ] **Step 3: Write the domain implementation**

```ts
// src/domain/entities/registers.ts
export const REGISTER_KEYS = [
  "promoters",
  "bet-experts",
  "notary-offices",
  "subsidies",
  "recovery",
] as const;

export type RegisterKey = (typeof REGISTER_KEYS)[number];

export const REGISTER_LABELS: Record<
  RegisterKey,
  { title: string; description: string; table: string }
> = {
  promoters: {
    title: "Partenaires immobiliers",
    description: "Promoteurs et programmes immobiliers partenaires du dispositif.",
    table: "registers_promoters",
  },
  "bet-experts": {
    title: "Bureaux d'études techniques",
    description: "BET, experts et qualifications mobilisables sur les dossiers.",
    table: "registers_bet_experts",
  },
  "notary-offices": {
    title: "Études notariales",
    description: "Offices notariaux partenaires et leurs références d'enregistrement.",
    table: "registers_notary_offices",
  },
  subsidies: {
    title: "Subventions",
    description: "Subventions, sources de financement et décisions d'éligibilité.",
    table: "registers_subsidies",
  },
  recovery: {
    title: "Recouvrement",
    description: "Dossiers en arriéré, étapes, notifications et escalades.",
    table: "registers_recovery_cases",
  },
};

export interface RegisterRecord {
  id: string;
  label: string;
  region: string | null;
  status: string;
  updatedAt: string;
  fields: { label: string; value: string }[];
}

export type RegisterInput = Record<string, string | number | boolean | null>;

export type ValidationResult =
  | { ok: true; value: RegisterInput }
  | { ok: false; errors: Record<string, string> };

export function validateRegisterInput(
  key: RegisterKey,
  input: RegisterInput,
): ValidationResult {
  const errors: Record<string, string> = {};
  const label = typeof input.label === "string" ? input.label.trim() : "";
  if (label.length < 2 || label.length > 160) {
    errors.label = "Renseignez un libellé de 2 à 160 caractères.";
  }
  if (input.region !== null && input.region !== undefined && typeof input.region !== "string") {
    errors.region = "La région doit être un texte.";
  }
  if (
    input.status !== "active" &&
    input.status !== "inactive" &&
    input.status !== "suspended"
  ) {
    errors.status = "Choisissez un statut valide.";
  }
  if (key === "subsidies" && (typeof input.amount !== "number" || input.amount < 0)) {
    errors.amount = "Le montant doit être positif.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ...input,
      label,
      region: typeof input.region === "string" ? input.region.trim() : null,
    },
  };
}
```

Add to the `Capability` union in `src/domain/policies/capabilities.ts`:
```ts
  | "register:read"
  | "register:write"
```
Add the same two strings to `ALL_CAPABILITIES`. `ADMIN` inherits them automatically via `ALL_CAPABILITIES.filter(...)`.

Add `"register:read"` and `"register:write"` to the capability arrays of `GUICHET`, `GESTIONNAIRE`, `RISQUES_BET`, `NOTAIRE`, `COMITE`, `PMO`, `RECOUVREMENT` in `src/domain/policies/permissions.ts`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/domain/entities/registers.test.ts src/config/rbac/route-access.test.ts src/domain/policies/permissions.test.ts`
Expected: all pass; ADMIN inherits the grants.

- [ ] **Step 5: Commit**

```bash
git add src/domain/entities/registers.ts src/domain/entities/registers.test.ts src/domain/policies/capabilities.ts src/domain/policies/permissions.ts
git commit -m "feat(registers): add register taxonomy and capabilities"
```

---

### Task 2: Persisted register tables with RLS

**Files:**
- Create: `supabase/migrations/20261120130000_register_tables.sql`
- Create: `supabase/tests/20261120_register_rls.test.sql`

**Interfaces:**
- Consumes: `private.attach_audit_trigger()` and `private.has_capability(text)` from earlier migrations.
- Produces: six tables with forced RLS and a `registers_promoter_links` relationship view; role grants from `ref.role_capability`.

- [ ] **Step 1: Write the failing RLS test**

```sql
-- supabase/tests/20261120_register_rls.test.sql
begin;
select plan(4);

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r'),
  6, 'six register tables exist');

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r' and not c.relrowsecurity),
  0, 'every register table has RLS enabled');

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r' and not c.relforcerowsecurity),
  0, 'every register table forces RLS');

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r'
     and exists (
       select 1 from pg_class acl
       where has_table_privilege('anon', c.oid, 'SELECT')
     )),
  0, 'anon has no SELECT on any register');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx supabase test db --local 2>&1 | Select-String -Pattern "register_rls"`
Expected: FAIL — `six register tables exist` reports `0` instead of `6`.

- [ ] **Step 3: Write the migration**

```sql
-- supabase/migrations/20261120130000_register_tables.sql
create table if not exists public.registers_promoters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  registration_number text,
  region text,
  city text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','inactive','suspended'))
);
create table if not exists public.registers_promoter_links (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references public.registers_promoters(id),
  dossier_id uuid references public.dossiers(id),
  relationship_type text not null,
  starts_at date not null default current_date,
  ends_at date,
  notes text
);
create table if not exists public.registers_bet_experts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  firm_name text not null,
  specialization text,
  qualification_reference text,
  qualification_expires_at date,
  region text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','inactive','suspended'))
);
create table if not exists public.registers_notary_offices (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  notary_name text,
  registration_number text,
  city text,
  region text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','inactive','suspended'))
);
create table if not exists public.registers_subsidies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  funding_source text,
  eligibility_rule text,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  approval_reference text,
  dossier_id uuid references public.dossiers(id),
  status text not null default 'active' check (status in ('active','inactive','suspended'))
);
create table if not exists public.registers_recovery_cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique,
  label text not null,
  dossier_id uuid references public.dossiers(id),
  arrears_stage text,
  amount_due numeric(14,2) not null default 0 check (amount_due >= 0),
  notices_sent integer not null default 0,
  promise_date date,
  escalation_level text,
  assigned_to uuid references public.actors(id),
  status text not null default 'active' check (status in ('active','inactive','suspended'))
);

-- Reference data: the two new capabilities and their least-privilege grants.
insert into ref.capability (code, label, group_label, description, sort_order)
values
  ('register:read', 'Consulter les registres', 'Registres', 'Consulter les registres metier persists.', 410),
  ('register:write', 'Gérer les registres', 'Registres', 'Creer, modifier et retirer les fiches de registre.', 420)
on conflict (code) do nothing;

insert into ref.role_capability (role_code, capability)
select r.code, c.code
from ref.role r cross join ref.capability c
where r.code in ('GUICHET','GESTIONNAIRE','RISQUES_BET','NOTAIRE','COMITE','PMO','RECOUVREMENT','ADMIN')
  and c.code in ('register:read','register:write')
on conflict do nothing;

do $$
declare t text;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name like 'registers_%'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from anon, public', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.has_capability((select private.current_role()), ''register:read''))',
      'registers_select_' || t, t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.has_capability((select private.current_role()), ''register:write''))',
      'registers_insert_' || t, t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_capability((select private.current_role()), ''register:write'')) with check (private.has_capability((select private.current_role()), ''register:write''))',
      'registers_update_' || t, t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.has_capability((select private.current_role()), ''register:write''))',
      'registers_delete_' || t, t);
    perform private.attach_audit_trigger('public.' || t);
  end loop;
end $$;
```

- [ ] **Step 4: Apply locally and run the assertions**

Run: `npx supabase migration up --local`
Run: `npx supabase test db --local 2>&1 | Select-String -Pattern "register_rls"`
Expected: all four assertions pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261120130000_register_tables.sql supabase/tests/20261120_register_rls.test.sql
git commit -m "feat(db): add persisted register tables with forced RLS"
```

---

### Task 3: Register queries and server actions

**Files:**
- Create: `src/server/queries/registers.ts`
- Create: `src/server/actions/registers.ts`
- Create: `src/server/actions/registers.test.ts`
- Modify: `src/app/portail-cfc/(console)/actors/agency/promoters/page.tsx` (replaced in Task 5)

**Interfaces:**
- Consumes: `REGISTER_KEYS`, `REGISTER_LABELS`, `validateRegisterInput`, `RegisterRecord`.
- Produces: `listRegisterRecords(key): Promise<{ok, records}|{ok:false,error}>`, `getRegisterRecord(key,id)`, `saveRegisterRecord(key, input, id?)`, `deleteRegisterRecord(key, id)`; all results use `{ ok: true; message } | { ok: false; error; fieldErrors? }`.

- [ ] **Step 1: Write the failing action test**

```ts
// src/server/actions/registers.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();
vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "actor-1" } } })) },
    rpc,
    from,
  })),
}));
vi.mock("@/server/notifications/register-notifications", () => ({
  notifyRegisterEvent: vi.fn(async () => ({ notified: 1, emailed: 0 })),
}));

import { saveRegisterRecord } from "./registers";

describe("saveRegisterRecord", () => {
  beforeEach(() => { rpc.mockReset(); from.mockReset(); });

  it("rejects an invalid label before writing", async () => {
    const result = await saveRegisterRecord("promoters", { label: "A", status: "active", region: null });
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it("writes with the session client and returns a success message", async () => {
    const chain = {
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: "r1" }, error: null })) })) })),
    };
    from.mockReturnValue(chain);
    const result = await saveRegisterRecord("promoters", {
      label: "Promotion Saint-Paul", status: "active", region: "Centre",
    });
    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith("registers_promoters");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/actions/registers.test.ts`
Expected: FAIL — cannot find `./registers`.

- [ ] **Step 3: Write the queries and actions**

```ts
// src/server/queries/registers.ts
import "server-only";

import { REGISTER_LABELS, type RegisterKey, type RegisterRecord } from "@/domain/entities/registers";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;

function toRecord(row: Row): RegisterRecord {
  const fields = Object.entries(row)
    .filter(([key, value]) => !["id", "label", "status", "updated_at", "created_at", "deleted_at"].includes(key))
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => ({
      label: key.replaceAll("_", " "),
      value: typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value),
    }));
  return {
    id: String(row.id),
    label: String(row.label ?? "—"),
    region: typeof row.region === "string" ? row.region : null,
    status: String(row.status ?? "—"),
    updatedAt: String(row.updated_at ?? ""),
    fields,
  };
}

export async function listRegisterRecords(key: RegisterKey): Promise<
  | { ok: true; records: RegisterRecord[] }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(REGISTER_LABELS[key].table)
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) return { ok: false, error: "Ce registre ne peut pas être chargé dans votre périmètre." };
  return { ok: true, records: ((data ?? []) as Row[]).map(toRecord) };
}

export async function getRegisterRecord(key: RegisterKey, id: string): Promise<
  | { ok: true; record: RegisterRecord }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(REGISTER_LABELS[key].table)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Cette fiche n’est pas accessible dans votre périmètre." };
  return { ok: true, record: toRecord(data as Row) };
}
```

```ts
// src/server/actions/registers.ts
"use server";

import { REGISTER_LABELS, validateRegisterInput, type RegisterInput, type RegisterKey } from "@/domain/entities/registers";
import { notifyRegisterEvent } from "@/server/notifications/register-notifications";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type RegisterActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function saveRegisterRecord(
  key: RegisterKey,
  input: RegisterInput,
  id?: string,
): Promise<RegisterActionResult> {
  const supabase = await requireUser();
  if (!supabase) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };

  const validation = validateRegisterInput(key, input);
  if (!validation.ok) {
    return { ok: false, error: "Corrigez les champs indiqués.", fieldErrors: validation.errors };
  }

  const payload = { ...validation.value };
  if (key === "promoters" && !payload.code) payload.code = `PROM-${Date.now()}`;
  if (key === "subsidies" && !payload.code) payload.code = `SUB-${Date.now()}`;
  if (key === "recovery" && !payload.case_code) payload.case_code = `REC-${Date.now()}`;

  const table = REGISTER_LABELS[key].table;
  const query = id
    ? supabase.from(table).update(payload).eq("id", id).select("id").single()
    : supabase.from(table).insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) return { ok: false, error: "L’enregistrement a été refusé dans votre périmètre." };

  await notifyRegisterEvent({
    registerKey: key,
    recordId: String(data?.id ?? id ?? ""),
    label: validation.value.label as string,
    operation: id ? "update" : "create",
  });

  return {
    ok: true,
    id: String(data?.id ?? id ?? ""),
    message: id ? "La fiche a été mise à jour." : "La fiche a été enregistrée.",
  };
}

export async function deleteRegisterRecord(key: RegisterKey, id: string): Promise<RegisterActionResult> {
  const supabase = await requireUser();
  if (!supabase) return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  const { error } = await supabase
    .from(REGISTER_LABELS[key].table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "La suppression a été refusée dans votre périmètre." };
  await notifyRegisterEvent({ registerKey: key, recordId: id, label: "", operation: "delete" });
  return { ok: true, message: "La fiche a été retirée du registre." };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/server/actions/registers.test.ts src/domain/entities/registers.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/queries/registers.ts src/server/actions/registers.ts src/server/actions/registers.test.ts
git commit -m "feat(registers): add scoped queries and audited actions"
```

---

### Task 4: Role-safe notification fan-out

**Files:**
- Create: `src/server/notifications/register-notifications.ts`
- Create: `src/server/notifications/register-notifications.test.ts`
- Create: `supabase/migrations/20261120131000_active_notification_recipients.sql`

**Interfaces:**
- Consumes: `getAdminClient()`, `NotifyInput`/`notify()` from `src/server/notifications/notify.ts`, `hasCapability` from `src/domain/policies/permissions.ts`, `REGISTER_LABELS`.
- Produces: `notifyRegisterEvent(input: { registerKey: RegisterKey; recordId: string; label: string; operation: "create"|"update"|"delete" }): Promise<{ notified: number; emailed: number }>`.

- [ ] **Step 1: Write the failing test**

```ts
// src/server/notifications/register-notifications.test.ts
import { describe, expect, it, vi } from "vitest";

const adminFrom = vi.fn();
const notifyMock = vi.fn();
vi.mock("@/server/supabase/admin", () => ({
  getAdminClient: () => ({ from: adminFrom }),
}));
vi.mock("./notify", () => ({ notify: (input: unknown) => notifyMock(input) }));

import { buildRegisterNotificationPayload } from "./register-notifications";

describe("role-safe payload", () => {
  it("hides the record identifier from roles without register:read", () => {
    const generic = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "secret-id", label: "Promotion privée",
      operation: "create", canReadRegister: false,
    });
    expect(JSON.stringify(generic)).not.toContain("secret-id");
    expect(JSON.stringify(generic)).not.toContain("Promotion privée");
  });

  it("includes the label and a deep link for authorized roles", () => {
    const scoped = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "r1", label: "Promotion Saint-Paul",
      operation: "create", canReadRegister: true,
    });
    expect(scoped.body).toContain("Promotion Saint-Paul");
    expect(scoped.actionUrl).toBe("/portail-cfc/actors/agency/promoters/r1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/notifications/register-notifications.test.ts`
Expected: FAIL — no exported `buildRegisterNotificationPayload`.

- [ ] **Step 3: Write the dispatcher**

```ts
// src/server/notifications/register-notifications.ts
import "server-only";

import {
  REGISTER_LABELS,
  type RegisterKey,
} from "@/domain/entities/registers";
import { getAdminClient } from "@/server/supabase/admin";
import { notify } from "./notify";

export interface RegisterEventInput {
  registerKey: RegisterKey;
  recordId: string;
  label: string;
  operation: "create" | "update" | "delete";
}

export interface RegisterNotificationPayload {
  title: string;
  body: string | null;
  actionUrl: string | null;
  dedupeKey: string;
}

export function buildRegisterNotificationPayload(
  input: RegisterEventInput & { canReadRegister: boolean },
): RegisterNotificationPayload {
  const title = `Registre — ${REGISTER_LABELS[input.registerKey].title}`;
  const verb = input.operation === "delete" ? "retirée" : input.operation === "update" ? "mise à jour" : "enregistrée";
  return {
    title,
    body: input.canReadRegister
      ? `Une fiche a été ${verb} : ${input.label || input.recordId}.`
      : "Une fiche a été modifiée dans un registre CFC.",
    actionUrl: input.canReadRegister
      ? `/portail-cfc/actors/agency/${input.registerKey}/${input.recordId}`
      : null,
    dedupeKey: `register:${input.registerKey}:${input.recordId}:${input.operation}:${input.label}`,
  };
}

interface ActorRow {
  id: string;
  role: string | null;
  has_register_read: boolean | null;
}

/**
 * Notifie chaque actif. Le service-role est nécessaire : la RLS de
 * `notifications` ne doit pas décider du destinataire d'une notification
 * adressée à autrui. Les capacités sont lues dans le référentiel persistant,
 * jamais dans les métadonnées JWT.
 */
export async function notifyRegisterEvent(
  input: RegisterEventInput,
): Promise<{ notified: number; emailed: number }> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc("cfc_active_notification_recipients");
    if (error || !data) {
      console.error("[registers] destinataires illisibles :", error?.message ?? "aucune donnée");
      return { notified: 0, emailed: 0 };
    }

    let notified = 0;
    let emailed = 0;
    for (const row of (data as ActorRow[])) {
      const payload = buildRegisterNotificationPayload({
        ...input,
        canReadRegister: Boolean(row.has_register_read),
      });
      const result = await notify({
        recipientUserId: row.id,
        type: "dossier.updated",
        title: payload.title,
        body: payload.body,
        actionUrl: payload.actionUrl,
        dedupeKey: `${payload.dedupeKey}:${row.id}`,
        email: null,
      });
      if (result.notified) notified += 1;
      if (result.emailed) emailed += 1;
    }
    return { notified, emailed };
  } catch (caught) {
    console.error("[registers] diffusion impossible :", caught);
    return { notified: 0, emailed: 0 };
  }
}
```

Create a **separate forward-only migration** (Task 2's migration is already applied locally by the time this task runs, so it must not be edited):
```sql
-- supabase/migrations/20261120131000_active_notification_recipients.sql
-- SECURITY INVOKER on purpose: no new SECURITY DEFINER function in public.
-- The server-only service-role client reads this through PostgREST and
-- already bypasses RLS; anon and authenticated are explicitly excluded.
create or replace function public.cfc_active_notification_recipients()
returns table (id uuid, role text, has_register_read boolean)
language sql stable
set search_path = ''
as $$
  select a.id,
         coalesce(sa.role, 'CITIZEN')::text,
         exists (
           select 1 from ref.role_capability rc
           where rc.role_code = sa.role and rc.capability = 'register:read'
         )
  from public.actors a
  left join public.staff_assignments sa
    on sa.actor_id = a.id and sa.starts_at <= current_date
   and (sa.ends_at is null or sa.ends_at >= current_date)
  left join public.citizen_profiles cp on cp.id = a.id
  where cp.id is not null or sa.id is not null;
$$;
revoke all on function public.cfc_active_notification_recipients() from anon, public, authenticated;
grant execute on function public.cfc_active_notification_recipients() to service_role;
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/server/notifications/register-notifications.test.ts`
Expected: both payload tests pass.
Run: `npx supabase migration up --local` and `node --test scripts/lib/demo-fixtures.test.mjs`
Expected: migration applies; fixtures still valid.

- [ ] **Step 5: Commit**

```bash
git add src/server/notifications/register-notifications.ts src/server/notifications/register-notifications.test.ts supabase/migrations/20261120131000_active_notification_recipients.sql
git commit -m "feat(registers): fan out role-safe notifications to active actors"
```

---

### Task 5: Register list, detail and form screens

**Files:**
- Create: `src/components/registers/register-table.tsx`
- Create: `src/components/registers/register-form.tsx`
- Create: `src/components/registers/register-table.test.tsx`
- Modify: six stub pages listed below.

**Interfaces:**
- Consumes: `listRegisterRecords`, `getRegisterRecord`, `saveRegisterRecord`, `deleteRegisterRecord`, `REGISTER_LABELS`.
- Produces: `RegisterTable({ registerKey, records })` and `RegisterForm({ registerKey, record?, onSaved? })`.

- [ ] **Step 1: Write the failing component test**

```tsx
// src/components/registers/register-table.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/data-table/use-data-table", () => ({
  useDataTable: () => ({ rows: [], query: "", setQuery: vi.fn() }),
}));
vi.mock("@/components/ui/toaster", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { RegisterTable } from "./register-table";

describe("RegisterTable", () => {
  it("renders an explicit empty state instead of fabricated rows", () => {
    render(<RegisterTable registerKey="promoters" records={[]} />);
    expect(screen.getByText(/aucune fiche/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/registers/register-table.test.tsx`
Expected: FAIL — cannot find `./register-table`.

- [ ] **Step 3: Write the components**

```tsx
// src/components/registers/register-table.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type { RegisterKey, RegisterRecord } from "@/domain/entities/registers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterTable({
  registerKey, records, query = "", onQueryChange,
}: {
  registerKey: RegisterKey;
  records: RegisterRecord[];
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  const visible = records.filter((record) =>
    `${record.label} ${record.region ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="space-y-4" aria-label={`Registre ${registerKey}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label="Rechercher une fiche"
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder="Rechercher une fiche…"
          className="max-w-sm"
        />
        <Button asChild>
          <Link href={`/portail-cfc/registres/${registerKey}/nouveau`}>
            <Plus className="size-4" aria-hidden /> Nouvelle fiche
          </Link>
        </Button>
      </div>

      {visible.length === 0 ? (
        <p role="status" className="rounded-md border p-6 text-sm text-muted-foreground">
          Aucune fiche ne correspond à votre périmètre. Créez une fiche ou modifiez la recherche.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {visible.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-4 p-3">
              <Link className="font-medium hover:underline" href={`/portail-cfc/registres/${registerKey}/${record.id}`}>
                {record.label}
              </Link>
              <span className="text-xs text-muted-foreground">{record.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

```tsx
// src/components/registers/register-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { RegisterInput, RegisterKey } from "@/domain/entities/registers";
import { saveRegisterRecord } from "@/server/actions/registers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({
  registerKey, initial, recordId,
}: {
  registerKey: RegisterKey;
  initial?: RegisterInput;
  recordId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(String(initial?.label ?? ""));
  const [region, setRegion] = useState(String(initial?.region ?? ""));
  const [status, setStatus] = useState(String(initial?.status ?? "active"));
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveRegisterRecord(
        registerKey,
        { label, region: region || null, status },
        recordId,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/portail-cfc/registres/${registerKey}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div className="space-y-1">
        <Label htmlFor="register-label">Libellé</Label>
        <Input id="register-label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="register-region">Région</Label>
        <Input id="register-region" value={region} onChange={(e) => setRegion(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="register-status">Statut</Label>
        <select id="register-status" value={status} onChange={(e) => setStatus(e.target.value)}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm">
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
    </form>
  );
}
```

Replace the six stub pages with server components. Pattern for `src/app/portail-cfc/(console)/actors/agency/promoters/page.tsx`:
```tsx
import { RegisterTable } from "@/components/registers/register-table";
import { listRegisterRecords } from "@/server/queries/registers";

export default async function Page() {
  const result = await listRegisterRecords("promoters");
  if (!result.ok) {
    return <p role="alert" className="rounded-md border border-destructive/30 p-4 text-sm">{result.error}</p>;
  }
  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Partenaires immobiliers</h1>
      <RegisterTable registerKey="promoters" records={result.records} />
    </section>
  );
}
```

Apply the same pattern to:
- `src/app/portail-cfc/(console)/actors/agency/promoters/[id]/page.tsx` → `getRegisterRecord("promoters", params.id)` + `<RegisterForm recordId={...} initial={...} />`
- `src/app/portail-cfc/(console)/actors/risk-engineering/directory/page.tsx` → `"bet-experts"`
- `src/app/portail-cfc/(console)/actors/notary-cadastre/directory/page.tsx` → `"notary-offices"`
- `src/app/portail-cfc/(console)/actors/disbursements/subsidies/page.tsx` → `"subsidies"`
- `src/app/portail-cfc/(console)/actors/disbursements/recovery/page.tsx` → `"recovery"`

Add the four canonical routes under `src/app/portail-cfc/(console)/registres/[registerKey]/page.tsx`, `.../nouveau/page.tsx`, `.../[id]/page.tsx` and `.../layout.tsx` using the same components. Add `registers` nav entries in `src/config/rbac/sidebar-by-role.ts` for the roles granted in Task 1 so the closed-by-default route gate admits them.

- [ ] **Step 4: Run the tests and typecheck**

Run: `npx vitest run src/components/registers/register-table.test.tsx src/config/rbac/route-access.test.ts`
Run: `npm run typecheck`
Expected: all pass; no route-access regression.

- [ ] **Step 5: Commit**

```bash
git add src/components/registers src/app/portail-cfc src/config/rbac/sidebar-by-role.ts
git commit -m "feat(registers): replace stub screens with persisted CRUD pages"
```

---

### Task 6: Local fixtures and end-to-end verification

**Files:**
- Modify: `scripts/lib/demo-fixtures.mjs`
- Modify: `scripts/lib/demo-fixtures.test.mjs`
- Create: `docs/release/2026-11-20-register-verification.md`

**Interfaces:**
- Consumes: the six register tables and the notification fan-out.
- Produces: deterministic local register fixtures with idempotent counts; recorded verification results.

- [ ] **Step 1: Write the failing fixture test**

Append to `scripts/lib/demo-fixtures.test.mjs`:
```js
test("register fixtures are deterministic and tagged", () => {
  const first = buildRegisterFixtures("demo");
  const second = buildRegisterFixtures("demo");
  assert.deepEqual(first, second);
  assert.ok(first.every((row) => row.fixture_tag === "2026-11-20-registers"));
  assert.equal(new Set(first.map((row) => row.table)).size, 5);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:system`
Expected: FAIL — `buildRegisterFixtures is not a function`.

- [ ] **Step 3: Add the fixtures**

```js
// append to scripts/lib/demo-fixtures.mjs
export function buildRegisterFixtures(seed = "demo") {
  const tag = "2026-11-20-registers";
  const rows = [
    ["registers_promoters", { code: "PROM-DEMO-1", label: "Promotion Démonstration", region: "Centre", status: "active" }],
    ["registers_bet_experts", { label: "BET Démonstration", firm_name: "BET Delta", region: "Centre", status: "active" }],
    ["registers_notary_offices", { label: "Étude Notariale Démonstration", city: "Yaoundé", region: "Centre", status: "active" }],
    ["registers_subsidies", { code: "SUB-DEMO-1", label: "Subvention Démonstration", funding_source: "État", amount: 500000, status: "active" }],
    ["registers_recovery_cases", { case_code: "REC-DEMO-1", label: "Arriéré Démonstration", arrears_stage: "relance", amount_due: 150000, status: "active" }],
  ];
  return rows.map(([table, values]) => ({ table, fixture_tag: tag, seed, values }));
}
```

- [ ] **Step 4: Run all local gates**

Run: `npm run test:system`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`
Expected: all pass. Record exact counts in `docs/release/2026-11-20-register-verification.md`.
Run the local authenticated smoke for the five list routes and confirm a notification appears for at least two roles.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/demo-fixtures.mjs scripts/lib/demo-fixtures.test.mjs docs/release/2026-11-20-register-verification.md
git commit -m "test(registers): seed deterministic fixtures and record verification"
```

---

## Self-review

- **Spec coverage:** G1 Tasks 2/3/5/6; G2 Task 4; G5 Task 6; AC1–AC2 covered; N1/N2 respected.
- **Placeholders:** none — code is complete in every code step.
- **Type consistency:** `RegisterKey` union is identical in `registers.ts`, queries, actions and UI; `notifyRegisterEvent` signature matches its call sites; `RegisterActionResult` matches every action return.
