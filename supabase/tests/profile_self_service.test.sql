begin;

select plan(27);

select has_column('public', 'actor_profile_media', 'deleted_at', 'profile media supports audited soft-delete metadata');
select has_column('public', 'citizen_profile_change_requests', 'deleted_at', 'name correction requests support audited soft-delete metadata');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000901', 'authenticated', 'authenticated', 'profile-client@cfc.local', '', now(), '{}', '{"actor_type":"citizen"}', now(), now()),
  ('00000000-0000-4000-8000-000000000902', 'authenticated', 'authenticated', 'profile-manager@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000903', 'authenticated', 'authenticated', 'profile-unassigned@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000904', 'authenticated', 'authenticated', 'profile-other-client@cfc.local', '', now(), '{}', '{"actor_type":"citizen"}', now(), now());

insert into public.agencies (id, code, label, region) values
  ('00000000-0000-4000-8000-000000000911', 'PROFILE-CENTRE', 'Agence Centre', 'Centre'),
  ('00000000-0000-4000-8000-000000000912', 'PROFILE-SUD', 'Agence Sud', 'Sud');

update public.actors set actor_type = 'staff'
where id in (
  '00000000-0000-4000-8000-000000000902',
  '00000000-0000-4000-8000-000000000903'
);

insert into public.staff_profiles (id, full_name, agency_id, phone) values
  ('00000000-0000-4000-8000-000000000902', 'Gestionnaire Centre', '00000000-0000-4000-8000-000000000911', '+237699000902'),
  ('00000000-0000-4000-8000-000000000903', 'Gestionnaire Sud', '00000000-0000-4000-8000-000000000912', '+237699000903');

insert into public.staff_assignments (actor_id, role, agency_id) values
  ('00000000-0000-4000-8000-000000000902', 'GESTIONNAIRE', '00000000-0000-4000-8000-000000000911'),
  ('00000000-0000-4000-8000-000000000903', 'GESTIONNAIRE', '00000000-0000-4000-8000-000000000912');

insert into public.citizen_profiles (id, full_name, phone, email, region, kyc_state)
values
  ('00000000-0000-4000-8000-000000000901', 'Awa Njoya', '+237699000001', 'profile-client@cfc.local', 'Centre', 'identity_capture'),
  ('00000000-0000-4000-8000-000000000904', 'Autre Client', '+237699000004', 'profile-other-client@cfc.local', 'Centre', 'document_verification');

insert into public.kyc_profiles (citizen_id, submitted_at)
values
  ('00000000-0000-4000-8000-000000000901', null),
  ('00000000-0000-4000-8000-000000000904', now());

insert into public.dossiers (
  id, duc_code, citizen_id, owner_user_id, agency_id, name, phone, email, region, status, onboarding_state
) values
  ('00000000-0000-4000-8000-000000000921', 'DUC-PROFILE-901', '00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000911', 'Awa Njoya', '+237699000001', 'profile-client@cfc.local', 'Centre', 'open', 'kyc'),
  ('00000000-0000-4000-8000-000000000925', 'DUC-PROFILE-901-OLDER', '00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000911', 'Awa Njoya', '+237699000001', 'profile-client@cfc.local', 'Centre', 'open', 'kyc'),
  ('00000000-0000-4000-8000-000000000924', 'DUC-PROFILE-904', '00000000-0000-4000-8000-000000000904', '00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000911', 'Autre Client', '+237699000004', 'profile-other-client@cfc.local', 'Centre', 'open', 'kyc');

update public.dossiers set created_at = now() - interval '2 days'
where id = '00000000-0000-4000-8000-000000000925';

insert into public.actor_profile_media (actor_id, avatar_path)
values
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901/00000000-0000-4000-8000-000000000901.webp'),
  ('00000000-0000-4000-8000-000000000904', '00000000-0000-4000-8000-000000000904/00000000-0000-4000-8000-000000000904.webp'),
  ('00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000902/00000000-0000-4000-8000-000000000902.webp');

update auth.users
set email = 'profile-client-confirmed@cfc.local', updated_at = now()
where id = '00000000-0000-4000-8000-000000000901';

select is(
  (select email from public.citizen_profiles where id = '00000000-0000-4000-8000-000000000901'),
  'profile-client-confirmed@cfc.local',
  'confirmed Auth email is copied to the citizen profile'
);
select is(
  (select email from public.dossiers where id = '00000000-0000-4000-8000-000000000921'),
  'profile-client-confirmed@cfc.local',
  'confirmed Auth email is copied to the dossier'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select lives_ok(
  $$select public.update_own_profile('Awa Mbele', '+237699000101')$$,
  'a citizen can update their own name and contact phone before KYC submission'
);
select is(
  (select name from public.dossiers where id = '00000000-0000-4000-8000-000000000921'),
  'Awa Mbele',
  'a client name change updates the latest dossier copy atomically'
);
select is(
  (select phone from public.dossiers where id = '00000000-0000-4000-8000-000000000921'),
  '+237699000101',
  'a client phone change updates the dossier contact copy'
);
select is(
  (select phone from public.dossiers where id = '00000000-0000-4000-8000-000000000925'),
  '+237699000101',
  'a client phone change updates every open request copy'
);

select lives_ok(
  $$select public.submit_kyc_profile('00000000-0000-4000-8000-000000000925'::uuid)$$,
  'KYC submission accepts its explicit owned request'
);
select is(
  (select count(*)::integer from public.dossier_events where dossier_id = '00000000-0000-4000-8000-000000000925' and event_type = 'KYC_SUBMITTED'),
  1,
  'the KYC event is attached to the selected older request'
);
select is(
  (select count(*)::integer from public.dossier_events where dossier_id = '00000000-0000-4000-8000-000000000921' and event_type = 'KYC_SUBMITTED'),
  0,
  'a newer parallel request does not receive the KYC event'
);
select ok(
  (select submitted_at is not null from public.kyc_profiles where citizen_id = '00000000-0000-4000-8000-000000000901'),
  'the shared KYC record receives its submission timestamp'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000904', true);
select throws_ok(
  $$update public.citizen_profiles set full_name = 'Autre Nom' where id = '00000000-0000-4000-8000-000000000904'$$,
  '42501',
  'citizen_profile_field_forbidden',
  'a citizen cannot directly change another submitted profile name'
);

select lives_ok(
  $$select public.request_citizen_name_correction(
      '00000000-0000-4000-8000-000000000924'::uuid,
      'Client Corrigé', 'Le nom légal a changé après la soumission du dossier.'
    )$$,
  'a submitted client can route a legal-name correction through a selected request'
);
select is(
  (select count(*)::integer from public.citizen_profile_change_requests
   where citizen_id = '00000000-0000-4000-8000-000000000904' and status = 'pending'),
  1,
  'name correction requests are recorded as pending'
);
select set_config(
  'test.profile_correction_request_id',
  (select id::text from public.citizen_profile_change_requests
   where citizen_id = '00000000-0000-4000-8000-000000000904' and status = 'pending'),
  true
);
select is(
  (select full_name from public.citizen_profiles where id = '00000000-0000-4000-8000-000000000904'),
  'Autre Client',
  'requesting a correction does not overwrite the verified name'
);

select is(
  (select count(*)::integer from public.actor_profile_media where actor_id = '00000000-0000-4000-8000-000000000904'),
  1,
  'an owner can read their own avatar metadata'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);
select is(
  (select count(*)::integer from public.actor_profile_media where actor_id = '00000000-0000-4000-8000-000000000904'),
  0,
  'another client cannot read a client avatar'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000903', true);
select is(
  (select count(*)::integer from public.actor_profile_media where actor_id = '00000000-0000-4000-8000-000000000904'),
  0,
  'an unassigned manager cannot read a client avatar'
);
select throws_ok(
  $$select public.decide_citizen_name_correction(
      current_setting('test.profile_correction_request_id')::uuid,
      'approved', null
    )$$,
  '42501',
  'profile_name_correction_forbidden',
  'an unassigned manager cannot decide a correction request'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);
select is(
  (select count(*)::integer from public.actor_profile_media where actor_id = '00000000-0000-4000-8000-000000000904'),
  1,
  'the currently assigned manager can read the client avatar metadata'
);
select lives_ok(
  $$select public.decide_citizen_name_correction(
      (select id from public.citizen_profile_change_requests where citizen_id = '00000000-0000-4000-8000-000000000904'),
      'approved', 'Pièce justificative contrôlée.'
    )$$,
  'the assigned manager can approve the correction request'
);
select is(
  (select full_name from public.citizen_profiles where id = '00000000-0000-4000-8000-000000000904'),
  'Client Corrigé',
  'approval changes the citizen legal name'
);
select is(
  (select name from public.dossiers where id = '00000000-0000-4000-8000-000000000924'),
  'Client Corrigé',
  'approval synchronizes the dossier name'
);
select is(
  (select status from public.citizen_profile_change_requests where citizen_id = '00000000-0000-4000-8000-000000000904'),
  'approved',
  'approval closes the pending correction request'
);

select lives_ok(
  $$select public.update_own_profile('Gestionnaire Modifié', '+237699000202')$$,
  'a staff member can update their own name and phone'
);
select is(
  (select full_name from public.staff_profiles where id = '00000000-0000-4000-8000-000000000902'),
  'Gestionnaire Modifié',
  'staff self-service does not require broad staff profile update permission'
);

reset role;
select * from finish();
rollback;
