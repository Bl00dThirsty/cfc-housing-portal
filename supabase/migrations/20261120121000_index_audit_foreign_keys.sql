-- supabase/migrations/20261120121000_index_audit_foreign_keys.sql
-- Covering indexes for audit-column foreign keys. Generated from the local
-- catalog; IF NOT EXISTS keeps the migration replayable on a fresh database.
do $$
declare
  constraint_row record;
  column_name text;
begin
  for constraint_row in
    select c.conname, c.conrelid, c.conkey, t.relname, n.nspname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'
  loop
    select a.attname into column_name
    from pg_attribute a
    where a.attrelid = constraint_row.conrelid
      and a.attnum = constraint_row.conkey[1];

    execute format(
      'create index if not exists %I on %I.%I (%I)',
      'idx_' || left(constraint_row.relname, 40) || '_' || left(column_name, 30),
      constraint_row.nspname,
      constraint_row.relname,
      column_name
    );
  end loop;
end $$;
