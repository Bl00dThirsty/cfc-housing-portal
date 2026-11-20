-- Admin account governance stays inside Supabase Auth + audited staff rows.
-- Passwords and invitation tokens never cross this RPC boundary.

create or replace function public.cfc_admin_list_staff()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  pole text,
  job_title text,
  department text,
  phone text,
  initials text,
  agency_id uuid,
  agency_label text,
  scope text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  active boolean,
  email_confirmed boolean,
  avatar_path text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:users')) then
    raise exception 'admin_users_forbidden' using errcode = '42501';
  end if;

  return query
  select
    profile.id,
    account.email::text,
    profile.full_name,
    assignment.role,
    coalesce(role.pole_code, profile.pole),
    profile.job_title,
    profile.department,
    profile.phone,
    profile.initials,
    coalesce(assignment.agency_id, profile.agency_id),
    agency.label,
    coalesce(role.scope, assignment.scope),
    account.created_at,
    account.last_sign_in_at,
    (
      profile.deleted_at is null
      and (account.banned_until is null or account.banned_until <= now())
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
    ) as active,
    account.email_confirmed_at is not null as email_confirmed,
    media.avatar_path
  from public.staff_profiles profile
  join auth.users account on account.id = profile.id
  left join lateral (
    select candidate.role, candidate.scope, candidate.agency_id,
           candidate.deleted_at, candidate.starts_at, candidate.ends_at
    from public.staff_assignments candidate
    where candidate.actor_id = profile.id
    order by
      case
        when candidate.deleted_at is null
          and candidate.starts_at <= now()
          and (candidate.ends_at is null or candidate.ends_at > now()) then 0
        else 1
      end,
      candidate.starts_at desc,
      candidate.created_at desc
    limit 1
  ) assignment on true
  left join ref.role role on role.code = assignment.role
  left join public.agencies agency on agency.id = coalesce(assignment.agency_id, profile.agency_id)
  left join public.actor_profile_media media
    on media.actor_id = profile.id and media.deleted_at is null
  order by profile.full_name nulls last, account.email;
end
$function$;

revoke all on function public.cfc_admin_list_staff() from public, anon;
grant execute on function public.cfc_admin_list_staff() to authenticated;

create or replace function public.cfc_register_invited_staff(
  p_user_id uuid,
  p_full_name text,
  p_role text,
  p_agency uuid default null,
  p_job_title text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_pole text;
  v_scope text;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:users')) then
    raise exception 'admin_users_forbidden' using errcode = '42501';
  end if;
  if p_user_id is null or length(trim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'invalid_staff_profile' using errcode = '22023';
  end if;
  if exists (select 1 from public.staff_profiles profile where profile.id = p_user_id) then
    raise exception 'staff_profile_already_exists' using errcode = '23505';
  end if;

  if not exists (
    select 1
    from auth.users account
    join public.actors actor on actor.id = account.id
    where account.id = p_user_id
      and account.email_confirmed_at is null
      and actor.actor_type = 'staff'
      and actor.deleted_at is null
      and not exists (select 1 from public.citizen_profiles citizen where citizen.id = account.id)
  ) then
    raise exception 'pending_staff_invitation_required' using errcode = '22023';
  end if;

  select role.pole_code, role.scope into v_pole, v_scope
  from ref.role role
  where role.code = p_role and role.deleted_at is null;
  if not found then
    raise exception 'unknown_role:%', p_role using errcode = '22023';
  end if;
  if p_agency is not null and not exists (
    select 1 from public.agencies agency where agency.id = p_agency and agency.deleted_at is null
  ) then
    raise exception 'unknown_agency' using errcode = '22023';
  end if;

  insert into public.staff_profiles (id, full_name, pole, job_title, agency_id, initials)
  values (
    p_user_id,
    trim(p_full_name),
    v_pole,
    nullif(trim(coalesce(p_job_title, '')), ''),
    p_agency,
    upper(left(regexp_replace(trim(p_full_name), '\s+', '', 'g'), 2))
  );

  insert into public.staff_assignments (actor_id, role, scope, agency_id)
  values (p_user_id, p_role, v_scope, p_agency);

  return p_user_id;
end
$function$;

revoke all on function public.cfc_register_invited_staff(uuid, text, text, uuid, text) from public, anon;
grant execute on function public.cfc_register_invited_staff(uuid, text, text, uuid, text) to authenticated;

create or replace function public.cfc_set_user_role(
  p_user_id uuid,
  p_role text,
  p_agency uuid default null
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_scope text;
  v_pole text;
  v_current_role text;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:roles')) then
    raise exception 'admin_roles_forbidden' using errcode = '42501';
  end if;

  select role.scope, role.pole_code into v_scope, v_pole
  from ref.role role where role.code = p_role and role.deleted_at is null;
  if not found then
    raise exception 'unknown_role:%', p_role using errcode = '22023';
  end if;
  if p_agency is not null and not exists (
    select 1 from public.agencies agency where agency.id = p_agency and agency.deleted_at is null
  ) then
    raise exception 'unknown_agency' using errcode = '22023';
  end if;

  select assignment.role into v_current_role
  from public.staff_assignments assignment
  where assignment.actor_id = p_user_id
    and assignment.deleted_at is null
    and assignment.starts_at <= now()
    and (assignment.ends_at is null or assignment.ends_at > now())
  order by assignment.starts_at desc, assignment.created_at desc
  limit 1;

  if v_current_role = 'ADMIN' and p_role <> 'ADMIN'
     and (select count(*) from public.staff_assignments assignment
          join public.staff_profiles profile on profile.id = assignment.actor_id
          join auth.users account on account.id = assignment.actor_id
          where assignment.role = 'ADMIN'
            and assignment.deleted_at is null
            and assignment.starts_at <= now()
            and (assignment.ends_at is null or assignment.ends_at > now())
            and profile.deleted_at is null
            and (account.banned_until is null or account.banned_until <= now())) <= 1 then
    raise exception 'cannot_remove_last_admin' using errcode = '22023';
  end if;

  update public.staff_assignments
  set deleted_at = now(), ends_at = coalesce(ends_at, now())
  where actor_id = p_user_id and deleted_at is null;

  insert into public.staff_assignments (actor_id, role, scope, agency_id)
  values (p_user_id, p_role, v_scope, p_agency);

  update public.staff_profiles
  set pole = v_pole, agency_id = coalesce(p_agency, agency_id)
  where id = p_user_id and deleted_at is null;
end
$function$;

create or replace function public.cfc_set_user_active(p_user_id uuid, p_active boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_last_role text;
  v_last_scope text;
  v_last_agency uuid;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:users')) then
    raise exception 'admin_users_forbidden' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) and not p_active then
    raise exception 'cannot_disable_self' using errcode = '22023';
  end if;

  if not p_active and exists (
    select 1 from public.staff_assignments assignment
    where assignment.actor_id = p_user_id
      and assignment.role = 'ADMIN'
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
  ) and (
    select count(*) from public.staff_assignments assignment
    join public.staff_profiles profile on profile.id = assignment.actor_id
    join auth.users account on account.id = assignment.actor_id
    where assignment.role = 'ADMIN'
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
      and profile.deleted_at is null
      and (account.banned_until is null or account.banned_until <= now())
  ) <= 1 then
    raise exception 'cannot_disable_last_admin' using errcode = '22023';
  end if;

  if p_active then
    update public.staff_profiles set deleted_at = null, deleted_by = null where id = p_user_id;
    update auth.users set banned_until = null where id = p_user_id;

    if not exists (
      select 1 from public.staff_assignments assignment
      where assignment.actor_id = p_user_id
        and assignment.deleted_at is null
        and assignment.starts_at <= now()
        and (assignment.ends_at is null or assignment.ends_at > now())
    ) then
      select assignment.role, assignment.scope, assignment.agency_id
        into v_last_role, v_last_scope, v_last_agency
      from public.staff_assignments assignment
      where assignment.actor_id = p_user_id
      order by assignment.starts_at desc, assignment.created_at desc
      limit 1;

      if v_last_role is null then
        raise exception 'no_previous_staff_assignment' using errcode = '22023';
      end if;

      insert into public.staff_assignments (actor_id, role, scope, agency_id)
      values (p_user_id, v_last_role, v_last_scope, v_last_agency);
    end if;
  else
    update public.staff_profiles
    set deleted_at = now(), deleted_by = (select auth.uid())
    where id = p_user_id;
    update public.staff_assignments
    set deleted_at = now(), deleted_by = (select auth.uid()), ends_at = coalesce(ends_at, now())
    where actor_id = p_user_id and deleted_at is null;
    update auth.users set banned_until = 'infinity'::timestamptz where id = p_user_id;
  end if;

  return true;
end
$function$;

revoke all on function public.cfc_set_user_role(uuid, text, uuid) from public, anon;
grant execute on function public.cfc_set_user_role(uuid, text, uuid) to authenticated;
revoke all on function public.cfc_set_user_active(uuid, boolean) from public, anon;
grant execute on function public.cfc_set_user_active(uuid, boolean) to authenticated;
