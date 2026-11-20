-- Return only regions that the existing agency resolver can actually route.
-- The Guichet may view this minimal catalogue without reading staff records.
create or replace function public.cfc_staff_intake_regions()
returns table(region text, is_diaspora_desk boolean)
language sql
stable
security definer
set search_path = ''
as $function$
  select distinct agency.region, agency.is_diaspora_desk
  from public.agencies agency
  where agency.deleted_at is null
    and nullif(trim(agency.region), '') is not null
    and (select auth.uid()) is not null
    and (select private.has_capability((select private.current_role()), 'dossier:create'))
    and exists (
      select 1
      from public.staff_assignments assignment
      join public.staff_profiles staff_profile
        on staff_profile.id = assignment.actor_id
       and staff_profile.deleted_at is null
      join public.actors staff_actor
        on staff_actor.id = assignment.actor_id
       and staff_actor.actor_type = 'staff'
       and staff_actor.deleted_at is null
      join auth.users staff_user
        on staff_user.id = assignment.actor_id
       and staff_user.deleted_at is null
      join public.agencies staff_agency
        on staff_agency.id = coalesce(assignment.agency_id, staff_profile.agency_id)
       and staff_agency.deleted_at is null
       and staff_agency.region = agency.region
      where assignment.role = 'GESTIONNAIRE'
        and assignment.deleted_at is null
        and assignment.starts_at <= now()
        and (assignment.ends_at is null or assignment.ends_at > now())
    )
  order by agency.is_diaspora_desk, agency.region;
$function$;

revoke all on function public.cfc_staff_intake_regions() from public, anon;
grant execute on function public.cfc_staff_intake_regions() to authenticated;
