-- Journal the client-facing transitions that were previously invisible:
-- KYC submission, and eligibility to begin uploading dossier documents.

set search_path = public, extensions;

create or replace function public.submit_kyc_profile()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_state text;
  dossier_row public.dossiers%rowtype;
begin
  select kyc_state into current_state
  from public.citizen_profiles
  where id = (select auth.uid());

  if current_state is null then
    raise exception 'not_a_citizen' using errcode = '42501';
  end if;

  if current_state not in ('pre_boarding', 'identity_capture', 'document_verification') then
    raise exception 'kyc_not_submittable' using errcode = '42501';
  end if;

  update public.kyc_profiles
  set submitted_at = now(), updated_at = now()
  where citizen_id = (select auth.uid());

  perform set_config('app.system_update', '1', true);

  update public.citizen_profiles
  set kyc_state = 'document_verification', updated_at = now()
  where id = (select auth.uid());

  perform set_config('app.system_update', '0', true);

  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid())
    and deleted_at is null
  order by created_at desc, id desc
  limit 1;

  if dossier_row.id is not null then
    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
    )
    values (
      dossier_row.id,
      'KYC_SUBMITTED',
      (select auth.uid()),
      'CITIZEN',
      jsonb_build_object('kyc_state', 'document_verification'),
      'COBAC R-2023/01 — lignes directrices LC-COB/01',
      now()
    );
  end if;

  return 'document_verification';
end $function$;

comment on function public.submit_kyc_profile() is
  'Soumet le profil KYC du citoyen : horodatage, transition vers la verification des pieces et evenement KYC_SUBMITTED journalises atomiquement.';

revoke all on function public.submit_kyc_profile() from public;
grant execute on function public.submit_kyc_profile() to authenticated, service_role;

create or replace function public.set_prior_client_case(p_case text, p_advisor text)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  next_state text;
  advisor_name text;
  event_type text;
begin
  if p_case is null or p_case not in ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc') then
    raise exception 'unknown_prior_client_case' using errcode = '42501';
  end if;

  advisor_name := trim(coalesce(p_advisor, ''));

  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid())
    and deleted_at is null
  order by created_at desc, id desc
  limit 1;

  if dossier_row.id is null then
    raise exception 'no_dossier' using errcode = '42501';
  end if;

  if p_case = 'deja_au_cfc' then
    next_state := 'documents';
  else
    next_state := 'suspension';
    if advisor_name = '' then
      raise exception 'advisor_required' using errcode = '42501';
    end if;
  end if;

  perform set_config('app.system_update', '1', true);

  update public.dossiers
  set prior_client_case = p_case,
      onboarding_state = next_state,
      advisor = case when advisor_name = '' then advisor else advisor_name end,
      updated_at = now()
  where id = dossier_row.id;

  perform set_config('app.system_update', '0', true);

  if dossier_row.onboarding_state is distinct from next_state
     or dossier_row.prior_client_case is distinct from p_case then
    event_type := case
      when next_state = 'documents' then 'DOCUMENTS_READY'
      else 'APPLICATION_SUSPENDED'
    end;

    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
    )
    values (
      dossier_row.id,
      event_type,
      (select auth.uid()),
      'CITIZEN',
      jsonb_build_object(
        'prior_client_case', p_case,
        'advisor', nullif(advisor_name, ''),
        'duc_code', dossier_row.duc_code
      ),
      'COBAC R-2023/01 — lignes directrices LC-COB/01',
      now()
    );
  end if;

  return next_state;
end $function$;

comment on function public.set_prior_client_case(text, text) is
  'Enregistre la situation du demandeur et journalise chaque changement vers le depot des pieces (DOCUMENTS_READY) ou la suspension (APPLICATION_SUSPENDED).';

revoke all on function public.set_prior_client_case(text, text) from public;
grant execute on function public.set_prior_client_case(text, text) to authenticated, service_role;