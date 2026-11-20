-- supabase/tests/20261120_revoke_anon_definer_execute.test.sql
begin;
select plan(3);

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

select is(
  (select count(*)::int
   from pg_constraint c
   join pg_class t on t.oid = c.conrelid
   join pg_namespace n on n.oid = c.connamespace
   where c.contype = 'f' and n.nspname = 'public'
     and not exists (
       select 1 from pg_index i
       where i.indrelid = c.conrelid
         and i.indkey[0] = c.conkey[1]
     )),
  0,
  'every public foreign key has a covering index'
);

select * from finish();
rollback;
