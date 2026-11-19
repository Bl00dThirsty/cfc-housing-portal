begin;

select plan(11);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000981', 'authenticated', 'authenticated', 'permissions-admin@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000982', 'authenticated', 'authenticated', 'permissions-staff@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now());
insert into public.staff_profiles (id, full_name, pole) values
  ('00000000-0000-4000-8000-000000000981', 'Administrateur habilitations', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000982', 'Agent habilitations', 'G1');
insert into public.staff_assignments (actor_id, role) values
  ('00000000-0000-4000-8000-000000000981', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000982', 'GUICHET');

select ok(to_regprocedure('public.cfc_set_role_capabilities(text,text[])') is not null, 'role grants use the guarded RPC');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000981', true);
select is(
  public.cfc_set_role_capabilities('GUICHET', array['dossier:read', 'workflow:manage']),
  2,
  'a role administrator can persist a valid capability set'
);
select ok(
  exists(select 1 from public.cfc_role_capabilities where role_code = 'GUICHET' and capability = 'workflow:manage'),
  'the effective public read model immediately reflects saved grants'
);
select ok(private.has_capability('GUICHET', 'workflow:manage'), 'database authorization observes the new grant');
select is(
  public.cfc_set_role_capabilities('GUICHET', array['dossier:read']),
  1,
  'removed grants are excluded from the effective count'
);
select ok(
  exists(select 1 from ref.role_capability where role_code = 'GUICHET' and capability = 'workflow:manage' and deleted_at is not null and deleted_by = '00000000-0000-4000-8000-000000000981'),
  'removed grants remain in the audit history'
);
select ok(not private.has_capability('GUICHET', 'workflow:manage'), 'database authorization observes the revoked grant');
select ok(
  not has_table_privilege('authenticated', 'ref.role_capability', 'INSERT')
  and not has_table_privilege('authenticated', 'ref.role_capability', 'UPDATE')
  and not has_table_privilege('authenticated', 'ref.role_capability', 'DELETE'),
  'authenticated sessions can change grants only through the guarded RPC'
);
select throws_ok(
  $$select public.cfc_set_role_capabilities('GUICHET', array['dossier:read', 'made:up'])$$,
  '22023', 'invalid_capability', 'unknown capability codes cannot be silently discarded'
);
select throws_ok(
  $$select public.cfc_set_role_capabilities('ADMIN', array['dossier:read'])$$,
  '42501', 'admin_role_locked', 'the bootstrap administrator role cannot be edited'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000982', true);
select throws_ok(
  $$select public.cfc_set_role_capabilities('GUICHET', array['dossier:read'])$$,
  '42501', 'admin_roles_forbidden', 'ordinary staff cannot edit role grants'
);

select * from finish();
rollback;
