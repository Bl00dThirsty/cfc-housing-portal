begin;

select plan(8);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000991', 'authenticated', 'authenticated', 'audit-admin@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000992', 'authenticated', 'authenticated', 'audit-staff@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now());

insert into public.staff_profiles (id, full_name, pole) values
  ('00000000-0000-4000-8000-000000000991', 'Administrateur audit', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000992', 'Agent audit', 'G1');

insert into public.staff_assignments (actor_id, role) values
  ('00000000-0000-4000-8000-000000000991', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000992', 'GUICHET');

select ok(to_regclass('private.admin_audit_events') is not null, 'audit records stay in the private schema');
select ok(to_regprocedure('public.cfc_list_admin_audit(integer)') is not null, 'the list operation is a guarded RPC');
select ok(not has_table_privilege('authenticated', 'private.admin_audit_events', 'SELECT'), 'authenticated clients cannot read the private audit table');
select ok(has_function_privilege('authenticated', 'public.cfc_list_admin_audit(integer)', 'EXECUTE'), 'authenticated callers use the capability-checked RPC');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000991', true);
select public.cfc_set_role_capabilities('GUICHET', array['dossier:read']);

select ok(
  exists (
    select 1 from public.cfc_list_admin_audit(50)
    where actor_id = '00000000-0000-4000-8000-000000000991'
      and actor_role = 'ADMIN'
      and entity_type = 'ref.role_capability'
  ),
  'permission changes produce an attributable, safe audit event'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'private' and table_name = 'admin_audit_events'
      and column_name in ('old_data', 'new_data', 'payload', 'email', 'full_name')
  ),
  'the audit stream stores no row snapshots or personal contact fields'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('app.current_user_id', '', true);
insert into public.email_deliveries (
  template_code, recipient_email, status, created_by
) values (
  'RESET_PASSWORD', 'audit-recipient@cfc.local', 'queued', '00000000-0000-4000-8000-000000000991'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000991', true);
select ok(
  exists (
    select 1 from public.cfc_list_admin_audit(50)
    where actor_id = '00000000-0000-4000-8000-000000000991'
      and actor_role = 'ADMIN'
      and entity_type = 'public.email_deliveries'
  ),
  'service-sent password links retain the authenticated initiator without recording the recipient'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000992', true);
select throws_ok(
  $$select * from public.cfc_list_admin_audit(20)$$,
  '42501', 'admin_audit_forbidden', 'staff without admin:audit cannot read the journal'
);

select * from finish();
rollback;
