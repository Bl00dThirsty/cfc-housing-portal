begin;

create or replace function private.can_act_on_document(
  p_dossier_id uuid,
  p_doc_type_code text,
  p_chemise_code text,
  p_action text
) returns boolean
language sql stable security definer set search_path = '' as $$
  with actor as (
    select (select auth.uid()) as actor_id, (select private.current_role()) as role_code
  ),
  dossier as (
    select d.id, d.citizen_id, d.owner_user_id, d.agency_id, d.is_diaspora,
           d.service_code, d.current_phase, a.role_code, a.actor_id
    from public.dossiers d
    cross join actor a
    where d.id = p_dossier_id and d.deleted_at is null
  ),
  eligible_requirement as (
    select r.stage
    from dossier d
    join ref.service_document_requirement r on r.service_code = d.service_code
    join ref.document_stage_phase stage on stage.stage_code = r.stage and stage.deleted_at is null
    join ref.document_type type on type.code = r.doc_type_code and type.deleted_at is null
    where r.doc_type_code = p_doc_type_code
      and r.deleted_at is null
      and r.effective_from <= current_date
      and (r.effective_to is null or r.effective_to >= current_date)
      and type.chemise_code = p_chemise_code
      and d.current_phase = stage.phase_code
  )
  select case
    when p_action not in ('upload', 'validate', 'reject') then false
    when not exists (select 1 from eligible_requirement) then false
    when p_chemise_code = 'C1'
      and p_action in ('validate', 'reject')
      and exists (select 1 from dossier d where d.role_code is not null and d.role_code <> 'GESTIONNAIRE') then false
    when p_action = 'upload' and exists (
      select 1 from dossier d
      where d.role_code is null and d.citizen_id = d.actor_id and p_chemise_code = 'C1'
    ) then true
    when not exists (
      select 1
      from dossier d
      join eligible_requirement r on true
      join ref.document_stage_role_policy policy
        on policy.stage_code = r.stage
       and policy.role_code = d.role_code
       and policy.action = p_action
       and policy.enabled
       and policy.deleted_at is null
      where private.has_capability(
        d.role_code,
        case p_action when 'upload' then 'document:upload'
          when 'validate' then 'document:validate' else 'document:reject' end
      )
        and private.can_act_on_dossier(
          (select private.current_pole()), d.owner_user_id, d.agency_id, d.is_diaspora, d.id
        )
    ) then false
    else true
  end;
$$;

revoke all on function private.can_act_on_document(uuid, text, text, text) from public;
grant execute on function private.can_act_on_document(uuid, text, text, text) to authenticated, service_role;

create or replace view public.cfc_role
with (security_invoker = true) as
  select code, label, description, pole_code, scope, landing_path, sort_order, deleted_at
  from ref.role;
grant select on public.cfc_role to authenticated;
grant all on public.cfc_role to service_role;

create or replace function public.cfc_set_document_stage_role_policy(
  p_stage_code text,
  p_role_code text,
  p_action text,
  p_enabled boolean
) returns void
language plpgsql security definer set search_path = '' as $function$
begin
  if not private.has_capability((select private.current_role()), 'workflow:manage') then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if p_stage_code is null or p_role_code is null or p_action not in ('upload', 'validate', 'reject')
     or p_enabled is null then
    raise exception 'invalid_document_stage_policy' using errcode = '22023';
  end if;
  if not exists (
    select 1 from ref.role where code = p_role_code and deleted_at is null
  ) then raise exception 'active_role_required' using errcode = '22023'; end if;

  insert into ref.document_stage_role_policy(stage_code, role_code, action, enabled)
  values (p_stage_code, p_role_code, p_action, p_enabled)
  on conflict (stage_code, role_code, action) do update
    set enabled = excluded.enabled,
        deleted_at = null,
        deleted_by = null,
        updated_at = now(),
        updated_by = (select auth.uid());
end;
$function$;

create or replace function public.cfc_set_document_stage_phase(
  p_stage_code text,
  p_phase_code text
) returns void
language plpgsql security definer set search_path = '' as $function$
begin
  if not private.has_capability((select private.current_role()), 'workflow:manage') then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if p_stage_code is null or p_phase_code is null then
    raise exception 'invalid_document_stage_phase' using errcode = '22023';
  end if;

  update ref.document_stage_phase
  set phase_code = p_phase_code,
      updated_at = now(),
      updated_by = (select auth.uid())
  where stage_code = p_stage_code and deleted_at is null;
  if not found then raise exception 'document_stage_not_found' using errcode = 'P0002'; end if;
end;
$function$;

revoke all on function public.cfc_set_document_stage_role_policy(text, text, text, boolean) from public, anon;
grant execute on function public.cfc_set_document_stage_role_policy(text, text, text, boolean) to authenticated, service_role;
revoke all on function public.cfc_set_document_stage_phase(text, text) from public, anon;
grant execute on function public.cfc_set_document_stage_phase(text, text) to authenticated, service_role;

-- Configuration changes must pass through audited RPCs instead of direct
-- writes to policy tables.
revoke insert, update, delete on ref.document_stage_phase, ref.document_stage_role_policy from authenticated;
grant select on ref.document_stage_phase, ref.document_stage_role_policy to authenticated;

commit;
