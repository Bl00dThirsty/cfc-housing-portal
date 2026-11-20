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

-- attach_audit_trigger() only fires private.audit_columns(); it does NOT add
-- columns. Add the standard audit columns explicitly before attaching it.
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name like 'registers_%'
  loop
    execute format('alter table public.%I add column if not exists created_at timestamptz not null default now()', t);
    execute format('alter table public.%I add column if not exists created_by uuid references auth.users(id) on delete set null', t);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    execute format('alter table public.%I add column if not exists updated_by uuid references auth.users(id) on delete set null', t);
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
    execute format('alter table public.%I add column if not exists deleted_by uuid references auth.users(id) on delete set null', t);
  end loop;
end $$;

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

-- Covering indexes for every foreign key on the new register tables, keeping
-- the repo-wide "every public foreign key has a covering index" invariant green.
do $$
declare
  constraint_row record;
  column_name text;
begin
  for constraint_row in
    select c.conname, c.conrelid, c.conkey, t.relname, n.nspname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'
      and t.relname like 'registers_%'
  loop
    select a.attname into column_name
    from pg_attribute a
    where a.attrelid = constraint_row.conrelid
      and a.attnum = constraint_row.conkey[1];

    execute format(
      'create index if not exists %I on %I.%I (%I)',
      'idx_' || left(constraint_row.relname, 40) || '_' || left(column_name, 30),
      constraint_row.nspname,
      constraint_row.relname,
      column_name
    );
  end loop;
end $$;
