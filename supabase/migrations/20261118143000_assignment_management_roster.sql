-- Return the active regional GESTIONNAIRE roster to an authorized admin for
-- the manual reassignment control. The RPC keeps auth.users and staff records
-- behind the database boundary and applies the same eligibility rules as the
-- transactional reassignment function.
create or replace function public.list_regional_managers_for_dossier(p_dossier_id uuid)
returns table(user_id uuid, full_name text, email text, agency_label text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  dossier_region text;
begin
  if (select private.current_role()) <> 'ADMIN'
     or not (select private.has_capability('ADMIN', 'admin:users')) then
    raise exception 'regional_manager_roster_forbidden' using errcode = '42501';
  end if;

  select dossier_agency.region into dossier_region
  from public.dossiers dossier
  join public.agencies dossier_agency on dossier_agency.id = dossier.agency_id
  where dossier.id = p_dossier_id and dossier.deleted_at is null;

  if dossier_region is null then
    raise exception 'dossier_region_required' using errcode = '23514';
  end if;

  return query
  select
    staff.id,
    coalesce(nullif(trim(staff.full_name), ''), auth_user.email),
    auth_user.email,
    staff_agency.label
  from public.staff_profiles staff
  join public.actors actor on actor.id = staff.id and actor.deleted_at is null
  join auth.users auth_user on auth_user.id = staff.id and auth_user.deleted_at is null
  join public.staff_assignments assignment on assignment.actor_id = staff.id
    and assignment.role = 'GESTIONNAIRE'
    and assignment.deleted_at is null
    and assignment.starts_at <= now()
    and (assignment.ends_at is null or assignment.ends_at > now())
  join public.agencies staff_agency
    on staff_agency.id = coalesce(assignment.agency_id, staff.agency_id)
    and staff_agency.deleted_at is null
    and staff_agency.region = dossier_region
  where staff.deleted_at is null
  order by lower(coalesce(nullif(trim(staff.full_name), ''), auth_user.email)), staff.id;
end
$function$;

revoke all on function public.list_regional_managers_for_dossier(uuid) from public, anon;
grant execute on function public.list_regional_managers_for_dossier(uuid) to authenticated;
