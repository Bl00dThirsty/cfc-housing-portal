-- Expand safe metadata coverage to staff profiles and the delivery ledger.
-- This also preserves the authenticated initiator when a service-role worker
-- writes an email delivery on behalf of a staff action.
create or replace function private.record_admin_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row jsonb;
  v_actor_id uuid;
  v_actor_role text;
  v_entity_key text;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_actor_id := coalesce(
    private.current_user_id(),
    nullif(v_row ->> 'created_by', '')::uuid,
    nullif(v_row ->> 'updated_by', '')::uuid
  );
  v_actor_role := private.current_role();

  if v_actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if v_actor_role is null then
    select sa.role
      into v_actor_role
      from public.staff_assignments sa
     where sa.actor_id = v_actor_id
       and sa.deleted_at is null
       and sa.starts_at <= now()
       and (sa.ends_at is null or sa.ends_at > now())
     order by sa.starts_at desc
     limit 1;
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
    'public.staff_profiles',
    'public.actor_profile_media',
    'public.citizen_profile_change_requests',
    'public.email_deliveries'
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
