
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
      v_dossier.owner_user_id, 'dossier.updated',
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
;
