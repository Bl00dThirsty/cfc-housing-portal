begin;

select plan(12);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'savings-maker-test@cfc.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'savings-checker-test@cfc.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000103', 'authenticated', 'authenticated', 'savings-teller-test@cfc.local', '', now(), '{}', '{}', now(), now());

update public.actors
set actor_type = 'staff'
where id in (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103'
);

insert into public.staff_assignments (actor_id, role) values
  ('00000000-0000-4000-8000-000000000101', 'GESTIONNAIRE'),
  ('00000000-0000-4000-8000-000000000102', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000103', 'GUICHET');

insert into public.dossiers (id, duc_code, owner_user_id, name, status)
values (
  '00000000-0000-4000-8000-000000000201',
  'DUC-SAVINGS-IDEMPOTENCY-TEST',
  '00000000-0000-4000-8000-000000000101',
  'Dossier de test du grand livre',
  'open'
);

insert into public.savings_accounts (id, dossier_id, account_number, balance, status)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000201',
  'CPT-SAVINGS-IDEMPOTENCY-TEST',
  0,
  'active'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);

select is(
  public.record_savings_transaction(
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000401',
    'deposit', 1000, 'agency', null, 'Versement de test'
  ),
  public.record_savings_transaction(
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000401',
    'deposit', 1000, 'agency', null, 'Versement de test'
  ),
  'a retried recording request returns the same transaction'
);

select is(
  (select count(*)::integer from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
  1,
  'a retry creates only one ledger row'
);

select throws_ok(
  $$select public.record_savings_transaction(
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000401',
      'deposit', 2000, 'agency', null, 'Versement de test'
    )$$,
  '23505',
  'savings_idempotency_conflict',
  'reusing a request key with changed data is rejected'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select is(
  public.decide_savings_transaction(
    (select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
    'validate',
    null
  ),
  1000::numeric,
  'the independent checker validates and credits the account'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select throws_ok(
  $$select public.reverse_savings_transaction(
      (select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
      '00000000-0000-4000-8000-000000000402',
      'Correction demandée par le rapprochement'
    )$$,
  '42501',
  'savings_reversal_maker_forbidden',
  'the original maker cannot reverse their own transaction'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select is(
  public.reverse_savings_transaction(
    (select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
    '00000000-0000-4000-8000-000000000403',
    'Correction demandée par le rapprochement'
  ),
  public.reverse_savings_transaction(
    (select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
    '00000000-0000-4000-8000-000000000403',
    'Correction demandée par le rapprochement'
  ),
  'a retried reversal request returns its existing compensating entry'
);

select is(
  (select count(*)::integer from public.savings_transactions where reversal_of = (
    select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'
  )),
  1,
  'the source can have only one active reversal'
);

select is(
  (select balance from public.savings_accounts where id = '00000000-0000-4000-8000-000000000301'),
  0::numeric,
  'the reversal posts the opposite amount to the account balance'
);

select ok(
  exists (
    select 1 from public.savings_transactions
    where idempotency_key = '00000000-0000-4000-8000-000000000401'
      and transaction_type = 'deposit'
      and decision_state = 'validated'
      and debit is null
      and credit = 1000
      and reversal_of is null
  ),
  'the source entry remains unchanged and auditable'
);

select ok(
  exists (
    select 1 from public.savings_transactions reversal
    join public.savings_transactions source on source.id = reversal.reversal_of
    where source.idempotency_key = '00000000-0000-4000-8000-000000000401'
      and reversal.transaction_type = 'withdrawal'
      and reversal.amount = source.amount
      and reversal.debit = source.amount
      and reversal.decision_state = 'validated'
      and reversal.decision_note = 'Correction demandée par le rapprochement'
  ),
  'the compensating entry records the source, opposite movement, and reason'
);

select throws_ok(
  $$select public.reverse_savings_transaction(
      (select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
      '00000000-0000-4000-8000-000000000404',
      'Deuxième demande de correction'
    )$$,
  '55000',
  'savings_transaction_already_reversed',
  'a different request key cannot reverse the same source a second time'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000103', true);
select throws_ok(
  $$select public.reverse_savings_transaction(
      (select id from public.savings_transactions where idempotency_key = '00000000-0000-4000-8000-000000000401'),
      '00000000-0000-4000-8000-000000000405',
      'Correction sans droit'
    )$$,
  '42501',
  'savings_reversal_forbidden',
  'the database denies reversal to a role without the capability'
);

reset role;
select * from finish();
rollback;
