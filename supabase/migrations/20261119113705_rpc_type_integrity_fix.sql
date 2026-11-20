-- Keep process pilots multi-valued as modeled by ref.process.pilote, and make
-- the regional roster return types match its declared Postgres API exactly.

drop function if exists public.cfc_save_process(text, text, text, text, text);

create or replace function public.cfc_save_process(
  p_code text,
  p_label text,
  p_family text default 'realisation',
  p_pilote text[] default '{}'::text[],
  p_priority text default 'standard'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_role text := (select private.current_role());
begin
  if not (select private.has_capability(v_role, 'workflow:manage')) then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_code, ''))) = 0 or length(trim(coalesce(p_label, ''))) = 0 then
    raise exception 'invalid_process_identity' using errcode = '22023';
  end if;
  if p_family not in ('pilotage', 'realisation', 'support', 'ecosysteme') then
    raise exception 'invalid_family' using errcode = '22023';
  end if;
  if p_priority not in ('prioritaire', 'standard') then
    raise exception 'invalid_priority' using errcode = '22023';
  end if;

  insert into ref.process (code, label, family, pilote, priority)
  values (
    upper(trim(p_code)),
    trim(p_label),
    p_family,
    coalesce(p_pilote, '{}'::text[]),
    p_priority
  )
  on conflict (code) do update
    set label = excluded.label,
        family = excluded.family,
        pilote = excluded.pilote,
        priority = excluded.priority,
        deleted_at = null,
        updated_at = now();

  return jsonb_build_object('code', upper(trim(p_code)));
end
$function$;

revoke all on function public.cfc_save_process(text, text, text, text[], text) from public, anon;
grant execute on function public.cfc_save_process(text, text, text, text[], text) to authenticated, service_role;

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
    coalesce(nullif(trim(staff.full_name), ''), auth_user.email)::text,
    auth_user.email::text,
    staff_agency.label::text
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
