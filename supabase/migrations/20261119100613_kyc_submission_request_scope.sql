-- KYC remains shared by the actor, while its submission event belongs to one
-- explicit request. Never infer which dossier to update from creation order.
drop function if exists public.submit_kyc_profile();

create or replace function public.submit_kyc_profile(p_dossier_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_current_state text;
  v_submitted_at timestamptz;
  v_dossier public.dossiers%rowtype;
begin
  if v_actor_id is null then
    raise exception 'not_a_citizen' using errcode = '42501';
  end if;

  select profile.kyc_state into v_current_state
  from public.citizen_profiles profile
  where profile.id = v_actor_id and profile.deleted_at is null;

  if v_current_state is null then
    raise exception 'not_a_citizen' using errcode = '42501';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.deleted_at is null
  for update;

  if v_dossier.id is null or v_dossier.onboarding_state <> 'kyc' then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;

  select profile.submitted_at into v_submitted_at
  from public.kyc_profiles profile
  where profile.citizen_id = v_actor_id
  for update;

  if v_submitted_at is not null
     or v_current_state not in ('pre_boarding', 'identity_capture', 'document_verification') then
    raise exception 'kyc_not_submittable' using errcode = '42501';
  end if;

  update public.kyc_profiles
  set submitted_at = now(), updated_at = now(), updated_by = v_actor_id
  where citizen_id = v_actor_id;

  perform set_config('app.system_update', '1', true);
  update public.citizen_profiles
  set kyc_state = 'document_verification', updated_at = now(), updated_by = v_actor_id
  where id = v_actor_id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  ) values (
    v_dossier.id,
    'KYC_SUBMITTED',
    v_actor_id,
    'CITIZEN',
    jsonb_build_object('kyc_state', 'document_verification'),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return 'document_verification';
end
$function$;

revoke all on function public.submit_kyc_profile(uuid) from public, anon;
grant execute on function public.submit_kyc_profile(uuid) to authenticated, service_role;

comment on function public.submit_kyc_profile(uuid) is
  'Soumet les déclarations KYC partagées et rattache l’événement de soumission au dossier explicitement désigné par son propriétaire.';
