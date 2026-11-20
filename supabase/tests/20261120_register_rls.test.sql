-- supabase/tests/20261120_register_rls.test.sql
begin;
select plan(4);

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r'),
  6, 'six register tables exist');

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r' and not c.relrowsecurity),
  0, 'every register table has RLS enabled');

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r' and not c.relforcerowsecurity),
  0, 'every register table forces RLS');

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname like 'registers_%'
     and c.relkind = 'r'
     and exists (
       select 1 from pg_class acl
       where has_table_privilege('anon', c.oid, 'SELECT')
     )),
  0, 'anon has no SELECT on any register');

select * from finish();
rollback;
