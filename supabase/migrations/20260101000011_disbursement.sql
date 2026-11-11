-- 011 — Décaissements, échéanciers et rapprochements SYSTAC.

create table if not exists public.disbursements (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references public.dossiers (id) on delete cascade,
  beneficiary_party_id uuid references public.parties (id) on delete set null,
  tranche_number      smallint not null check (tranche_number > 0),
  amount              numeric(15, 2) not null check (amount > 0),
  release_date        date,
  value_available_date date,
  method              text check (method in ('systac_transfer', 'bank_transfer', 'mobile_money', 'cash', 'cheque')),
  payment_reference   text,
  status              text not null default 'planned' check (status in ('planned', 'authorized', 'released', 'cancelled')),
  authorized_by       uuid references auth.users (id) on delete set null,
  released_by         uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid references auth.users (id) on delete set null
);

create index if not exists disbursements_dossier_idx on public.disbursements (dossier_id);
create unique index if not exists disbursements_active_tranche_key
  on public.disbursements (dossier_id, tranche_number) where deleted_at is null;

create table if not exists public.disbursement_schedules (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid not null references public.dossiers (id) on delete cascade,
  disbursement_id uuid references public.disbursements (id) on delete set null,
  due_date        date not null,
  amount          numeric(15, 2) not null check (amount > 0),
  status          text not null default 'scheduled' check (status in ('scheduled', 'due', 'paid', 'late')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references auth.users (id) on delete set null
);

create index if not exists disbursement_schedules_dossier_idx on public.disbursement_schedules (dossier_id, due_date);
create index if not exists disbursement_schedules_due_idx
  on public.disbursement_schedules (due_date) where status in ('scheduled', 'due') and deleted_at is null;

create table if not exists public.reconciliation_runs (
  id                  uuid primary key default gen_random_uuid(),
  run_date            date not null default current_date,
  channel             text not null check (channel in ('systac', 'mobile_money_mtn', 'mobile_money_orange', 'bank_transfer', 'agency')),
  source              text,
  records_total       integer not null default 0,
  records_matched     integer not null default 0,
  records_mismatch    integer not null default 0,
  amount_total        numeric(15, 2),
  discrepancy_amount  numeric(15, 2),
  status              text not null default 'running' check (status in ('running', 'completed', 'failed')),
  executed_by         uuid references auth.users (id) on delete set null,
  details             jsonb,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid references auth.users (id) on delete set null
);

create index if not exists reconciliation_runs_date_idx on public.reconciliation_runs (run_date desc);
create index if not exists reconciliation_runs_mismatch_idx
  on public.reconciliation_runs (run_date desc) where records_mismatch > 0 and deleted_at is null;

select private.attach_audit_trigger('public.disbursements');
select private.attach_audit_trigger('public.disbursement_schedules');
select private.attach_audit_trigger('public.reconciliation_runs');

grant select, insert, update, delete on
  public.disbursements, public.disbursement_schedules, public.reconciliation_runs
  to authenticated;
grant all on
  public.disbursements, public.disbursement_schedules, public.reconciliation_runs
  to service_role;

revoke update (created_by, updated_by, deleted_by) on public.disbursements from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.disbursement_schedules from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.reconciliation_runs from authenticated;
