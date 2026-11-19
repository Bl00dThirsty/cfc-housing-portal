-- Safe, append-only audit history for administrative configuration changes.
-- The log stores identifiers and action metadata only; never row snapshots,
-- borrower identity fields, message bodies, credentials, or secrets.
create table if not exists private.admin_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_key text,
  occurred_at timestamptz not null default now()
);

create index if not exists admin_audit_events_occurred_at_idx
  on private.admin_audit_events (occurred_at desc, id desc);
create index if not exists admin_audit_events_actor_id_idx
  on private.admin_audit_events (actor_id, id desc);

alter table private.admin_audit_events enable row level security;
revoke all on table private.admin_audit_events from public, anon, authenticated;

create or replace function private.record_admin_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row jsonb;
  v_actor_id uuid := private.current_user_id();
  v_actor_role text := private.current_role();
  v_entity_key text;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  -- Seed jobs and system migrations have no authenticated actor and should
  -- not appear as staff changes in the administrative journal.
  if v_actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE'
     and (to_jsonb(old) - array['updated_at', 'updated_by'])
       = (to_jsonb(new) - array['updated_at', 'updated_by']) then
    return new;
  end if;

  v_entity_key := coalesce(
    nullif(v_row ->> 'id', ''),
    nullif(v_row ->> 'code', ''),
    nullif(concat_ws(':', nullif(v_row ->> 'role_code', ''), nullif(v_row ->> 'capability', '')), ''),
    nullif(concat_ws(':', nullif(v_row ->> 'process_code', ''), nullif(v_row ->> 'step_code', '')), ''),
    nullif(concat_ws(':', nullif(v_row ->> 'chemise_code', ''), nullif(v_row ->> 'role_code', '')), ''),
    nullif(v_row ->> 'actor_id', ''),
    nullif(v_row ->> 'product_code', '')
  );

  insert into private.admin_audit_events (
    actor_id, actor_role, action, entity_type, entity_key
  ) values (
    v_actor_id,
    v_actor_role,
    lower(tg_op),
    format('%I.%I', tg_table_schema, tg_table_name),
    left(v_entity_key, 180)
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;

do $audit_triggers$
declare
  v_table text;
  v_schema text;
  v_name text;
begin
  foreach v_table in array array[
    'public.agencies',
    'public.staff_assignments',
    'ref.pole',
    'ref.role',
    'ref.capability',
    'ref.role_capability',
    'ref.chemise',
    'ref.chemise_readable_by',
    'ref.document_nature',
    'ref.document_type',
    'ref.document_type_equivalent',
    'ref.service',
    'ref.product',
    'ref.product_rate',
    'ref.service_document_requirement',
    'ref.debt_capacity_policy',
    'ref.retention_policy',
    'ref.kyc_option',
    'ref.process',
    'ref.process_step',
    'ref.email_template',
    'ref.email_settings'
  ] loop
    v_schema := split_part(v_table, '.', 1);
    v_name := split_part(v_table, '.', 2);
    execute format('drop trigger if exists trg_admin_audit on %I.%I', v_schema, v_name);
    execute format(
      'create trigger trg_admin_audit after insert or update or delete on %I.%I for each row execute function private.record_admin_audit_event()',
      v_schema, v_name
    );
  end loop;
end
$audit_triggers$;

create or replace function public.cfc_list_admin_audit(p_limit integer default 100)
returns table (
  id bigint,
  actor_id uuid,
  actor_role text,
  action text,
  entity_type text,
  entity_key text,
  occurred_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not coalesce(
    private.has_capability(private.current_role(), 'admin:audit'),
    false
  ) then
    raise exception 'admin_audit_forbidden' using errcode = '42501';
  end if;

  return query
  select e.id, e.actor_id, e.actor_role, e.action, e.entity_type, e.entity_key, e.occurred_at
  from private.admin_audit_events e
  order by e.id desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
end
$function$;

revoke all on function public.cfc_list_admin_audit(integer) from public, anon;
grant execute on function public.cfc_list_admin_audit(integer) to authenticated;
