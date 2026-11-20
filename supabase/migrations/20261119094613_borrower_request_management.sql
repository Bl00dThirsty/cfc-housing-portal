-- Borrower request management: one dossier per request, explicit request IDs,
-- shared submitted KYC, and audited draft withdrawal.

-- `citizen_profiles` is the authority for a person's identity uniqueness.
-- Dossiers are request aggregates, so copies of the same CNI must be allowed.
drop index if exists public.dossiers_active_cni_key;
create index if not exists dossiers_active_cni_idx
  on public.dossiers (cni_normalised)
  where deleted_at is null;

-- The assignment RPC requires an agency whose region exactly matches the
-- manager's agency region. Resolve only a live agency that currently has an
-- active GESTIONNAIRE in that exact region; never invent a fallback advisor.
create or replace function private.resolve_borrower_agency(
  p_region text,
  p_is_diaspora boolean
) returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select borrower_agency.id
  from public.agencies borrower_agency
  where borrower_agency.deleted_at is null
    and (
      (p_is_diaspora and borrower_agency.is_diaspora_desk)
      or (
        not p_is_diaspora
        and nullif(trim(p_region), '') is not null
        and lower(trim(split_part(borrower_agency.region, '(', 1)))
          = lower(trim(split_part(p_region, '(', 1)))
      )
    )
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
      where assignment.role = 'GESTIONNAIRE'
        and assignment.deleted_at is null
        and assignment.starts_at <= now()
        and (assignment.ends_at is null or assignment.ends_at > now())
        and staff_agency.region = borrower_agency.region
    )
  order by borrower_agency.code
  limit 1;
$function$;

revoke all on function private.resolve_borrower_agency(text, boolean) from public, anon, authenticated;

-- An account which has not submitted KYC keeps resuming its single initial
-- KYC draft. A verified account gets a new independent dossier for each
-- request, seeded from its persisted profile/KYC data.
create or replace function public.create_borrower_request()
returns table(dossier_id uuid, duc_code text, reused boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_profile public.citizen_profiles%rowtype;
  v_existing public.dossiers%rowtype;
  v_dossier_id uuid;
  v_duc_code text;
  v_region text;
  v_is_diaspora boolean;
  v_agency_id uuid;
  v_agency_label text;
  v_kyc_submitted boolean := false;
  v_residence jsonb := '{}'::jsonb;
  v_employment jsonb := '{}'::jsonb;
  v_income_text text;
begin
  if v_actor_id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.actors actor
    where actor.id = v_actor_id
      and actor.actor_type = 'citizen'
      and actor.deleted_at is null
  ) then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;

  -- Serialize first-request creation so a repeated submit cannot open two
  -- initial KYC drafts for the same borrower.
  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text, 0));

  select * into v_profile
  from public.citizen_profiles profile
  where profile.id = v_actor_id and profile.deleted_at is null;
  if v_profile.id is null then
    raise exception 'citizen_profile_required' using errcode = '23514';
  end if;

  select
    kyc.submitted_at is not null,
    coalesce(kyc.residence, '{}'::jsonb),
    coalesce(kyc.employment, '{}'::jsonb)
  into v_kyc_submitted, v_residence, v_employment
  from public.kyc_profiles kyc
  where kyc.citizen_id = v_actor_id;

  v_kyc_submitted := coalesce(v_kyc_submitted, false)
    or v_profile.kyc_state not in ('pre_boarding', 'identity_capture');

  if not v_kyc_submitted then
    select dossier.* into v_existing
    from public.dossiers dossier
    where dossier.citizen_id = v_actor_id
      and dossier.service_code is null
      and dossier.onboarding_state = 'kyc'
      and dossier.status <> 'closed'
      and dossier.deleted_at is null
    order by dossier.created_at desc, dossier.id desc
    limit 1
    for update;

    if v_existing.id is not null then
      return query select v_existing.id, v_existing.duc_code, true;
      return;
    end if;
  end if;

  v_region := coalesce(
    nullif(trim(v_residence ->> 'region'), ''),
    nullif(trim(v_profile.region), '')
  );
  v_is_diaspora := v_profile.is_diaspora
    or v_profile.affiliation_status = 'non_resident'
    or lower(coalesce(v_residence ->> 'country', '')) not in ('', 'cameroun', 'cameroon');

  if v_kyc_submitted then
    if not v_is_diaspora and v_region is null then
      raise exception 'borrower_region_required' using errcode = '23514';
    end if;
    v_agency_id := private.resolve_borrower_agency(v_region, v_is_diaspora);
    if v_agency_id is null then
      raise exception 'borrower_region_unroutable' using errcode = '23514';
    end if;

    select agency.label, coalesce(nullif(agency.region, ''), v_region)
      into v_agency_label, v_region
    from public.agencies agency
    where agency.id = v_agency_id;
  end if;

  v_duc_code := public.next_duc_code();
  v_income_text := v_employment ->> 'declared_income';
  insert into public.dossiers (
    duc_code, citizen_id, agency_id, agency, service_code, is_diaspora,
    name, email, phone, cni_raw, birth_date, address, city, region,
    profession, employer, monthly_income,
    status, current_phase, duc_status, onboarding_state,
    created_by, updated_by
  ) values (
    v_duc_code, v_actor_id, v_agency_id, v_agency_label, null, v_is_diaspora,
    v_profile.full_name,
    coalesce(v_profile.email, (select auth.users.email from auth.users where auth.users.id = v_actor_id)),
    v_profile.phone,
    v_profile.cni_raw,
    v_profile.birth_date,
    coalesce(nullif(v_residence ->> 'landmark', ''), nullif(v_profile.address, '')),
    coalesce(nullif(v_residence ->> 'city', ''), nullif(v_profile.city, '')),
    coalesce(nullif(v_region, ''), nullif(v_profile.region, '')),
    nullif(v_employment ->> 'profession', ''),
    nullif(v_employment ->> 'employer', ''),
    case when v_income_text ~ '^[0-9]+(\.[0-9]+)?$' then v_income_text::numeric else null end,
    'open', null, 'non_active',
    case when v_kyc_submitted then 'service' else 'kyc' end,
    v_actor_id, v_actor_id
  ) returning id into v_dossier_id;

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, occurred_at
  ) values (
    v_dossier_id,
    'REQUEST_CREATED',
    v_actor_id,
    'CITIZEN',
    jsonb_build_object(
      'duc_code', v_duc_code,
      'region', v_region,
      'kyc_reused', v_kyc_submitted
    ),
    now()
  );

  return query select v_dossier_id, v_duc_code, false;
end
$function$;

revoke all on function public.create_borrower_request() from public, anon;
grant execute on function public.create_borrower_request() to authenticated;

create or replace function public.save_borrower_request_service(
  p_dossier_id uuid,
  p_service_code text
) returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_dossier public.dossiers%rowtype;
  v_region text;
  v_is_diaspora boolean;
  v_agency_id uuid;
begin
  if v_actor_id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if nullif(trim(p_service_code), '') is null or not exists (
    select 1 from ref.service service
    where service.code = p_service_code
      and service.is_active
      and service.deleted_at is null
  ) then
    raise exception 'unknown_service' using errcode = '22023';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.deleted_at is null
  for update;
  if v_dossier.id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if v_dossier.status = 'closed' then
    raise exception 'request_not_withdrawable' using errcode = '42501';
  end if;
  if v_dossier.service_code is not null then
    if v_dossier.service_code <> p_service_code then
      raise exception 'request_service_locked' using errcode = '42501';
    end if;
    return p_service_code;
  end if;
  if v_dossier.onboarding_state not in ('kyc', 'service') then
    raise exception 'request_service_locked' using errcode = '42501';
  end if;

  v_region := coalesce(nullif(trim(v_dossier.region), ''), nullif(trim(v_dossier.city), ''));
  select profile.is_diaspora or profile.affiliation_status = 'non_resident'
    into v_is_diaspora
  from public.citizen_profiles profile
  where profile.id = v_actor_id;
  v_is_diaspora := coalesce(v_is_diaspora, v_dossier.is_diaspora);

  v_agency_id := v_dossier.agency_id;
  if v_agency_id is null then
    if not v_is_diaspora and v_region is null then
      raise exception 'borrower_region_required' using errcode = '23514';
    end if;
    v_agency_id := private.resolve_borrower_agency(v_region, v_is_diaspora);
    if v_agency_id is null then
      raise exception 'borrower_region_unroutable' using errcode = '23514';
    end if;
  end if;

  perform set_config('app.system_update', '1', true);
  update public.dossiers
  set service_code = p_service_code,
      agency_id = v_agency_id,
      region = coalesce(region, v_region),
      onboarding_state = 'service',
      updated_at = now(),
      updated_by = v_actor_id
  where id = p_dossier_id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, occurred_at
  ) values (
    p_dossier_id,
    'SERVICE_SELECTED',
    v_actor_id,
    'CITIZEN',
    jsonb_build_object('service_code', p_service_code),
    now()
  );

  return p_service_code;
end
$function$;

revoke all on function public.save_borrower_request_service(uuid, text) from public, anon;
grant execute on function public.save_borrower_request_service(uuid, text) to authenticated;

-- Replace the latest-dossier functions with explicit-ID versions. The owner
-- check and row lock make a forged or stale request ID harmless.
drop function if exists public.set_prior_client_case(text);
create or replace function public.set_prior_client_case(
  p_dossier_id uuid,
  p_case text
) returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_dossier public.dossiers%rowtype;
  v_next_state text;
  v_manager_name text;
begin
  if v_actor_id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if p_case is null or p_case not in ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc') then
    raise exception 'unknown_prior_client_case' using errcode = '22023';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.deleted_at is null
  for update;
  if v_dossier.id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if v_dossier.status = 'closed' or v_dossier.service_code is null then
    raise exception 'service_required' using errcode = '42501';
  end if;

  if p_case = 'deja_au_cfc' then
    v_next_state := 'documents';
  else
    v_next_state := 'suspension';
    select assignment.staff_name into v_manager_name
    from private.assign_dossier_to_manager(p_dossier_id) assignment;
  end if;

  if v_dossier.onboarding_state is distinct from v_next_state
     or v_dossier.prior_client_case is distinct from p_case then
    perform set_config('app.system_update', '1', true);
    update public.dossiers
    set prior_client_case = p_case,
        onboarding_state = v_next_state,
        advisor = coalesce(v_manager_name, advisor),
        updated_at = now(),
        updated_by = v_actor_id
    where id = p_dossier_id;
    perform set_config('app.system_update', '0', true);

    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
    ) values (
      p_dossier_id,
      case when v_next_state = 'documents' then 'DOCUMENTS_READY' else 'APPLICATION_SUSPENDED' end,
      v_actor_id,
      'CITIZEN',
      jsonb_build_object(
        'prior_client_case', p_case,
        'advisor', v_manager_name,
        'duc_code', v_dossier.duc_code
      ),
      'COBAC R-2023/01 — lignes directrices LC-COB/01',
      now()
    );
  end if;

  return v_next_state;
end
$function$;

revoke all on function public.set_prior_client_case(uuid, text) from public, anon;
grant execute on function public.set_prior_client_case(uuid, text) to authenticated;

drop function if exists public.submit_service_application();
create or replace function public.submit_service_application(p_dossier_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_dossier public.dossiers%rowtype;
  v_manager_name text;
begin
  if v_actor_id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.deleted_at is null
  for update;
  if v_dossier.id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if v_dossier.status = 'closed' or v_dossier.service_code is null then
    raise exception 'service_required' using errcode = '42501';
  end if;
  if v_dossier.onboarding_state = 'suspension' then
    raise exception 'onboarding_suspended' using errcode = '42501';
  end if;
  if v_dossier.onboarding_state = 'en_examen' then
    return coalesce(v_dossier.advisor, '');
  end if;
  if v_dossier.onboarding_state <> 'documents' then
    raise exception 'request_not_submittable' using errcode = '42501';
  end if;

  select assignment.staff_name into v_manager_name
  from private.assign_dossier_to_manager(p_dossier_id) assignment;

  perform set_config('app.system_update', '1', true);
  update public.dossiers
  set onboarding_state = 'en_examen',
      advisor = v_manager_name,
      updated_at = now(),
      updated_by = v_actor_id
  where id = p_dossier_id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  ) values (
    p_dossier_id,
    'APPLICATION_SUBMITTED',
    v_actor_id,
    'CITIZEN',
    jsonb_build_object(
      'service_code', v_dossier.service_code,
      'advisor', v_manager_name,
      'duc_code', v_dossier.duc_code
    ),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return coalesce(v_manager_name, '');
end
$function$;

revoke all on function public.submit_service_application(uuid) from public, anon;
grant execute on function public.submit_service_application(uuid) to authenticated;

create or replace function public.withdraw_borrower_request(p_dossier_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_dossier public.dossiers%rowtype;
begin
  if v_actor_id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.deleted_at is null
  for update;
  if v_dossier.id is null then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;
  if v_dossier.status = 'closed' then
    return 'closed';
  end if;
  if v_dossier.onboarding_state not in ('kyc', 'service', 'documents') then
    raise exception 'request_not_withdrawable' using errcode = '42501';
  end if;

  perform set_config('app.system_update', '1', true);
  update public.dossiers
  set status = 'closed',
      closed_at = now(),
      updated_at = now(),
      updated_by = v_actor_id
  where id = p_dossier_id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, occurred_at
  ) values (
    p_dossier_id,
    'REQUEST_WITHDRAWN',
    v_actor_id,
    'CITIZEN',
    jsonb_build_object('duc_code', v_dossier.duc_code),
    now()
  );

  return 'closed';
end
$function$;

revoke all on function public.withdraw_borrower_request(uuid) from public, anon;
grant execute on function public.withdraw_borrower_request(uuid) to authenticated;
