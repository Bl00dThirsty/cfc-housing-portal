insert into ref.capability (code, label, group_label, description, sort_order)
values (
  'admin:groups',
  'Gérer les pôles et agences',
  'Administration',
  'Administrer les groupes organisationnels et leurs agences.',
  325
)
on conflict (code) do update
set label = excluded.label,
    group_label = excluded.group_label,
    description = excluded.description,
    sort_order = excluded.sort_order,
    deleted_at = null,
    deleted_by = null;

insert into ref.role_capability (role_code, capability)
select 'ADMIN', 'admin:groups'
where exists (select 1 from ref.role where code = 'ADMIN' and deleted_at is null)
on conflict (role_code, capability) do update set deleted_at = null, deleted_by = null;

create or replace view public.cfc_poles
with (security_invoker = true) as
  select pole.code, pole.label, pole.description, pole.sort_order, pole.deleted_at
  from ref.pole pole;

grant select on public.cfc_poles to authenticated;

create or replace function public.cfc_admin_list_groups()
returns table (
  group_type text,
  id uuid,
  code text,
  label text,
  description text,
  city text,
  region text,
  is_diaspora_desk boolean,
  member_count integer,
  role_count integer,
  sort_order integer
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:groups')) then
    raise exception 'admin_groups_forbidden' using errcode = '42501';
  end if;

  return query
  select
    'pole'::text,
    null::uuid,
    pole.code,
    pole.label,
    pole.description,
    null::text,
    null::text,
    false,
    (
      select count(distinct assignment.actor_id)::integer
      from public.staff_assignments assignment
      join public.staff_profiles profile on profile.id = assignment.actor_id
      join ref.role role on role.code = assignment.role and role.deleted_at is null
      join auth.users account on account.id = assignment.actor_id
      where role.pole_code = pole.code
        and assignment.deleted_at is null
        and assignment.starts_at <= now()
        and (assignment.ends_at is null or assignment.ends_at > now())
        and profile.deleted_at is null
        and (account.banned_until is null or account.banned_until <= now())
    ),
    (select count(*)::integer from ref.role role where role.pole_code = pole.code and role.deleted_at is null),
    pole.sort_order::integer
  from ref.pole pole
  where pole.deleted_at is null

  union all

  select
    'agency'::text,
    agency.id,
    agency.code,
    agency.label,
    null::text,
    agency.city,
    agency.region,
    agency.is_diaspora_desk,
    (
      select count(distinct assignment.actor_id)::integer
      from public.staff_assignments assignment
      join public.staff_profiles profile on profile.id = assignment.actor_id
      join auth.users account on account.id = assignment.actor_id
      where assignment.agency_id = agency.id
        and assignment.deleted_at is null
        and assignment.starts_at <= now()
        and (assignment.ends_at is null or assignment.ends_at > now())
        and profile.deleted_at is null
        and (account.banned_until is null or account.banned_until <= now())
    ),
    (
      select count(distinct assignment.role)::integer
      from public.staff_assignments assignment
      where assignment.agency_id = agency.id
        and assignment.deleted_at is null
        and assignment.starts_at <= now()
        and (assignment.ends_at is null or assignment.ends_at > now())
    ),
    0
  from public.agencies agency
  where agency.deleted_at is null
  order by 1, 4;
end
$function$;

revoke all on function public.cfc_admin_list_groups() from public, anon;
grant execute on function public.cfc_admin_list_groups() to authenticated;

create or replace function public.cfc_save_pole(
  p_code text,
  p_label text,
  p_description text default null,
  p_sort_order smallint default 500
) returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_label text := trim(coalesce(p_label, ''));
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:groups')) then
    raise exception 'admin_groups_forbidden' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9_-]{1,31}$' or length(v_label) < 2 then
    raise exception 'invalid_pole' using errcode = '22023';
  end if;

  insert into ref.pole (code, label, description, sort_order)
  values (v_code, v_label, nullif(trim(coalesce(p_description, '')), ''), coalesce(p_sort_order, 500))
  on conflict (code) do update
    set label = excluded.label,
        description = excluded.description,
        sort_order = excluded.sort_order,
        deleted_at = null,
        deleted_by = null;

  return v_code;
end
$function$;

revoke all on function public.cfc_save_pole(text, text, text, smallint) from public, anon;
grant execute on function public.cfc_save_pole(text, text, text, smallint) to authenticated;

create or replace function public.cfc_save_agency(
  p_agency_id uuid,
  p_code text,
  p_label text,
  p_city text default null,
  p_region text default null,
  p_is_diaspora_desk boolean default false
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_label text := trim(coalesce(p_label, ''));
  v_id uuid;
  v_existing_code text;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:groups')) then
    raise exception 'admin_groups_forbidden' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9_-]{1,47}$' or length(v_label) < 2 then
    raise exception 'invalid_agency' using errcode = '22023';
  end if;

  if p_agency_id is null then
    insert into public.agencies (code, label, city, region, country, is_diaspora_desk)
    values (
      v_code,
      v_label,
      nullif(trim(coalesce(p_city, '')), ''),
      nullif(trim(coalesce(p_region, '')), ''),
      'CM',
      coalesce(p_is_diaspora_desk, false)
    )
    returning id into v_id;
  else
    select agency.code into v_existing_code
    from public.agencies agency
    where agency.id = p_agency_id and agency.deleted_at is null;
    if not found then
      raise exception 'agency_not_found' using errcode = 'P0002';
    end if;
    if v_existing_code <> v_code then
      raise exception 'agency_code_immutable' using errcode = '22023';
    end if;

    update public.agencies
    set label = v_label,
        city = nullif(trim(coalesce(p_city, '')), ''),
        region = nullif(trim(coalesce(p_region, '')), ''),
        is_diaspora_desk = coalesce(p_is_diaspora_desk, false)
    where id = p_agency_id and deleted_at is null
    returning id into v_id;
  end if;

  return v_id;
end
$function$;

revoke all on function public.cfc_save_agency(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.cfc_save_agency(uuid, text, text, text, text, boolean) to authenticated;
