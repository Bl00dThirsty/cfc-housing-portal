-- Shared contact details must reach every live request copy. A legal-name
-- correction is request-scoped so the assigned manager is unambiguous.
create or replace function public.update_own_profile(
  p_full_name text,
  p_phone text
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_type text;
  v_kyc_state text;
  v_submitted_at timestamptz;
  v_phone text := nullif(trim(p_phone), '');
  v_current_name text;
begin
  if v_actor_id is null then
    raise exception 'profile_session_required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_full_name, ''))) not between 2 and 160 then
    raise exception 'profile_name_invalid' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'profile_phone_invalid' using errcode = '22023';
  end if;

  select actor.actor_type into v_actor_type
  from public.actors actor
  where actor.id = v_actor_id and actor.deleted_at is null;

  if v_actor_type = 'citizen' then
    select profile.full_name, profile.kyc_state, kyc.submitted_at
      into v_current_name, v_kyc_state, v_submitted_at
    from public.citizen_profiles profile
    left join public.kyc_profiles kyc on kyc.citizen_id = profile.id
    where profile.id = v_actor_id and profile.deleted_at is null
    for update of profile;

    if not found then
      raise exception 'profile_not_found' using errcode = 'P0002';
    end if;
    if p_full_name is distinct from v_current_name and (
      v_kyc_state not in ('pre_boarding', 'identity_capture')
      or v_submitted_at is not null
    ) then
      raise exception 'profile_name_review_required' using errcode = '42501';
    end if;

    update public.citizen_profiles
    set full_name = trim(p_full_name),
        phone = v_phone,
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_actor_id;

    update public.dossiers
    set name = trim(p_full_name),
        phone = v_phone,
        updated_at = now(),
        updated_by = v_actor_id
    where citizen_id = v_actor_id
      and deleted_at is null
      and status <> 'closed';
    return;
  end if;

  if v_actor_type = 'staff' then
    if (select private.current_role()) is null then
      raise exception 'profile_staff_assignment_required' using errcode = '42501';
    end if;
    update public.staff_profiles
    set full_name = trim(p_full_name),
        phone = v_phone,
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_actor_id and deleted_at is null;
    if not found then
      raise exception 'profile_not_found' using errcode = 'P0002';
    end if;
    return;
  end if;

  raise exception 'profile_actor_forbidden' using errcode = '42501';
end
$function$;

revoke all on function public.update_own_profile(text, text) from public, anon;
grant execute on function public.update_own_profile(text, text) to authenticated;

drop function if exists public.request_citizen_name_correction(text, text);

create function public.request_citizen_name_correction(
  p_dossier_id uuid,
  p_requested_full_name text,
  p_reason text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_kyc_state text;
  v_submitted_at timestamptz;
  v_current_name text;
  v_dossier public.dossiers%rowtype;
  v_manager_id uuid;
  v_request_id uuid;
begin
  if v_actor_id is null then
    raise exception 'profile_session_required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_requested_full_name, ''))) not between 2 and 160 then
    raise exception 'profile_name_invalid' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_reason, ''))) not between 10 and 1000 then
    raise exception 'profile_name_correction_reason_required' using errcode = '22023';
  end if;

  select profile.full_name, profile.kyc_state, kyc.submitted_at
    into v_current_name, v_kyc_state, v_submitted_at
  from public.citizen_profiles profile
  left join public.kyc_profiles kyc on kyc.citizen_id = profile.id
  where profile.id = v_actor_id and profile.deleted_at is null;

  if not found or (select actor.actor_type from public.actors actor where actor.id = v_actor_id) <> 'citizen' then
    raise exception 'profile_actor_forbidden' using errcode = '42501';
  end if;
  if v_kyc_state in ('pre_boarding', 'identity_capture') and v_submitted_at is null then
    raise exception 'profile_name_correction_not_required' using errcode = '22023';
  end if;
  if trim(p_requested_full_name) = coalesce(v_current_name, '') then
    raise exception 'profile_name_unchanged' using errcode = '22023';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.status <> 'closed'
    and dossier.deleted_at is null
  for update;
  if v_dossier.id is null then
    raise exception 'profile_name_correction_request_not_found' using errcode = '42501';
  end if;

  v_manager_id := v_dossier.owner_user_id;
  if v_manager_id is null or not exists (
    select 1
    from public.staff_assignments assignment
    where assignment.actor_id = v_manager_id
      and assignment.role = 'GESTIONNAIRE'
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
  ) then
    raise exception 'profile_name_correction_manager_unavailable' using errcode = '23514';
  end if;

  insert into public.citizen_profile_change_requests (
    citizen_id, dossier_id, requested_full_name, reason, created_by, updated_by
  ) values (
    v_actor_id, v_dossier.id, trim(p_requested_full_name), trim(p_reason), v_actor_id, v_actor_id
  ) returning id into v_request_id;

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, occurred_at, payload, created_by, updated_by
  ) values (
    v_dossier.id,
    'PROFILE_NAME_CORRECTION_REQUESTED',
    v_actor_id,
    'CITIZEN',
    now(),
    jsonb_build_object('change_request_id', v_request_id),
    v_actor_id,
    v_actor_id
  );

  insert into public.notifications (
    recipient_user_id, type, title, body, dossier_id, action_url, created_by, updated_by
  ) values (
    v_manager_id,
    'profile.name_correction_requested',
    'Demande de correction de nom',
    'Une demande attend votre vérification pour le dossier ' || v_dossier.duc_code || '.',
    v_dossier.id,
    '/portail-cfc/clients/' || v_dossier.id::text || '?tab=kyc',
    v_actor_id,
    v_actor_id
  );

  return v_request_id;
exception
  when unique_violation then
    raise exception 'profile_name_correction_pending' using errcode = '23505';
end
$function$;

revoke all on function public.request_citizen_name_correction(uuid, text, text) from public, anon;
grant execute on function public.request_citizen_name_correction(uuid, text, text) to authenticated;
