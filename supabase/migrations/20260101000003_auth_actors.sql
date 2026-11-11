-- 003 — Identité : acteurs, profils et affectations.
--
-- Un seul realm d'authentification (`auth.users`), une table d'acteurs qui
-- discrimine la nature de l'acteur. Les rôles vivent dans
-- `public.staff_assignments` (registre de référence) et dans `app_metadata`
-- (cache serveur) — **jamais** dans `user_metadata`, que l'utilisateur peut
-- réécrire.

-- `citext` est installé dans le schéma `extensions` (cf. migration 001).
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Agences
-- ---------------------------------------------------------------------------

create table if not exists public.agencies (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  label         text not null,
  city          text,
  region        text,
  country       char(2) not null default 'CM',
  is_diaspora_desk boolean not null default false,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);

create unique index if not exists agencies_code_key on public.agencies (code) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Acteurs
-- ---------------------------------------------------------------------------

create table if not exists public.actors (
  id            uuid primary key references auth.users (id) on delete cascade,
  actor_type    text not null check (actor_type in ('citizen', 'staff', 'service')),
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);

create index if not exists actors_type_idx on public.actors (actor_type) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Profil citoyen (emprunteur)
-- ---------------------------------------------------------------------------

create table if not exists public.citizen_profiles (
  id                     uuid primary key references public.actors (id) on delete cascade,
  full_name              text,
  affiliation_status     text not null default 'first_time'
                           check (affiliation_status in ('first_time', 'other_bank', 'cfc_existing', 'non_resident')),
  affiliation_verified_at timestamptz,
  cni_raw                text,
  cni_normalised         citext generated always as ((upper(regexp_replace(cni_raw, '[^A-Za-z0-9]', '', 'g')))::citext) stored,
  birth_date             date,
  phone                  text,
  phone2                 text,
  email                  text,
  address                text,
  city                   text,
  district               text,
  region                 text,
  is_diaspora            boolean not null default false,
  kyc_state              text not null default 'pre_boarding'
                           check (kyc_state in (
                             'pre_boarding', 'identity_capture', 'document_verification',
                             'screening_pending', 'screening_cleared', 'screening_potential_match',
                             'enhanced_due_diligence', 'risk_rated', 'approval_pending',
                             'approved', 'active', 'dormant', 'review_due', 'review_in_progress',
                             'exited', 'offboarded', 'blocked'
                           )),
  risk_rating            text check (risk_rating in ('LOW', 'STANDARD', 'HIGH')),
  risk_rules_version     text,
  risk_rated_at          timestamptz,
  created_at             timestamptz not null default now(),
  created_by             uuid references auth.users (id) on delete set null,
  updated_at             timestamptz not null default now(),
  updated_by             uuid references auth.users (id) on delete set null,
  deleted_at             timestamptz,
  deleted_by             uuid references auth.users (id) on delete set null
);

create unique index if not exists citizen_profiles_active_cni_key
  on public.citizen_profiles (cni_normalised) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Profil agent
-- ---------------------------------------------------------------------------

create table if not exists public.staff_profiles (
  id            uuid primary key references public.actors (id) on delete cascade,
  full_name     text,
  pole          text,
  job_title     text,
  department    text,
  agency_id     uuid references public.agencies (id) on delete set null,
  phone         text,
  avatar_tone   text,
  initials      text,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);

create index if not exists staff_profiles_agency_idx on public.staff_profiles (agency_id);
create index if not exists staff_profiles_pole_idx on public.staff_profiles (pole);

-- ---------------------------------------------------------------------------
-- Affectations (rôle, périmètre, agence)
-- ---------------------------------------------------------------------------

create table if not exists public.staff_assignments (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid not null references public.actors (id) on delete cascade,
  role            text not null check (role in ('GUICHET', 'GESTIONNAIRE', 'RISQUES_BET', 'NOTAIRE', 'COMITE', 'DIASPORA', 'ADMIN')),
  scope           text not null default 'OWN_AGENCY'
                    check (scope in ('OWN_AGENCY', 'OWN_PORTFOLIO', 'OWN_FILES', 'ALL', 'DIASPORA_FILES')),
  agency_id       uuid references public.agencies (id) on delete set null,
  reporting_line  uuid references public.actors (id) on delete set null,
  starts_at       timestamptz not null default now(),
  ends_at         timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references auth.users (id) on delete set null
);

create index if not exists staff_assignments_actor_idx on public.staff_assignments (actor_id);
create index if not exists staff_assignments_agency_idx on public.staff_assignments (agency_id);
create unique index if not exists staff_assignments_active_role_key
  on public.staff_assignments (actor_id, role) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Fonctions de contexte qui dépendent des tables d'identité
-- ---------------------------------------------------------------------------

-- Rôle effectif de l'acteur, lu dans `public.staff_assignments`
-- (registre de référence — `app_metadata` n'est qu'un cache susceptible
-- d'être périmé après un changement d'affectation).
create or replace function private.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select sa.role
  from public.staff_assignments sa
  where sa.actor_id = (select auth.uid())
    and sa.deleted_at is null
  order by sa.created_at desc
  limit 1;
$$;

-- Agence de rattachement de l'acteur.
create or replace function private.actor_agency_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select sa.agency_id
  from public.staff_assignments sa
  where sa.actor_id = (select auth.uid())
    and sa.deleted_at is null
  order by sa.created_at desc
  limit 1;
$$;

-- Pôle organisationnel de l'acteur : déduit de son rôle via `ref.role`.
-- Défini en migration 004, avec le référentiel des rôles.

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

select private.attach_audit_trigger('public.agencies');
select private.attach_audit_trigger('public.actors');
select private.attach_audit_trigger('public.citizen_profiles');
select private.attach_audit_trigger('public.staff_profiles');
select private.attach_audit_trigger('public.staff_assignments');

-- Les colonnes d'audit ne sont pas modifiables par l'application : elles sont
-- renseignées par le trigger. Le privilège de colonne est révoqué pour que
-- la révocation soit effective même si une requête les mentionne.
--
-- L'ordre est important : la révocation de privilège de colonne doit suivre
-- l'octroi du privilège de table, sinon elle ne porte sur rien.
grant select, insert, update, delete on public.agencies to authenticated;
grant select, insert, update, delete on public.actors to authenticated;
grant select, insert, update, delete on public.citizen_profiles to authenticated;
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant select, insert, update, delete on public.staff_assignments to authenticated;
grant all on public.agencies, public.actors, public.citizen_profiles,
             public.staff_profiles, public.staff_assignments to service_role;

revoke update (created_by, updated_by, deleted_by) on public.agencies from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.actors from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.citizen_profiles from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.staff_profiles from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.staff_assignments from authenticated;
