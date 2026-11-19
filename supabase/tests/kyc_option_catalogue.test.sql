begin;

select plan(10);

select has_table(
  'ref',
  'kyc_option',
  'KYC answer choices live in the reference catalogue'
);

select has_view(
  'public',
  'cfc_kyc_option',
  'the authenticated onboarding form reads the public catalogue view'
);

select ok(
  to_regprocedure('private.invalid_kyc_option_category(jsonb,jsonb,jsonb,jsonb)') is not null,
  'submission validation uses the private effective-option checker'
);

select is(
  (select count(*)::integer from ref.kyc_option where deleted_at is null),
  38,
  'the catalogue migration preserves every existing KYC form choice'
);

select is(
  private.invalid_kyc_option_category(
    '{"family_status":"célibataire"}'::jsonb,
    '{"occupation_status":"locataire"}'::jsonb,
    '{"status":"CDI","income_band":"100 000 – 400 000","income_origin":"salaire"}'::jsonb,
    '{"pep_reason":"autre exposition"}'::jsonb
  ),
  null::text,
  'effective catalogue values are accepted'
);

select is(
  private.invalid_kyc_option_category(
    '{"family_status":"valeur arbitraire"}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  ),
  'family_status',
  'a value outside the current catalogue is rejected with its category'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'ref.kyc_option'::regclass),
  'the catalogue enforces row-level security'
);

select ok(
  (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'public.cfc_kyc_option'::regclass),
  'the exposed catalogue view runs with caller permissions'
);

select ok(
  position(
    'invalid_kyc_option_category' in
    pg_get_functiondef('public.submit_kyc_profile(uuid)'::regprocedure)
  ) > 0,
  'the authenticated submission RPC validates stored selections'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.invalid_kyc_option_category(jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot call the private validator directly'
);

select * from finish();
rollback;
