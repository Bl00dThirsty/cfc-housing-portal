
create or replace function public.cfc_my_context()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'user_id', (select auth.uid()),
    'email', (select u.email from auth.users u where u.id = (select auth.uid())),
    'role', (select private.current_role()),
    'pole', (select private.current_pole()),
    'scope', (select private.role_scope((select private.current_role()))),
    'agency_id', (select private.actor_agency_id()),
    'full_name', (select sp.full_name from public.staff_profiles sp where sp.id = (select auth.uid()) and sp.deleted_at is null),
    'job_title', (select sp.job_title from public.staff_profiles sp where sp.id = (select auth.uid()) and sp.deleted_at is null),
    'initials', (select sp.initials from public.staff_profiles sp where sp.id = (select auth.uid()) and sp.deleted_at is null),
    'capabilities', coalesce((
      select jsonb_agg(rc.capability order by rc.capability)
      from ref.role_capability rc
      where rc.role_code = (select private.current_role()) and rc.deleted_at is null
    ), '[]'::jsonb)
  );
$$;
grant execute on function public.cfc_my_context() to authenticated;

create or replace function public.cfc_notify(
  p_recipient uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_dossier_id uuid default null,
  p_action_url text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_recipient is distinct from (select auth.uid())
     and (select private."current_role"()) is null then
    raise exception 'notify_forbidden' using errcode = '42501';
  end if;
  insert into public.notifications (recipient_user_id, type, title, body, dossier_id, action_url)
  values (p_recipient, p_type, p_title, p_body, p_dossier_id, p_action_url)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.cfc_notify(uuid, text, text, text, uuid, text) to authenticated;

create or replace function public.cfc_queue_email(
  p_template_code text,
  p_recipient text,
  p_subject text,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'email:send')
          or (select private.has_capability(v_role, 'email:manage'))) then
    raise exception 'email_forbidden' using errcode = '42501';
  end if;
  insert into public.email_deliveries (template_code, recipient_email, subject, payload, status)
  values (p_template_code, p_recipient, p_subject, coalesce(p_payload, '{}'::jsonb), 'queued')
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.cfc_queue_email(text, text, text, jsonb) to authenticated;

create or replace function public.cfc_advance_dossier(
  p_dossier_id uuid,
  p_step_code text,
  p_event_type text default 'STEP_ADVANCED',
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text := (select private."current_role"());
  v_step_phase text;
  v_step_label text;
  v_step_process text;
  v_step_sla smallint;
  v_total int;
  v_index int;
  v_progress smallint;
  v_dossier public.dossiers;
  v_event uuid;
begin
  if not (select private.has_capability(v_role, 'workflow:execute')) then
    raise exception 'workflow_execute_forbidden' using errcode = '42501';
  end if;

  select s.phase, s.label, s.process_code, s.sla_days
    into v_step_phase, v_step_label, v_step_process, v_step_sla
  from ref.process_step s
  where s.code = p_step_code and s.deleted_at is null;

  if v_step_label is null then
    raise exception 'step_not_found:%', p_step_code using errcode = '22023';
  end if;

  select * into v_dossier from public.dossiers d
  where d.id = p_dossier_id and d.deleted_at is null;

  if v_dossier.id is null then
    raise exception 'dossier_not_found' using errcode = '22023';
  end if;

  if not (select private.can_act_on_dossier(
      (select private.current_pole()),
      v_dossier.owner_user_id, v_dossier.agency_id,
      v_dossier.is_diaspora, v_dossier.id)) then
    raise exception 'dossier_forbidden' using errcode = '42501';
  end if;

  select count(*)::int into v_total
  from ref.process_step s
  where s.process_code = v_step_process and s.deleted_at is null;

  select count(*)::int into v_index
  from ref.process_step s
  where s.process_code = v_step_process and s.deleted_at is null
    and s.code <= p_step_code;

  v_progress := case when v_total = 0 then 100
                     else least(100, round(v_index::numeric / v_total * 100))::smallint end;

  update public.dossiers
     set current_step = p_step_code,
         current_phase = coalesce(v_step_phase, current_phase),
         entered_phase_at = now(),
         sla_deadline = case when v_step_sla is null then sla_deadline
                             else now() + make_interval(days => v_step_sla) end,
         progress = greatest(progress, v_progress)
   where id = p_dossier_id;

  v_event := private.append_dossier_event(
    p_dossier_id, p_event_type,
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('step', p_step_code, 'label', v_step_label, 'process', v_step_process),
    null, null, null);

  if v_dossier.owner_user_id is not null and v_dossier.owner_user_id <> (select auth.uid()) then
    perform public.cfc_notify(
      v_dossier.owner_user_id, 'workflow',
      'Etape franchie : ' || v_step_label,
      'Le dossier ' || v_dossier.duc_code || ' est desormais a l etape ' || p_step_code || '.',
      p_dossier_id, '/dossiers/' || p_dossier_id::text);
  end if;

  return jsonb_build_object(
    'dossier_id', p_dossier_id,
    'step', p_step_code,
    'phase', v_step_phase,
    'progress', v_progress,
    'event_id', v_event);
end $$;
grant execute on function public.cfc_advance_dossier(uuid, text, text, jsonb) to authenticated;

create or replace function public.cfc_create_staff_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_agency uuid default null,
  p_job_title text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_pole text;
  v_scope text;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:users')) then
    raise exception 'admin_users_forbidden' using errcode = '42501';
  end if;
  if p_email is null or position('@' in p_email) < 2 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'weak_password' using errcode = '22023';
  end if;

  select r.pole_code, r.scope into v_pole, v_scope
  from ref.role r where r.code = p_role and r.deleted_at is null;
  if not found then
    raise exception 'unknown_role:%', p_role using errcode = '22023';
  end if;
  if exists (select 1 from auth.users u where u.email = p_email) then
    raise exception 'email_already_used' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, email_change_confirm_status,
    phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    lower(p_email), extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '', '', '', '', '', 0, '', '', '',
    jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role',p_role),
    jsonb_build_object('full_name', p_full_name), false, false
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id::text, v_id,
          jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true),
          'email', now(), now(), now());

  insert into public.staff_profiles (id, full_name, pole, job_title, agency_id, initials)
  values (v_id, p_full_name, v_pole, p_job_title, p_agency,
          upper(left(regexp_replace(p_full_name, '\s+', '', 'g'), 2)));

  insert into public.staff_assignments (actor_id, role, scope, agency_id)
  values (v_id, p_role, v_scope, p_agency);

  return v_id;
end $$;
grant execute on function public.cfc_create_staff_user(text, text, text, text, uuid, text) to authenticated;

create or replace function public.cfc_set_user_role(
  p_user_id uuid,
  p_role text,
  p_agency uuid default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_scope text; v_pole text;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:roles')) then
    raise exception 'admin_roles_forbidden' using errcode = '42501';
  end if;
  select r.scope, r.pole_code into v_scope, v_pole
  from ref.role r where r.code = p_role and r.deleted_at is null;
  if not found then
    raise exception 'unknown_role:%', p_role using errcode = '22023';
  end if;

  update public.staff_assignments
     set deleted_at = now(),
         ends_at = coalesce(ends_at, now())
   where actor_id = p_user_id and deleted_at is null;

  insert into public.staff_assignments (actor_id, role, scope, agency_id)
  values (p_user_id, p_role, v_scope, p_agency);

  update public.staff_profiles
     set pole = v_pole,
         agency_id = coalesce(p_agency, agency_id)
   where id = p_user_id;
end $$;
grant execute on function public.cfc_set_user_role(uuid, text, uuid) to authenticated;

create or replace function public.cfc_set_role_capabilities(
  p_role text,
  p_caps text[]
) returns int
language plpgsql security definer set search_path = ''
as $$
declare v_count int;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:roles')) then
    raise exception 'admin_roles_forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from ref.role r where r.code = p_role and r.deleted_at is null) then
    raise exception 'unknown_role:%', p_role using errcode = '22023';
  end if;

  delete from ref.role_capability rc where rc.role_code = p_role;

  insert into ref.role_capability (role_code, capability)
  select p_role, c
  from unnest(coalesce(p_caps, array[]::text[])) as c
  where exists (select 1 from ref.capability cap where cap.code = c and cap.deleted_at is null);

  select count(*)::int into v_count from ref.role_capability rc where rc.role_code = p_role;
  return v_count;
end $$;
grant execute on function public.cfc_set_role_capabilities(text, text[]) to authenticated;

create or replace function public.cfc_save_role(
  p_code text,
  p_label text,
  p_description text,
  p_pole text,
  p_scope text,
  p_landing text,
  p_caps text[]
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_existing_scope text;
begin
  if not (select private.has_capability((select private."current_role"()), 'admin:roles')) then
    raise exception 'admin_roles_forbidden' using errcode = '42501';
  end if;
  if p_scope not in ('OWN_AGENCY','OWN_PORTFOLIO','OWN_FILES','ALL','DIASPORA_FILES') then
    raise exception 'invalid_scope' using errcode = '22023';
  end if;

  select min(r.scope) into v_existing_scope
  from ref.role r where r.pole_code = p_pole and r.deleted_at is null and r.code <> p_code;

  if v_existing_scope is not null and v_existing_scope <> p_scope then
    raise exception 'pole_scope_conflict:%', p_pole using errcode = '22023';
  end if;

  if not exists (select 1 from ref.pole p where p.code = p_pole) then
    insert into ref.pole (code, label, sort_order) values (p_pole, p_pole, 999);
  end if;

  insert into ref.role (code, label, description, pole_code, scope, landing_path, sort_order)
  values (p_code, p_label, p_description, p_pole, p_scope, coalesce(p_landing, '/dossiers'), 500)
  on conflict (code) do update
    set label = excluded.label, description = excluded.description,
        pole_code = excluded.pole_code, scope = excluded.scope,
        landing_path = excluded.landing_path, deleted_at = null;

  perform public.cfc_set_role_capabilities(p_code, p_caps);

  return jsonb_build_object('code', p_code, 'capabilities',
    (select count(*)::int from ref.role_capability rc where rc.role_code = p_code));
end $$;
grant execute on function public.cfc_save_role(text, text, text, text, text, text, text[]) to authenticated;
;
