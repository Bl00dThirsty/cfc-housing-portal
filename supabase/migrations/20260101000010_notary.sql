-- 010 — Notariat, foncier et garanties.

create table if not exists public.land_titles (
  id                 uuid primary key default gen_random_uuid(),
  dossier_id         uuid not null references public.dossiers (id) on delete cascade,
  owner_party_id     uuid references public.parties (id) on delete set null,
  title_number       text not null,
  land_title_registry text,
  land_title_type    text check (land_title_type in ('principal', 'secondary', 'rural', 'urban')),
  issuing_authority  text,
  issue_date         date,
  registration_date  date,
  area_sqm           numeric(12, 2),
  mortgage_rank      smallint,
  is_principal_title boolean not null default true,
  created_at         timestamptz not null default now(),
  created_by         uuid references auth.users (id) on delete set null,
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users (id) on delete set null,
  deleted_at         timestamptz,
  deleted_by         uuid references auth.users (id) on delete set null
);
create index if not exists land_titles_dossier_idx on public.land_titles (dossier_id);
create unique index if not exists land_titles_active_number_key
  on public.land_titles (title_number) where deleted_at is null;
create table if not exists public.notary_instruments (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers (id) on delete cascade,
  notary_party_id   uuid references public.parties (id) on delete set null,
  land_title_id     uuid references public.land_titles (id) on delete set null,
  instrument_type   text not null check (instrument_type in (
                      'mortgage_convention', 'purchase_agreement', 'lease', 'release_deed',
                      'subrogation', 'other'
                    )),
  notary_number     text,
  deed_date         date,
  registration_date date,
  registration_number text,
  mortgage_rank     smallint,
  amount_guaranteed numeric(15, 2),
  status            text not null default 'draft' check (status in ('draft', 'signed', 'registered', 'released')),
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null
);
create index if not exists notary_instruments_dossier_idx on public.notary_instruments (dossier_id);
create index if not exists notary_instruments_status_idx on public.notary_instruments (status);
create table if not exists public.oppositions (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers (id) on delete cascade,
  land_title_id     uuid references public.land_titles (id) on delete set null,
  opposing_party_id uuid references public.parties (id) on delete set null,
  nature            text not null check (nature in ('pre_notification', 'opposition', 'maintenance', 'attachment', 'other')),
  amount            numeric(15, 2),
  raised_at         date not null default current_date,
  status            text not null default 'open' check (status in ('open', 'maintained', 'released')),
  released_at       date,
  legal_basis       text,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null
);
create index if not exists oppositions_dossier_idx on public.oppositions (dossier_id);
create index if not exists oppositions_open_idx on public.oppositions (dossier_id) where status = 'open' and deleted_at is null;
create table if not exists public.insurances (
  id               uuid primary key default gen_random_uuid(),
  dossier_id       uuid not null references public.dossiers (id) on delete cascade,
  insurer_party_id uuid references public.parties (id) on delete set null,
  policy_number    text,
  coverage_type    text not null check (coverage_type in ('death', 'disability', 'fire', 'trc', 'life', 'other')),
  insured_amount   numeric(15, 2),
  premium_amount   numeric(15, 2),
  start_date       date,
  end_date         date,
  status           text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  deleted_at       timestamptz,
  deleted_by       uuid references auth.users (id) on delete set null
);
create index if not exists insurances_dossier_idx on public.insurances (dossier_id);
create index if not exists insurances_expiry_idx on public.insurances (end_date) where deleted_at is null;
select private.attach_audit_trigger('public.land_titles');
select private.attach_audit_trigger('public.notary_instruments');
select private.attach_audit_trigger('public.oppositions');
select private.attach_audit_trigger('public.insurances');
grant select, insert, update, delete on
  public.land_titles, public.notary_instruments, public.oppositions, public.insurances
  to authenticated;
grant all on
  public.land_titles, public.notary_instruments, public.oppositions, public.insurances
  to service_role;
revoke update (created_by, updated_by, deleted_by) on public.land_titles from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.notary_instruments from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.oppositions from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.insurances from authenticated;
