-- Role grants are changed only through this capability-checked, audited RPC.
-- Direct table writes could bypass the locked bootstrap role and validation.
drop policy if exists ref_write on ref.role_capability;
revoke insert, update, delete on ref.role_capability from authenticated;

create or replace function public.cfc_set_role_capabilities(
  p_role text,
  p_caps text[]
) returns int
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_role text := upper(trim(coalesce(p_role, '')));
  v_caps text[] := coalesce(p_caps, array[]::text[]);
  v_count int;
begin
  if not (select private.has_capability((select private.current_role()), 'admin:roles')) then
    raise exception 'admin_roles_forbidden' using errcode = '42501';
  end if;

  if v_role = 'ADMIN' then
    raise exception 'admin_role_locked' using errcode = '42501';
  end if;

  perform 1
  from ref.role r
  where r.code = v_role and r.deleted_at is null
  for update;
  if not found then
    raise exception 'unknown_role:%', v_role using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_caps) as requested(code)
    left join ref.capability c on c.code = requested.code and c.deleted_at is null
    where c.code is null
  ) then
    raise exception 'invalid_capability' using errcode = '22023';
  end if;

  update ref.role_capability rc
  set deleted_at = now()
  where rc.role_code = v_role
    and rc.deleted_at is null
    and not (rc.capability = any(v_caps));

  insert into ref.role_capability (role_code, capability)
  select v_role, requested.code
  from unnest(v_caps) as requested(code)
  on conflict (role_code, capability) do update
    set deleted_at = null, deleted_by = null
    where ref.role_capability.deleted_at is not null;

  select count(*)::int into v_count
  from ref.role_capability rc
  where rc.role_code = v_role and rc.deleted_at is null;
  return v_count;
end
$function$;

revoke all on function public.cfc_set_role_capabilities(text, text[]) from public, anon;
grant execute on function public.cfc_set_role_capabilities(text, text[]) to authenticated;
