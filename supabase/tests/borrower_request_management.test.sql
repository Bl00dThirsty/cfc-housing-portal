begin;

select plan(21);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000981', 'authenticated', 'authenticated', 'borrower-request-manager@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000982', 'authenticated', 'authenticated', 'borrower-request-client@cfc.local', '', now(), '{}', '{"actor_type":"citizen"}', now(), now()),
  ('00000000-0000-4000-8000-000000000983', 'authenticated', 'authenticated', 'borrower-request-other@cfc.local', '', now(), '{}', '{"actor_type":"citizen"}', now(), now());

update public.actors set actor_type = 'staff'
where id = '00000000-0000-4000-8000-000000000981';

insert into public.agencies (id, code, label, region, country)
values ('00000000-0000-4000-8000-000000000984', 'BR-REQ-CENTRE', 'Agence de routage test', 'Centre', 'CM');

insert into public.staff_profiles (id, full_name, agency_id)
values ('00000000-0000-4000-8000-000000000981', 'Gestionnaire de test', '00000000-0000-4000-8000-000000000984');

insert into public.staff_assignments (actor_id, role, agency_id)
values ('00000000-0000-4000-8000-000000000981', 'GESTIONNAIRE', '00000000-0000-4000-8000-000000000984');

insert into public.citizen_profiles (
  id, full_name, phone, email, region, is_diaspora, affiliation_status, kyc_state, cni_raw
) values
  ('00000000-0000-4000-8000-000000000982', 'Awa Njoya', '+237699000982', 'borrower-request-client@cfc.local', 'Centre', false, 'cfc_existing', 'approved', 'BRTEST982'),
  ('00000000-0000-4000-8000-000000000983', 'Autre Client', '+237699000983', 'borrower-request-other@cfc.local', 'Centre', false, 'cfc_existing', 'approved', 'BRTEST983');

insert into public.kyc_profiles (citizen_id, identity, residence, employment, compliance, submitted_at)
values
  ('00000000-0000-4000-8000-000000000982', '{"birth_date":"1990-01-01","id_document_number":"BRTEST982"}', '{"region":"Centre","city":"Yaoundé","country":"Cameroun"}', '{"profession":"Salarié","employer":"Employeur test","declared_income":600000}', '{}', now()),
  ('00000000-0000-4000-8000-000000000983', '{"birth_date":"1990-01-01","id_document_number":"BRTEST983"}', '{"region":"Centre","city":"Yaoundé","country":"Cameroun"}', '{"profession":"Salarié","employer":"Employeur test","declared_income":600000}', '{}', now());

select ok(
  to_regprocedure('public.create_borrower_request()') is not null,
  'the database exposes authenticated request creation'
);
select ok(
  to_regprocedure('public.save_borrower_request_service(uuid,text)') is not null,
  'the database exposes request-scoped service selection'
);
select ok(
  to_regprocedure('public.set_prior_client_case(uuid,text)') is not null,
  'the database exposes request-scoped prior-client selection'
);
select ok(
  to_regprocedure('public.submit_service_application(uuid)') is not null,
  'the database exposes request-scoped submission'
);
select ok(
  to_regprocedure('public.withdraw_borrower_request(uuid)') is not null,
  'the database exposes audited draft withdrawal'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000982', true);

select lives_ok(
  $$select * from public.create_borrower_request()$$,
  'a borrower with submitted KYC can create a new request'
);
select lives_ok(
  $$select * from public.create_borrower_request()$$,
  'a borrower can keep a second request active at the same time'
);
select is(
  (select count(*)::integer from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' and deleted_at is null),
  2,
  'parallel requests retain separate dossier rows'
);
select is(
  (select count(*)::integer from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' and cni_normalised = 'BRTEST982' and deleted_at is null),
  2,
  'request copies may share a CNI while citizen profile uniqueness remains authoritative'
);

select lives_ok(
  $$select public.save_borrower_request_service(
      (select id from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code asc limit 1),
      (select code from ref.service where is_active and deleted_at is null order by code limit 1)
    )$$,
  'the first request stores a catalogue service'
);
select lives_ok(
  $$select public.save_borrower_request_service(
      (select id from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code desc limit 1),
      (select code from ref.service where is_active and deleted_at is null order by code limit 1)
    )$$,
  'service selection on one request does not prevent another request'
);
select lives_ok(
  $$select public.set_prior_client_case(
      (select id from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code asc limit 1),
      'deja_au_cfc'
    )$$,
  'the prior-client case changes only the selected request'
);
select lives_ok(
  $$select public.submit_service_application(
      (select id from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code asc limit 1)
    )$$,
  'the borrower can submit the selected request through regional assignment'
);
select is(
  (select onboarding_state from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code asc limit 1),
  'en_examen',
  'the submitted request enters examination'
);
select is(
  (select onboarding_state from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code desc limit 1),
  'service',
  'the other request remains in its own service-selection state'
);
select is(
  (select count(*)::integer from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000983' and deleted_at is null),
  0,
  'another borrower cannot see the request portfolio'
);
select throws_ok(
  $$select public.withdraw_borrower_request(
      (select id from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code asc limit 1)
    )$$,
  '42501',
  'request_not_withdrawable',
  'a submitted request cannot be withdrawn by its borrower'
);
select lives_ok(
  $$select public.withdraw_borrower_request(
      (select id from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code desc limit 1)
    )$$,
  'the borrower may withdraw a draft request'
);
select is(
  (select status from public.dossiers where citizen_id = '00000000-0000-4000-8000-000000000982' order by duc_code desc limit 1),
  'closed',
  'withdrawal closes the request without deleting the dossier'
);
select is(
  (select count(*)::integer from public.dossier_events e join public.dossiers d on d.id = e.dossier_id where d.citizen_id = '00000000-0000-4000-8000-000000000982' and e.event_type = 'REQUEST_WITHDRAWN'),
  1,
  'withdrawal is retained as an append-only dossier event'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000983', true);
select throws_ok(
  $$select public.submit_service_application('00000000-0000-4000-8000-000000000982'::uuid)$$,
  '42501',
  'borrower_request_not_found',
  'a borrower cannot submit another borrower’s request by guessing its ID'
);

reset role;
select * from finish();
rollback;
