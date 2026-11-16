-- 006 — Racine d'agrégat : le dossier, les tiers et les mandats.
--
-- `public.dossiers` est la racine d'agrégat du back-office. Les noms de
-- colonnes reprennent les noms du modèle applicatif, en snake_case.

-- `citext` est installé dans le schéma `extensions` (cf. migration 001).
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Dossier
-- ---------------------------------------------------------------------------

create table if not exists public.dossiers (
  id                   uuid primary key default gen_random_uuid(),
  duc_code             text not null,
  citizen_id           uuid references public.actors (id) on delete set null,
  owner_user_id        uuid references public.actors (id) on delete set null,
  agency_id            uuid references public.agencies (id) on delete set null,
  service_code         text references ref.service (code),
  product_code         text references ref.product (code),
  is_diaspora          boolean not null default false,

  -- Identité de l'emprunteur
  name                 text,
  cni_raw              text,
  cni_normalised       citext generated always as ((upper(regexp_replace(cni_raw, '[^A-Za-z0-9]', '', 'g')))::citext) stored,
  birth_date           date,
  phone                text,
  phone2               text,
  email                text,
  address              text,
  city                 text,
  district             text,
  region               text,
  agency               text,
  advisor              text,
  profession           text,
  employer             text,
  visa                 text,
  passbook             text,

  -- Projet et financement
  project_type         text,
  project_title        text,
  project_cost         numeric(15, 2),
  savings_percent      numeric(5, 2) check (savings_percent is null or savings_percent between 0 and 100),
  savings_target       numeric(15, 2),
  savings_current      numeric(15, 2),
  current_balance      numeric(15, 2),
  monthly_income       numeric(15, 2),
  loan_amount          numeric(15, 2),
  rate                 numeric(6, 3),
  duration             smallint,
  duration_years       smallint,
  monthly_payment      numeric(15, 2),
  debt_ratio           numeric(6, 2),
  account_number       text,
  land_title           text,
  land_title_rank      text,
  notary_assigned      text,
  bet_assigned         text,
  officer              text,

  -- Pilotage
  risk_level           text,
  rating               text,
  status               text not null default 'draft',
  current_phase        text,
  current_step         text,
  progress             smallint not null default 0 check (progress between 0 and 100),
  completion_percent   smallint not null default 0 check (completion_percent between 0 and 100),
  entered_phase_at     timestamptz,
  sla_deadline         timestamptz,
  closed_at            timestamptz,

  created_at           timestamptz not null default now(),
  created_by           uuid references auth.users (id) on delete set null,
  updated_at           timestamptz not null default now(),
  updated_by           uuid references auth.users (id) on delete set null,
  deleted_at           timestamptz,
  deleted_by           uuid references auth.users (id) on delete set null
);

-- Index sur les clés étrangères : PostgreSQL ne le fait pas à la place de
-- l'application, et chaque politique RLS filtre sur ces colonnes.
create index if not exists dossiers_citizen_idx on public.dossiers (citizen_id);
create index if not exists dossiers_owner_idx on public.dossiers (owner_user_id);
create index if not exists dossiers_agency_idx on public.dossiers (agency_id);
create index if not exists dossiers_service_idx on public.dossiers (service_code);
create index if not exists dossiers_product_idx on public.dossiers (product_code);
create index if not exists dossiers_phase_idx on public.dossiers (current_phase);
create index if not exists dossiers_sla_idx on public.dossiers (sla_deadline) where deleted_at is null;

-- Index partiels d'unicité : une suppression logique libère la clé.
create unique index if not exists dossiers_active_duc_key
  on public.dossiers (duc_code) where deleted_at is null;
create unique index if not exists dossiers_active_cni_key
  on public.dossiers (cni_normalised) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Tiers (BET, notaires, promoteurs, assureurs, MINDCAF…)
-- ---------------------------------------------------------------------------

create table if not exists public.parties (
  id                  uuid primary key default gen_random_uuid(),
  party_type          text not null check (party_type in (
                        'bet', 'notary', 'promoter', 'insurer', 'mindcaf', 'conservation_fonciere',
                        'mobile_money', 'employer', 'diaspora_agent', 'systac', 'other'
                      )),
  name                text not null,
  legal_name          text,
  registration_number text,
  tax_id              text,
  email               text,
  phone               text,
  address             text,
  country             char(2) not null default 'CM',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid references auth.users (id) on delete set null
);

create index if not exists parties_type_idx on public.parties (party_type) where deleted_at is null;
create unique index if not exists parties_registration_key
  on public.parties (registration_number) where deleted_at is null and registration_number is not null;

-- ---------------------------------------------------------------------------
-- Rattachement d'un tiers à un dossier
-- ---------------------------------------------------------------------------

create table if not exists public.dossier_parties (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers (id) on delete cascade,
  party_id          uuid not null references public.parties (id) on delete cascade,
  role_in_dossier   text not null check (role_in_dossier in (
                      'bet', 'notary', 'promoter', 'insurer', 'mindcaf', 'conservation_fonciere',
                      'mobile_money', 'employer', 'diaspora_agent', 'other'
                    )),
  mandate_reference text,
  engaged_at        timestamptz not null default now(),
  released_at       timestamptz,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null
);

create index if not exists dossier_parties_dossier_idx on public.dossier_parties (dossier_id);
create index if not exists dossier_parties_party_idx on public.dossier_parties (party_id);
create unique index if not exists dossier_parties_active_key
  on public.dossier_parties (dossier_id, party_id, role_in_dossier) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Mandats : un tiers ↔ un dossier ↔ un jeu de capacités, borné dans le temps
-- ---------------------------------------------------------------------------

create table if not exists public.grants (
  id            uuid primary key default gen_random_uuid(),
  party_id      uuid not null references public.parties (id) on delete cascade,
  dossier_id    uuid not null references public.dossiers (id) on delete cascade,
  capabilities  text[] not null default '{}'::text[],
  valid_from    timestamptz not null default now(),
  valid_to      timestamptz,
  granted_by    uuid references auth.users (id) on delete set null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);

create index if not exists grants_dossier_idx on public.grants (dossier_id);
create index if not exists grants_party_idx on public.grants (party_id);
create index if not exists grants_active_idx
  on public.grants (dossier_id, party_id) where revoked_at is null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- Prédicat d'action sur un dossier
--
-- Un rôle n'agit pas sur « un dossier » mais « sur un dossier qui lui
-- appartient ». Le périmètre n'est pas codé en dur : il est lu dans
-- `ref.role.scope`, lui-même déclarable par l'administration.
--
-- p_pole                : pôle de l'acteur ('G1', 'G2', 'G3', 'G6', 'G8', …)
-- p_owner               : agent titulaire du dossier (dossiers.owner_user_id)
-- p_dossier_agency      : agence du dossier
-- p_dossier_is_diaspora : le dossier est instruit par le guichet diaspora
-- p_dossier_id          : identifiant du dossier (pour les mandats de tiers)
-- ---------------------------------------------------------------------------

create or replace function private.can_act_on_dossier(
  p_pole text,
  p_owner uuid,
  p_dossier_agency uuid default null,
  p_dossier_is_diaspora boolean default false,
  p_dossier_id uuid default null
) returns boolean
language sql stable security definer set search_path = '' as $$
  with ctx as (
    select (select private.pole_scope(p_pole)) as scope
  ),
  mandate as (
    select exists (
      select 1
      from public.dossier_parties dp
      join public.grants g
        on g.dossier_id = dp.dossier_id
       and g.party_id = dp.party_id
      where p_dossier_id is not null
        and dp.dossier_id = p_dossier_id
        and dp.deleted_at is null
        and g.deleted_at is null
        and g.revoked_at is null
        and (g.valid_from is null or g.valid_from <= now())
        and (g.valid_to is null or g.valid_to > now())
    ) as has_mandate
  )
  select case
    when p_pole is null then false
    when ctx.scope is null then false
    when ctx.scope = 'ALL' then true
    when ctx.scope = 'OWN_AGENCY' then
      p_dossier_agency is not null
      and p_dossier_agency = (select private.actor_agency_id())
    when ctx.scope = 'OWN_PORTFOLIO' then
      p_owner is not null and p_owner = (select auth.uid())
    when ctx.scope = 'OWN_FILES' then
      (p_owner is not null and p_owner = (select auth.uid()))
      or (select has_mandate from mandate)
    when ctx.scope = 'DIASPORA_FILES' then
      p_dossier_is_diaspora
      and (
        (p_owner is not null and p_owner = (select auth.uid()))
        or (select has_mandate from mandate)
      )
    else false
  end
  from ctx;
$$;

-- ---------------------------------------------------------------------------
-- Audit et privilèges
-- ---------------------------------------------------------------------------

select private.attach_audit_trigger('public.dossiers');
select private.attach_audit_trigger('public.parties');
select private.attach_audit_trigger('public.dossier_parties');
select private.attach_audit_trigger('public.grants');

grant select, insert, update, delete on
  public.dossiers, public.parties, public.dossier_parties, public.grants
  to authenticated;
grant all on
  public.dossiers, public.parties, public.dossier_parties, public.grants
  to service_role;

revoke update (created_by, updated_by, deleted_by) on public.dossiers from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.parties from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.dossier_parties from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.grants from authenticated;
