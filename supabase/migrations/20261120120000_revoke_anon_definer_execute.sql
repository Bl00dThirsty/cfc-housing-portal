-- Least privilege: SECURITY DEFINER functions in public are internal or
-- authenticated-only. No public/anon EXECUTE is retained. The event dispatch
-- route uses the service-role client (src/app/api/events/dispatch/route.ts),
-- so revoking cfc_dispatch_token_valid from anon does not break the relay.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function %s from anon, public', fn.signature);
  end loop;
end $$;

-- Keep the documented internal grants explicit. These are the roles the app
-- actually uses; anon and PUBLIC are deliberately absent.
grant execute on function public.cfc_my_context() to authenticated, service_role;
grant execute on function public.cfc_dispatch_token_valid(text) to authenticated, service_role;
