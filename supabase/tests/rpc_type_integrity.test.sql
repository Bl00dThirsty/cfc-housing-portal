begin;

select plan(3);

select ok(
  to_regprocedure('public.cfc_save_process(text,text,text,text[],text)') is not null,
  'the process save RPC accepts all process pilots as an array'
);

select ok(
  to_regprocedure('public.cfc_save_process(text,text,text,text,text)') is null,
  'the scalar-pilot overload is removed instead of shadowing the corrected RPC'
);

select ok(
  position(
    'auth_user.email::text' in
    pg_get_functiondef('public.list_regional_managers_for_dossier(uuid)'::regprocedure)
  ) > 0,
  'the regional roster casts varchar fields to the declared text result type'
);

select * from finish();
rollback;
