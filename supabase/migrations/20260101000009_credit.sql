-- 009 — Crédit : délibérations de comité, lignes de signature et offres de prêt.

create table if not exists public.committee_deliberations (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid not null references public.dossiers (id) on delete cascade,
  committee_code text not null check (committee_code in ('CGR', 'CRC', 'PCA', 'BOARD')),
  session_date   date not null default current_date,
  status         text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'deliberated', 'adjourned', 'cancelled')),
  quorum_met     boolean,
  secretary_id   uuid references auth.users (id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users (id) on delete set null
);
create index if not exists committee_deliberations_dossier_idx on public.committee_deliberations (dossier_id);
create index if not exists committee_deliberations_committee_idx
  on public.committee_deliberations (committee_code, session_date desc);
create table if not exists public.deliberation_lines (
  id             uuid primary key default gen_random_uuid(),
  deliberation_id uuid not null references public.committee_deliberations (id) on delete cascade,
  dossier_id     uuid not null references public.dossiers (id) on delete cascade,
  signer_id      uuid references auth.users (id) on delete set null,
  signer_role    text not null,
  vote           text not null check (vote in ('approve', 'reject', 'abstain', 'conditional')),
  comment        text,
  signed_at      timestamptz,
  signature_hash text,
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users (id) on delete set null
);
create index if not exists deliberation_lines_deliberation_idx on public.deliberation_lines (deliberation_id);
create index if not exists deliberation_lines_dossier_idx on public.deliberation_lines (dossier_id);
create unique index if not exists deliberation_lines_signer_key
  on public.deliberation_lines (deliberation_id, signer_id) where deleted_at is null;
create table if not exists public.loan_offers (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid not null references public.dossiers (id) on delete cascade,
  deliberation_id uuid references public.committee_deliberations (id) on delete set null,
  offer_amount    numeric(15, 2) not null check (offer_amount > 0),
  apport_amount   numeric(15, 2),
  rate            numeric(6, 3) not null,
  duration_years  smallint not null check (duration_years > 0),
  monthly_payment numeric(15, 2),
  valid_until     date,
  status          text not null default 'draft' check (status in ('draft', 'issued', 'accepted', 'refused', 'expired')),
  issued_by       uuid references auth.users (id) on delete set null,
  issued_at       timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references auth.users (id) on delete set null
);
create index if not exists loan_offers_dossier_idx on public.loan_offers (dossier_id);
create index if not exists loan_offers_status_idx on public.loan_offers (status) where deleted_at is null;
select private.attach_audit_trigger('public.committee_deliberations');
select private.attach_audit_trigger('public.deliberation_lines');
select private.attach_audit_trigger('public.loan_offers');
grant select, insert, update, delete on
  public.committee_deliberations, public.deliberation_lines, public.loan_offers
  to authenticated;
grant all on
  public.committee_deliberations, public.deliberation_lines, public.loan_offers
  to service_role;
revoke update (created_by, updated_by, deleted_by) on public.committee_deliberations from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.deliberation_lines from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.loan_offers from authenticated;
