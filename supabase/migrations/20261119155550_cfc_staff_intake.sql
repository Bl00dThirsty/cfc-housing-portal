-- Staff Guichet intake creates a borrower request and assigns it in one
-- transaction. Identity data is always copied from the persisted profile.

create or replace function public.cfc_create_staff_intake(p_borrower_id uuid)
returns jsonb
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
  v_reused boolean := false;
  v_advisor text;
begin
  if v_actor_id is null
     or (select private.current_role()) is null
     or not (select private.has_capability((select private.current_role()), 'dossier:create')) then
    raise exception 'staff_intake_forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.actors actor
    where actor.id = p_borrower_id
      and actor.actor_type = 'citizen'
      and actor.deleted_at is null
  ) then
    raise exception 'staff_intake_borrower_not_found' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_borrower_id::text, 0));

  select profile.* into v_profile
  from public.citizen_profiles profile
  where profile.id = p_borrower_id
    and profile.deleted_at is null
  for update;
  if v_profile.id is null then
    raise exception 'staff_intake_profile_required' using errcode = '23514';
  end if;

  select
    kyc.submitted_at is not null,
    coalesce(kyc.residence, '{}'::jsonb),
    coalesce(kyc.employment, '{}'::jsonb)
  into v_kyc_submitted, v_residence, v_employment
  from public.kyc_profiles kyc
  where kyc.citizen_id = p_borrower_id
    and kyc.deleted_at is null;

  v_kyc_submitted := coalesce(v_kyc_submitted, false)
    or v_profile.kyc_state not in ('pre_boarding', 'identity_capture');
  v_is_diaspora := v_profile.is_diaspora
    or v_profile.affiliation_status = 'non_resident'
    or lower(coalesce(v_residence ->> 'country', '')) not in ('', 'cameroun', 'cameroon');
  v_region := coalesce(
    nullif(trim(v_residence ->> 'region'), ''),
    nullif(trim(v_profile.region), '')
  );

  if not v_is_diaspora and v_region is null then
    raise exception 'borrower_region_required' using errcode = '23514';
  end if;
  v_agency_id := private.resolve_borrower_agency(v_region, v_is_diaspora);
  if v_agency_id is null then
    raise exception 'borrower_region_unroutable' using errcode = '23514';
  end if;
  select agency.label, coalesce(nullif(trim(agency.region), ''), v_region)
    into v_agency_label, v_region
  from public.agencies agency
  where agency.id = v_agency_id
    and agency.deleted_at is null;

  -- A borrower still completing initial KYC resumes the single open KYC
  -- draft. A submitted/verified profile starts a distinct service request.
  if not v_kyc_submitted then
    select dossier.* into v_existing
    from public.dossiers dossier
    where dossier.citizen_id = p_borrower_id
      and dossier.service_code is null
      and dossier.onboarding_state = 'kyc'
      and dossier.status <> 'closed'
      and dossier.deleted_at is null
    order by dossier.created_at desc, dossier.id desc
    limit 1
    for update;
    v_reused := v_existing.id is not null;
  end if;

  if v_reused then
    v_dossier_id := v_existing.id;
    v_duc_code := v_existing.duc_code;
    perform set_config('app.system_update', '1', true);
    update public.dossiers
    set agency_id = v_agency_id,
        agency = v_agency_label,
        region = v_region,
        is_diaspora = v_is_diaspora,
        name = v_profile.full_name,
        email = coalesce(v_profile.email, (select u.email from auth.users u where u.id = p_borrower_id)),
        phone = v_profile.phone,
        cni_raw = v_profile.cni_raw,
        birth_date = v_profile.birth_date,
        city = coalesce(nullif(v_residence ->> 'city', ''), nullif(v_profile.city, '')),
        address = coalesce(nullif(v_residence ->> 'landmark', ''), nullif(v_profile.address, '')),
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_dossier_id;
    perform set_config('app.system_update', '0', true);
  else
    v_duc_code := public.next_duc_code();
    insert into public.dossiers (
      duc_code, citizen_id, agency_id, agency, service_code, is_diaspora,
      name, email, phone, cni_raw, birth_date, address, city, region,
      profession, employer, monthly_income,
      status, current_phase, duc_status, onboarding_state,
      created_by, updated_by
    ) values (
      v_duc_code, p_borrower_id, v_agency_id, v_agency_label, null, v_is_diaspora,
      v_profile.full_name,
      coalesce(v_profile.email, (select u.email from auth.users u where u.id = p_borrower_id)),
      v_profile.phone, v_profile.cni_raw, v_profile.birth_date,
      coalesce(nullif(v_residence ->> 'landmark', ''), nullif(v_profile.address, '')),
      coalesce(nullif(v_residence ->> 'city', ''), nullif(v_profile.city, '')),
      v_region,
      nullif(v_employment ->> 'profession', ''),
      nullif(v_employment ->> 'employer', ''),
      case
        when (v_employment ->> 'declared_income') ~ '^[0-9]+(\.[0-9]+)?$'
          then (v_employment ->> 'declared_income')::numeric
        else null
      end,
      'open', null, 'non_active',
      case when v_kyc_submitted then 'service' else 'kyc' end,
      v_actor_id, v_actor_id
    ) returning id into v_dossier_id;
  end if;

  select assignment.staff_name into v_advisor
  from private.assign_dossier_to_manager(v_dossier_id) assignment;

  if v_reused then
    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, occurred_at
    ) values (
      v_dossier_id, 'GUICHET_INTAKE_RESUMED', v_actor_id,
      (select private.current_role()),
      jsonb_build_object('source', 'guichet', 'region', v_region, 'advisor', v_advisor), now()
    );
  else
    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, occurred_at
    ) values (
      v_dossier_id, 'REQUEST_CREATED', v_actor_id,
      (select private.current_role()),
      jsonb_build_object(
        'source', 'guichet',
        'region', v_region,
        'kyc_submitted', v_kyc_submitted,
        'advisor', v_advisor
      ), now()
    );
  end if;

  return jsonb_build_object(
    'dossier_id', v_dossier_id,
    'duc_code', v_duc_code,
    'advisor', v_advisor,
    'reused', v_reused
  );
end
$function$;

revoke all on function public.cfc_create_staff_intake(uuid) from public, anon;
grant execute on function public.cfc_create_staff_intake(uuid) to authenticated;
