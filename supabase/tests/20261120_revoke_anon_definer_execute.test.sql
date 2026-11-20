-- supabase/tests/20261120_revoke_anon_definer_execute.test.sql
begin;
select plan(2);

select is(
  (select count(*)::int
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosecdef
     and has_function_privilege('anon', p.oid, 'EXECUTE')),
  0,
  'no SECURITY DEFINER function in public is executable by anon'
);

select is(
  (select count(*)::int
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosecdef
     and has_function_privilege('public', p.oid, 'EXECUTE')),
  0,
  'no SECURITY DEFINER function in public is executable by PUBLIC'
);

select * from finish();
rollback;
