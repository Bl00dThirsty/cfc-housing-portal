begin;

select plan(5);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000971', 'authenticated', 'authenticated', 'workflow-admin@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000972', 'authenticated', 'authenticated', 'workflow-staff@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now());
insert into public.staff_profiles (id, full_name, pole) values
  ('00000000-0000-4000-8000-000000000971', 'Administrateur workflow', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000972', 'Agent workflow', 'G1');
insert into public.staff_assignments (actor_id, role) values
  ('00000000-0000-4000-8000-000000000971', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000972', 'GUICHET');

select ok(to_regprocedure('public.cfc_set_process_step_order(text,integer)') is not null, 'process step order RPC exists');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000971', true);
select lives_ok(
  $$select public.cfc_set_process_step_order('CRD-01', 150)$$,
  'workflow manager can change the ordering of a persisted step'
);
select is((select sort_order from ref.process_step where code = 'CRD-01'), 150, 'new order is visible in the persisted workflow read model');
select is((select updated_by from ref.process_step where code = 'CRD-01'), '00000000-0000-4000-8000-000000000971'::uuid, 'workflow edit is recorded by the shared audit trigger');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000972', true);
select throws_ok(
  $$select public.cfc_set_process_step_order('CRD-01', 200)$$,
  '42501', 'workflow_manage_forbidden', 'ordinary staff cannot reorder the workflow'
);

select * from finish();
rollback;
