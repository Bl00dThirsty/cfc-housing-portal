
create or replace function public.cfc_save_process(
  p_code text,
  p_label text,
  p_family text default 'realisation',
  p_pilote text default null,
  p_priority text default 'standard'
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'workflow:manage')) then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if p_family not in ('pilotage','realisation','support','ecosysteme') then
    raise exception 'invalid_family' using errcode = '22023';
  end if;
  if p_priority not in ('prioritaire','standard') then
    raise exception 'invalid_priority' using errcode = '22023';
  end if;

  insert into ref.process (code, label, family, pilote, priority)
  values (upper(trim(p_code)), trim(p_label), p_family, p_pilote, p_priority)
  on conflict (code) do update
    set label = excluded.label,
        family = excluded.family,
        pilote = excluded.pilote,
        priority = excluded.priority,
        deleted_at = null;

  return jsonb_build_object('code', upper(trim(p_code)));
end $$;
grant execute on function public.cfc_save_process(text, text, text, text, text) to authenticated;

create or replace function public.cfc_save_process_step(
  p_code text,
  p_process_code text,
  p_label text,
  p_phase text default null,
  p_lane text default 'agence',
  p_sla_days int default null,
  p_is_external boolean default false
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'workflow:manage')) then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from ref.process p where p.code = upper(trim(p_process_code)) and p.deleted_at is null) then
    raise exception 'unknown_process:%', p_process_code using errcode = '22023';
  end if;
  if length(trim(coalesce(p_label, ''))) = 0 then
    raise exception 'invalid_label' using errcode = '22023';
  end if;
  if p_lane not in ('client','agence','siege','partenaires','support') then
    raise exception 'invalid_lane' using errcode = '22023';
  end if;
  if p_phase is not null and p_phase not in
     ('kyc_savings','risk_bet','committees','notary_mortgage','disbursements','closing_release') then
    raise exception 'invalid_phase' using errcode = '22023';
  end if;
  if p_sla_days is not null and p_sla_days <= 0 then
    raise exception 'invalid_sla' using errcode = '22023';
  end if;

  insert into ref.process_step (code, process_code, label, phase, lane, sla_days, is_external)
  values (upper(trim(p_code)), upper(trim(p_process_code)), trim(p_label), p_phase, p_lane, p_sla_days, p_is_external)
  on conflict (code) do update
    set process_code = excluded.process_code,
        label = excluded.label,
        phase = excluded.phase,
        lane = excluded.lane,
        sla_days = excluded.sla_days,
        is_external = excluded.is_external,
        deleted_at = null;

  return jsonb_build_object('code', upper(trim(p_code)), 'process_code', upper(trim(p_process_code)));
end $$;
grant execute on function public.cfc_save_process_step(text, text, text, text, text, int, boolean) to authenticated;

create or replace function public.cfc_delete_process_step(p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'workflow:manage')) then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.dossiers d where d.current_step = p_code and d.deleted_at is null) then
    raise exception 'step_in_use' using errcode = '23503';
  end if;
  update ref.process_step set deleted_at = now(), deleted_by = (select auth.uid())
  where code = p_code and deleted_at is null;
  return found;
end $$;
grant execute on function public.cfc_delete_process_step(text) to authenticated;

create or replace function public.cfc_delete_role(p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'admin:roles')) then
    raise exception 'admin_roles_forbidden' using errcode = '42501';
  end if;
  if p_code = 'ADMIN' then
    raise exception 'role_protected' using errcode = '42501';
  end if;
  if exists (select 1 from public.staff_assignments sa where sa.role = p_code and sa.deleted_at is null) then
    raise exception 'role_in_use' using errcode = '23503';
  end if;
  update ref.role set deleted_at = now(), deleted_by = (select auth.uid())
  where code = p_code and deleted_at is null;
  return found;
end $$;
grant execute on function public.cfc_delete_role(text) to authenticated;

create or replace function public.cfc_update_staff_user(
  p_user_id uuid,
  p_full_name text,
  p_job_title text default null,
  p_phone text default null
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'admin:users')) then
    raise exception 'admin_users_forbidden' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  update public.staff_profiles
     set full_name = trim(p_full_name),
         job_title = p_job_title,
         phone = p_phone,
         initials = upper(left(regexp_replace(trim(p_full_name), '\s+', '', 'g'), 2))
   where id = p_user_id and deleted_at is null;
  return found;
end $$;
grant execute on function public.cfc_update_staff_user(uuid, text, text, text) to authenticated;

create or replace function public.cfc_set_user_active(p_user_id uuid, p_active boolean)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'admin:users')) then
    raise exception 'admin_users_forbidden' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_disable_self' using errcode = '22023';
  end if;

  if p_active then
    update public.staff_profiles set deleted_at = null, deleted_by = null where id = p_user_id;
    update auth.users set banned_until = null where id = p_user_id;
  else
    update public.staff_profiles set deleted_at = now(), deleted_by = (select auth.uid()) where id = p_user_id;
    update public.staff_assignments
       set deleted_at = now(), deleted_by = (select auth.uid()), ends_at = coalesce(ends_at, now())
     where actor_id = p_user_id and deleted_at is null;
    update auth.users set banned_until = 'infinity'::timestamptz where id = p_user_id;
  end if;
  return true;
end $$;
grant execute on function public.cfc_set_user_active(uuid, boolean) to authenticated;

create or replace function public.cfc_cancel_email(p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'email:manage')) then
    raise exception 'email_forbidden' using errcode = '42501';
  end if;
  update public.email_deliveries
     set status = 'cancelled'
   where id = p_id and status in ('queued', 'failed');
  return found;
end $$;
grant execute on function public.cfc_cancel_email(uuid) to authenticated;

create or replace function public.cfc_requeue_email(p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'email:manage')) then
    raise exception 'email_forbidden' using errcode = '42501';
  end if;
  update public.email_deliveries
     set status = 'queued', error_message = null, provider = null, sent_at = null
   where id = p_id and status in ('cancelled', 'failed');
  return found;
end $$;
grant execute on function public.cfc_requeue_email(uuid) to authenticated;

create or replace function public.cfc_mark_email_sent(p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'email:manage')) then
    raise exception 'email_forbidden' using errcode = '42501';
  end if;
  update public.email_deliveries
     set status = 'sent', sent_at = now(), provider = coalesce(provider, 'manual')
   where id = p_id and status in ('queued', 'sending', 'failed');
  return found;
end $$;
grant execute on function public.cfc_mark_email_sent(uuid) to authenticated;
;
