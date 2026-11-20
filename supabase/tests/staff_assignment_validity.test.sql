begin;

select plan(2);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000501', 'authenticated', 'authenticated', 'expired-assignment-test@cfc.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000502', 'authenticated', 'authenticated', 'future-assignment-test@cfc.local', '', now(), '{}', '{}', now(), now());

update public.actors
set actor_type = 'staff'
where id in (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000502'
);

insert into public.staff_assignments (actor_id, role, starts_at, ends_at) values
  ('00000000-0000-4000-8000-000000000501', 'GESTIONNAIRE', now() - interval '2 days', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000502', 'GESTIONNAIRE', now() + interval '1 day', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);
select throws_ok(
  $$select public.record_savings_transaction(
      '00000000-0000-4000-8000-000000000599',
      '00000000-0000-4000-8000-000000000601',
      'deposit', 1000, 'agency', null, 'Expired assignment authorization test'
    )$$,
  '42501',
  'savings_credit_forbidden',
  'an expired staff assignment grants no savings capability'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
select throws_ok(
  $$select public.record_savings_transaction(
      '00000000-0000-4000-8000-000000000599',
      '00000000-0000-4000-8000-000000000602',
      'deposit', 1000, 'agency', null, 'Future assignment authorization test'
    )$$,
  '42501',
  'savings_credit_forbidden',
  'a future staff assignment grants no savings capability'
);

reset role;
select * from finish();
rollback;
