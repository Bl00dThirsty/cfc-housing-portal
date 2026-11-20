-- 004 — Référentiel déclarable : catalogue documentaire, chemises, pôles,
-- rôles et habilitations.
--
-- Le catalogue documentaire est une table de référence, **pas** un enum
-- PostgreSQL : il porte des métadonnées (émetteur, validité, formats
-- acceptés) et doit être modifiable par la Compliance avec une date
-- d'effet. Toute ligne expédiée est fermée (`valid_to`), jamais réécrite.

-- ---------------------------------------------------------------------------
-- Pôles organisationnels
-- ---------------------------------------------------------------------------

create table if not exists ref.pole (
  code          text primary key,
  label         text not null,
  description   text,
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
-- ---------------------------------------------------------------------------
-- Rôles métier et habilitations
-- ---------------------------------------------------------------------------

create table if not exists ref.role (
  code          text primary key,
  label         text not null,
  description   text,
  pole_code     text references ref.pole (code) on delete set null,
  scope         text not null default 'OWN_AGENCY'
                  check (scope in ('OWN_AGENCY', 'OWN_PORTFOLIO', 'OWN_FILES', 'ALL', 'DIASPORA_FILES')),
  landing_path  text not null default '/admin/clients',
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
-- Matrice des habilitations : déclarable, auditable, versionnable. Elle est
-- l'unique source consultée par `private.has_capability`, donc par les
-- politiques RLS.
create table if not exists ref.role_capability (
  role_code     text not null references ref.role (code) on delete cascade,
  capability    text not null,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null,
  primary key (role_code, capability)
);
create index if not exists role_capability_capability_idx on ref.role_capability (capability);
-- Le rôle possède-t-il cette capacité ?
create or replace function private.has_capability(p_role text, p_capability text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from ref.role_capability rc
    where rc.role_code = p_role
      and rc.capability = p_capability
      and rc.deleted_at is null
  );
$$;
-- Périmètre maximal du rôle.
create or replace function private.role_scope(p_role text) returns text
language sql stable security definer set search_path = '' as $$
  select r.scope
  from ref.role r
  where r.code = p_role;
$$;
-- Périmètre maximal du pôle, déduit du rôle qui l'occupe.
create or replace function private.pole_scope(p_pole text) returns text
language sql stable security definer set search_path = '' as $$
  select r.scope
  from ref.role r
  where r.pole_code = p_pole
    and r.deleted_at is null
  limit 1;
$$;
-- Pôle organisationnel de l'acteur. Le contexte de session prime ; à défaut,
-- le pôle est déduit du rôle de l'acteur (registre de référence), puis de
-- sa fiche agent. `app_metadata` n'est qu'un cache : il peut être périmé
-- après un changement d'affectation.
create or replace function private.current_pole() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
           nullif(current_setting('app.current_pole', true), ''),
           (
             select r.pole_code
             from ref.role r
             where r.code = (select private.current_role())
               and r.deleted_at is null
           ),
           (
             select sp.pole
             from public.staff_profiles sp
             where sp.id = (select auth.uid())
               and sp.deleted_at is null
           )
         );
$$;
-- ---------------------------------------------------------------------------
-- Chemises DUC
-- ---------------------------------------------------------------------------

create table if not exists ref.chemise (
  code          text primary key check (code in ('C1', 'C2', 'C3')),
  label         text not null,
  description   text,
  owning_pole   text references ref.pole (code) on delete set null,
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
-- Rôles autorisés à lire une chemise (le contrôle effectif est en base via
-- `ref.chemise_readable_by`).
create table if not exists ref.chemise_readable_by (
  chemise_code  text not null references ref.chemise (code) on delete cascade,
  role_code     text not null references ref.role (code) on delete cascade,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null,
  primary key (chemise_code, role_code)
);
-- ---------------------------------------------------------------------------
-- Natures de documents
-- ---------------------------------------------------------------------------

create table if not exists ref.document_nature (
  code                     text primary key,
  label                    text not null,
  description              text,
  requires_issuer_check    boolean not null default false,
  requires_validity_check  boolean not null default false,
  requires_human_review    boolean not null default false,
  sort_order               smallint not null default 0,
  created_at               timestamptz not null default now(),
  created_by               uuid references auth.users (id) on delete set null,
  updated_at               timestamptz not null default now(),
  updated_by               uuid references auth.users (id) on delete set null,
  deleted_at               timestamptz,
  deleted_by               uuid references auth.users (id) on delete set null
);
-- ---------------------------------------------------------------------------
-- Types de documents (le catalogue déclarable)
-- ---------------------------------------------------------------------------

create table if not exists ref.document_type (
  code                  text primary key,
  nature_code           text not null references ref.document_nature (code),
  label                 text not null,
  issuing_authority     text not null,
  issuing_country       char(2) not null default 'CM',
  validity_months       integer check (validity_months is null or validity_months > 0),
  renewal_reminder_days integer check (renewal_reminder_days >= 0),
  accepted_mime         text[] not null default array['application/pdf','image/jpeg','image/png']::text[],
  max_size_bytes        bigint not null default 20971520 check (max_size_bytes > 0),
  min_count             smallint not null default 1 check (min_count > 0),
  max_count             smallint check (max_count is null or max_count >= min_count),
  standalone_ok         boolean not null default true,
  requires_signature    boolean not null default false,
  requires_photograph   boolean not null default false,
  valid_from            date not null default current_date,
  valid_to              date,
  created_at            timestamptz not null default now(),
  created_by            uuid references auth.users (id) on delete set null,
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users (id) on delete set null,
  deleted_at            timestamptz,
  deleted_by            uuid references auth.users (id) on delete set null
);
create index if not exists document_type_nature_idx on ref.document_type (nature_code);
create index if not exists document_type_validity_idx on ref.document_type (valid_from, valid_to);
-- Ce qui peut se substituer à quoi (un passeport pour une CNI à l'étranger).
create table if not exists ref.document_type_equivalent (
  from_code    text not null references ref.document_type (code) on delete cascade,
  to_code      text not null references ref.document_type (code) on delete cascade,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  deleted_at   timestamptz,
  deleted_by   uuid references auth.users (id) on delete set null,
  primary key (from_code, to_code)
);
-- ---------------------------------------------------------------------------
-- Audit et privilèges
-- ---------------------------------------------------------------------------

select private.attach_audit_trigger('ref.pole');
select private.attach_audit_trigger('ref.role');
select private.attach_audit_trigger('ref.role_capability');
select private.attach_audit_trigger('ref.chemise');
select private.attach_audit_trigger('ref.chemise_readable_by');
select private.attach_audit_trigger('ref.document_nature');
select private.attach_audit_trigger('ref.document_type');
select private.attach_audit_trigger('ref.document_type_equivalent');
grant select, insert, update, delete on
  ref.pole, ref.role, ref.role_capability, ref.chemise, ref.chemise_readable_by,
  ref.document_nature, ref.document_type, ref.document_type_equivalent
  to authenticated;
grant all on
  ref.pole, ref.role, ref.role_capability, ref.chemise, ref.chemise_readable_by,
  ref.document_nature, ref.document_type, ref.document_type_equivalent
  to service_role;
revoke update (created_by, updated_by, deleted_by) on ref.pole from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.role from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.role_capability from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.chemise from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.chemise_readable_by from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.document_nature from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.document_type from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.document_type_equivalent from authenticated;
