-- Regional portfolio assignment and least-privilege KYC access.
-- Assignment, audit history, and the staff notification commit atomically.

create table if not exists private.dossier_assignment_cursor (
  region text primary key,
  last_staff_id uuid references public.staff_profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.dossier_assignment_history (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  assigned_to uuid not null references public.staff_profiles (id),
  assigned_by uuid references auth.users (id) on delete set null,
  agency_id uuid references public.agencies (id) on delete set null,
  region text not null,
  assignment_method text not null check (assignment_method in ('round_robin', 'manual')),
  reason text,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint manual_assignment_requires_reason
    check (assignment_method <> 'manual' or length(trim(coalesce(reason, ''))) >= 10)
);

create unique index if not exists dossier_assignment_history_current_idx
  on public.dossier_assignment_history (dossier_id)
  where ended_at is null;
create index if not exists dossier_assignment_history_staff_idx
  on public.dossier_assignment_history (assigned_to, assigned_at desc);

alter table public.dossier_assignment_history enable row level security;
alter table public.dossier_assignment_history force row level security;
drop policy if exists dossier_assignment_history_read on public.dossier_assignment_history;
create policy dossier_assignment_history_read
  on public.dossier_assignment_history for select to authenticated
  using (
    assigned_to = (select auth.uid())
    or assigned_by = (select auth.uid())
    or (
      (select private.current_role()) = 'ADMIN'
      and (select private.has_capability('ADMIN', 'admin:users'))
    )
  );
grant select on public.dossier_assignment_history to authenticated;
revoke insert, update, delete on public.dossier_assignment_history from authenticated;
grant all on public.dossier_assignment_history to service_role;

create or replace function private.assign_dossier_to_manager(
  p_dossier_id uuid,
  p_requested_staff_id uuid default null,
  p_reason text default null
) returns table(staff_id uuid, staff_name text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_dossier_id uuid;
  v_owner_user_id uuid;
  v_agency_id uuid;
  v_duc_code text;
  v_region text;
  v_staff_id uuid;
  v_staff_name text;
  v_last_staff_id uuid;
  v_history_id uuid;
  v_method text;
  v_has_active_assignment boolean := false;
begin
  select d.id, d.owner_user_id, d.agency_id, d.duc_code, a.region
    into v_dossier_id, v_owner_user_id, v_agency_id, v_duc_code, v_region
  from public.dossiers d
  left join public.agencies a on a.id = d.agency_id
  where d.id = p_dossier_id and d.deleted_at is null
  for update of d;

  if v_dossier_id is null then
    raise exception 'dossier_not_found' using errcode = 'P0002';
  end if;
  if nullif(trim(v_region), '') is null then
    raise exception 'dossier_region_required' using errcode = '23514';
  end if;

  if p_requested_staff_id is not null then
    if (select private.current_role()) <> 'ADMIN'
       or not (select private.has_capability('ADMIN', 'admin:users')) then
      raise exception 'manual_assignment_forbidden' using errcode = '42501';
    end if;
    if length(trim(coalesce(p_reason, ''))) < 10 then
      raise exception 'manual_assignment_reason_required' using errcode = '22023';
    end if;

    select sp.id, coalesce(nullif(trim(sp.full_name), ''), u.email)
      into v_staff_id, v_staff_name
    from public.staff_profiles sp
    join public.actors actor on actor.id = sp.id and actor.deleted_at is null
    join auth.users u on u.id = sp.id and u.deleted_at is null
    join public.staff_assignments sa on sa.actor_id = sp.id
      and sa.role = 'GESTIONNAIRE'
      and sa.deleted_at is null
      and sa.starts_at <= now()
      and (sa.ends_at is null or sa.ends_at > now())
    join public.agencies staff_agency
      on staff_agency.id = coalesce(sa.agency_id, sp.agency_id)
      and staff_agency.deleted_at is null
      and staff_agency.region = v_region
    where sp.id = p_requested_staff_id and sp.deleted_at is null
    order by sp.id
    limit 1;

    if v_staff_id is null then
      raise exception 'staff_not_active_in_dossier_region' using errcode = '23514';
    end if;
    v_method := 'manual';
  else
    -- Keep a current regional manager when the citizen resumes a previously
    -- suspended application. Only stale, inactive, or non-manager owners rotate.
    if v_owner_user_id is not null then
      select sp.id, coalesce(nullif(trim(sp.full_name), ''), u.email)
        into v_staff_id, v_staff_name
      from public.staff_profiles sp
      join public.actors actor on actor.id = sp.id and actor.deleted_at is null
      join auth.users u on u.id = sp.id and u.deleted_at is null
      join public.staff_assignments sa on sa.actor_id = sp.id
        and sa.role = 'GESTIONNAIRE'
        and sa.deleted_at is null
        and sa.starts_at <= now()
        and (sa.ends_at is null or sa.ends_at > now())
      join public.agencies staff_agency
        on staff_agency.id = coalesce(sa.agency_id, sp.agency_id)
        and staff_agency.deleted_at is null
        and staff_agency.region = v_region
      where sp.id = v_owner_user_id and sp.deleted_at is null
      limit 1;

      if v_staff_id is not null then
        select exists (
          select 1 from public.dossier_assignment_history h
          where h.dossier_id = v_dossier_id
            and h.assigned_to = v_staff_id
            and h.ended_at is null
        ) into v_has_active_assignment;

        if v_has_active_assignment then
          return query select v_staff_id, v_staff_name;
          return;
        end if;
      end if;
    end if;

    insert into private.dossier_assignment_cursor(region)
      values (v_region)
      on conflict (region) do nothing;

    select cursor.last_staff_id into v_last_staff_id
    from private.dossier_assignment_cursor cursor
    where cursor.region = v_region
    for update;

    select sp.id, coalesce(nullif(trim(sp.full_name), ''), u.email)
      into v_staff_id, v_staff_name
    from public.staff_profiles sp
    join public.actors actor on actor.id = sp.id and actor.deleted_at is null
    join auth.users u on u.id = sp.id and u.deleted_at is null
    join public.staff_assignments sa on sa.actor_id = sp.id
      and sa.role = 'GESTIONNAIRE'
      and sa.deleted_at is null
      and sa.starts_at <= now()
      and (sa.ends_at is null or sa.ends_at > now())
    join public.agencies staff_agency
      on staff_agency.id = coalesce(sa.agency_id, sp.agency_id)
      and staff_agency.deleted_at is null
      and staff_agency.region = v_region
    where sp.deleted_at is null
      and (v_last_staff_id is null or sp.id > v_last_staff_id)
    order by sp.id
    limit 1;

    if v_staff_id is null then
      select sp.id, coalesce(nullif(trim(sp.full_name), ''), u.email)
        into v_staff_id, v_staff_name
      from public.staff_profiles sp
      join public.actors actor on actor.id = sp.id and actor.deleted_at is null
      join auth.users u on u.id = sp.id and u.deleted_at is null
      join public.staff_assignments sa on sa.actor_id = sp.id
        and sa.role = 'GESTIONNAIRE'
        and sa.deleted_at is null
        and sa.starts_at <= now()
        and (sa.ends_at is null or sa.ends_at > now())
      join public.agencies staff_agency
        on staff_agency.id = coalesce(sa.agency_id, sp.agency_id)
        and staff_agency.deleted_at is null
        and staff_agency.region = v_region
      where sp.deleted_at is null
      order by sp.id
      limit 1;
    end if;

    if v_staff_id is null then
      raise exception 'no_active_regional_manager' using errcode = '23514';
    end if;

    update private.dossier_assignment_cursor
    set last_staff_id = v_staff_id, updated_at = now()
    where region = v_region;
    v_method := 'round_robin';
  end if;

  update public.dossier_assignment_history
  set ended_at = now()
  where dossier_id = v_dossier_id and ended_at is null;

  insert into public.dossier_assignment_history (
    dossier_id, assigned_to, assigned_by, agency_id, region,
    assignment_method, reason
  ) values (
    v_dossier_id, v_staff_id, (select auth.uid()), v_agency_id, v_region,
    v_method, case when v_method = 'manual' then trim(p_reason) else null end
  ) returning id into v_history_id;

  perform set_config('app.system_update', '1', true);
  update public.dossiers
  set owner_user_id = v_staff_id,
      advisor = v_staff_name,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = v_dossier_id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, occurred_at
  ) values (
    v_dossier_id,
    'DOSSIER_ASSIGNED',
    (select auth.uid()),
    (select private.current_role()),
    jsonb_build_object(
      'assigned_to', v_staff_id,
      'manager_name', v_staff_name,
      'region', v_region,
      'assignment_method', v_method,
      'reason', case when v_method = 'manual' then trim(p_reason) else null end
    ),
    now()
  );

  insert into public.notifications (
    recipient_user_id, type, title, body, dossier_id, action_url, dedupe_key
  ) values (
    v_staff_id,
    'dossier.assigned',
    'Nouveau dossier attribué',
    'Le dossier ' || v_duc_code || ' vous a été attribué dans la région ' || v_region || '.',
    v_dossier_id,
    '/portail-cfc/clients/' || v_dossier_id::text,
    'DOSSIER_ASSIGNED:' || v_history_id::text
  );

  return query select v_staff_id, v_staff_name;
end
$function$;

revoke all on function private.assign_dossier_to_manager(uuid, uuid, text) from public;
revoke all on function private.assign_dossier_to_manager(uuid, uuid, text) from anon, authenticated;

drop function if exists public.submit_service_application(text, uuid);
drop function if exists public.submit_service_application(text);
create or replace function public.submit_service_application()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  manager_name text;
begin
  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid())
    and deleted_at is null
  order by created_at desc, id desc
  limit 1
  for update;

  if dossier_row.id is null then
    raise exception 'no_dossier' using errcode = '42501';
  end if;
  if dossier_row.onboarding_state = 'suspension' then
    raise exception 'onboarding_suspended' using errcode = '42501';
  end if;

  select assignment.staff_name into manager_name
  from private.assign_dossier_to_manager(dossier_row.id) assignment;

  perform set_config('app.system_update', '1', true);
  update public.dossiers
  set onboarding_state = 'en_examen', advisor = manager_name, updated_at = now()
  where id = dossier_row.id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  ) values (
    dossier_row.id, 'APPLICATION_SUBMITTED', (select auth.uid()), 'CITIZEN',
    jsonb_build_object('advisor', manager_name, 'duc_code', dossier_row.duc_code),
    'COBAC R-2023/01 — lignes directrices LC-COB/01', now()
  );

  return manager_name;
end
$function$;
revoke all on function public.submit_service_application() from public;
grant execute on function public.submit_service_application() to authenticated, service_role;

drop function if exists public.set_prior_client_case(text, text, uuid);
drop function if exists public.set_prior_client_case(text, text);
create or replace function public.set_prior_client_case(p_case text)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  next_state text;
  manager_name text;
begin
  if p_case is null or p_case not in ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc') then
    raise exception 'unknown_prior_client_case' using errcode = '42501';
  end if;

  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid()) and deleted_at is null
  order by created_at desc, id desc
  limit 1
  for update;

  if dossier_row.id is null then
    raise exception 'no_dossier' using errcode = '42501';
  end if;

  if p_case = 'deja_au_cfc' then
    next_state := 'documents';
  else
    next_state := 'suspension';
    select assignment.staff_name into manager_name
    from private.assign_dossier_to_manager(dossier_row.id) assignment;
  end if;

  perform set_config('app.system_update', '1', true);
  update public.dossiers
  set prior_client_case = p_case,
      onboarding_state = next_state,
      advisor = coalesce(manager_name, advisor),
      updated_at = now()
  where id = dossier_row.id;
  perform set_config('app.system_update', '0', true);

  if dossier_row.onboarding_state is distinct from next_state
     or dossier_row.prior_client_case is distinct from p_case then
    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
    ) values (
      dossier_row.id,
      case when next_state = 'documents' then 'DOCUMENTS_READY' else 'APPLICATION_SUSPENDED' end,
      (select auth.uid()), 'CITIZEN',
      jsonb_build_object('prior_client_case', p_case, 'advisor', manager_name, 'duc_code', dossier_row.duc_code),
      'COBAC R-2023/01 — lignes directrices LC-COB/01', now()
    );
  end if;
  return next_state;
end
$function$;
revoke all on function public.set_prior_client_case(text) from public;
grant execute on function public.set_prior_client_case(text) to authenticated, service_role;

create or replace function public.reassign_dossier(
  p_dossier_id uuid,
  p_staff_id uuid,
  p_reason text
) returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  manager_name text;
begin
  if (select private.current_role()) <> 'ADMIN'
     or not (select private.has_capability('ADMIN', 'admin:users')) then
    raise exception 'manual_assignment_forbidden' using errcode = '42501';
  end if;

  select assignment.staff_name into manager_name
  from private.assign_dossier_to_manager(p_dossier_id, p_staff_id, p_reason) assignment;
  return manager_name;
end
$function$;
revoke all on function public.reassign_dossier(uuid, uuid, text) from public;
grant execute on function public.reassign_dossier(uuid, uuid, text) to authenticated;

-- Only the dossier's active GESTIONNAIRE may read or decide its KYC.
delete from ref.role_capability
where capability in ('kyc:read', 'kyc:verify', 'kyc:decide')
  and role_code <> 'GESTIONNAIRE';
insert into ref.role_capability (role_code, capability) values
  ('GESTIONNAIRE', 'kyc:read'),
  ('GESTIONNAIRE', 'kyc:verify'),
  ('GESTIONNAIRE', 'kyc:decide')
on conflict (role_code, capability) do nothing;

drop policy if exists citizen_profiles_read on public.citizen_profiles;
create policy citizen_profiles_read on public.citizen_profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (
      (select private.current_role()) = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:read'))
      and exists (
        select 1 from public.dossiers d
        where d.citizen_id = citizen_profiles.id
          and d.owner_user_id = (select auth.uid())
          and d.deleted_at is null
      )
    )
  );
drop policy if exists citizen_profiles_update on public.citizen_profiles;
create policy citizen_profiles_update on public.citizen_profiles for update to authenticated
  using (
    id = (select auth.uid())
    or (
      (select private.current_role()) = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:verify'))
      and exists (
        select 1 from public.dossiers d
        where d.citizen_id = citizen_profiles.id
          and d.owner_user_id = (select auth.uid())
          and d.deleted_at is null
      )
    )
  )
  with check (
    id = (select auth.uid())
    or (
      (select private.current_role()) = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:verify'))
      and exists (
        select 1 from public.dossiers d
        where d.citizen_id = citizen_profiles.id
          and d.owner_user_id = (select auth.uid())
          and d.deleted_at is null
      )
    )
  );

drop policy if exists kyc_profiles_read on public.kyc_profiles;
create policy kyc_profiles_read on public.kyc_profiles for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:read'))
      and exists (
        select 1 from public.dossiers d
        where d.citizen_id = kyc_profiles.citizen_id
          and d.owner_user_id = (select auth.uid())
          and d.deleted_at is null
      )
    )
  );
drop policy if exists kyc_profiles_agent_update on public.kyc_profiles;
create policy kyc_profiles_agent_update on public.kyc_profiles for update to authenticated
  using (
    (select private.current_role()) = 'GESTIONNAIRE'
    and (select private.has_capability('GESTIONNAIRE', 'kyc:decide'))
    and exists (
      select 1 from public.dossiers d
      where d.citizen_id = kyc_profiles.citizen_id
        and d.owner_user_id = (select auth.uid())
        and d.deleted_at is null
    )
  )
  with check (
    (select private.current_role()) = 'GESTIONNAIRE'
    and (select private.has_capability('GESTIONNAIRE', 'kyc:decide'))
    and exists (
      select 1 from public.dossiers d
      where d.citizen_id = kyc_profiles.citizen_id
        and d.owner_user_id = (select auth.uid())
        and d.deleted_at is null
    )
  );

drop policy if exists kyc_documents_read on public.kyc_documents;
create policy kyc_documents_read on public.kyc_documents for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:read'))
      and exists (
        select 1 from public.dossiers d
        where d.citizen_id = kyc_documents.citizen_id
          and d.owner_user_id = (select auth.uid())
          and d.deleted_at is null
      )
    )
  );
