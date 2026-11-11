-- 005 — Référentiel produits : services, produits, taux, exigences
-- documentaires, seuils de capacité d'endettement, seuils d'approbation et
-- politique de conservation.
--
-- Les taux, plafonds et seuils sont **déclaratifs** : l'application ne les
-- code plus en dur.

-- ---------------------------------------------------------------------------
-- Catalogue de services (produit que l'emprunteur choisit à l'onboarding)
-- ---------------------------------------------------------------------------

create table if not exists ref.service (
  code          text primary key,
  label         text not null,
  description   text,
  is_active     boolean not null default true,
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Produits et barèmes
-- ---------------------------------------------------------------------------

create table if not exists ref.product (
  code                text primary key,
  label               text not null,
  description         text,
  service_code        text not null references ref.service (code),
  loan_ceiling        numeric(15, 2),
  min_apport_percent  numeric(5, 2) check (min_apport_percent is null or min_apport_percent between 0 and 100),
  max_duration_years  smallint check (max_duration_years is null or max_duration_years > 0),
  is_active           boolean not null default true,
  sort_order          smallint not null default 0,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid references auth.users (id) on delete set null
);

create index if not exists product_service_idx on ref.product (service_code);

create table if not exists ref.product_rate (
  id                uuid primary key default gen_random_uuid(),
  product_code      text not null references ref.product (code) on delete cascade,
  rate_code         text not null,
  label             text not null,
  annual_rate       numeric(6, 3) not null check (annual_rate >= 0),
  duration_years    smallint check (duration_years is null or duration_years > 0),
  savings_rate      numeric(6, 3) check (savings_rate is null or savings_rate >= 0),
  valid_from        date not null default current_date,
  valid_to          date,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null
);

create index if not exists product_rate_product_idx on ref.product_rate (product_code);
create unique index if not exists product_rate_active_key
  on ref.product_rate (product_code, rate_code, duration_years, valid_from)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Exigences documentaires par service et par étape
--
-- VERSIONNÉES PAR DATE D'EFFET : une ligne expédiée n'est jamais réécrite,
-- elle est fermée (`effective_to`) et une nouvelle ligne est ouverte.
-- ---------------------------------------------------------------------------

create table if not exists ref.service_document_requirement (
  id                uuid primary key default gen_random_uuid(),
  service_code      text not null references ref.service (code) on delete cascade,
  stage             text not null check (stage in (
                      'ONBOARDING', 'SAVINGS', 'CREDIT_FILE', 'NOTARY', 'MORTGAGE', 'PAYOFF', 'DISBURSEMENT'
                    )),
  doc_type_code     text not null references ref.document_type (code),
  required          boolean not null default true,
  min_count         smallint not null default 1 check (min_count > 0),
  max_count         smallint check (max_count is null or max_count >= min_count),
  alternative_group text,
  condition_expr    text,
  depends_on_doc    text references ref.document_type (code),
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null,
  unique (service_code, stage, doc_type_code, effective_from)
);

create index if not exists service_document_requirement_service_idx
  on ref.service_document_requirement (service_code, stage);

-- ---------------------------------------------------------------------------
-- Politique de capacité d'endettement (versionnée)
--
-- Il n'existe AUCUN seuil réglementaire COBAC de quotient d'endettement :
-- le « 33 % » de l'application est une **politique institutionnelle** CFC,
-- déclinée en deux paliers (33 % / 40 %) selon le Guide Pratique du Prêt
-- Foncier Classique. La valeur vit donc en base, avec sa date d'effet.
-- ---------------------------------------------------------------------------

create table if not exists ref.debt_capacity_policy (
  id                uuid primary key default gen_random_uuid(),
  code              text not null,
  label             text not null,
  description       text,
  max_debt_ratio    numeric(5, 2) not null check (max_debt_ratio > 0 and max_debt_ratio <= 100),
  applies_to        text check (applies_to is null or applies_to in ('ALL', 'PROMOTIONNEL', 'SOCIAL', 'LOTISSEMENT', 'SOLIDAIRE')),
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null,
  unique (code, effective_from)
);

-- ---------------------------------------------------------------------------
-- Seuils d'approbation
-- ---------------------------------------------------------------------------

create table if not exists ref.approval_threshold (
  id                uuid primary key default gen_random_uuid(),
  code              text not null,
  label             text not null,
  committee_code    text,
  min_amount        numeric(15, 2) not null default 0,
  max_amount        numeric(15, 2),
  required_signatures smallint not null default 1 check (required_signatures > 0),
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null,
  unique (code, effective_from)
);

-- ---------------------------------------------------------------------------
-- Politique de conservation (durée de garde des pièces)
-- ---------------------------------------------------------------------------

create table if not exists ref.retention_policy (
  id                uuid primary key default gen_random_uuid(),
  code              text not null,
  label             text not null,
  document_type_code text references ref.document_type (code),
  stage             text,
  retention_years   smallint not null check (retention_years > 0),
  archive_after_years smallint check (archive_after_years is null or archive_after_years > 0),
  legal_basis       text,
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null,
  unique (code, effective_from)
);

-- ---------------------------------------------------------------------------
-- Audit et privilèges
-- ---------------------------------------------------------------------------

select private.attach_audit_trigger('ref.service');
select private.attach_audit_trigger('ref.product');
select private.attach_audit_trigger('ref.product_rate');
select private.attach_audit_trigger('ref.service_document_requirement');
select private.attach_audit_trigger('ref.debt_capacity_policy');
select private.attach_audit_trigger('ref.approval_threshold');
select private.attach_audit_trigger('ref.retention_policy');

grant select, insert, update, delete on
  ref.service, ref.product, ref.product_rate, ref.service_document_requirement,
  ref.debt_capacity_policy, ref.approval_threshold, ref.retention_policy
  to authenticated;
grant all on
  ref.service, ref.product, ref.product_rate, ref.service_document_requirement,
  ref.debt_capacity_policy, ref.approval_threshold, ref.retention_policy
  to service_role;

revoke update (created_by, updated_by, deleted_by) on ref.service from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.product from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.product_rate from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.service_document_requirement from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.debt_capacity_policy from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.approval_threshold from authenticated;
revoke update (created_by, updated_by, deleted_by) on ref.retention_policy from authenticated;
