begin;

select plan(9);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000961', 'authenticated', 'authenticated', 'admin-groups@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000962', 'authenticated', 'authenticated', 'staff-groups@cfc.local', '', now(), '{}', '{"actor_type":"staff"}', now(), now());

insert into public.staff_profiles (id, full_name, pole)
values
  ('00000000-0000-4000-8000-000000000961', 'Administrateur groupes', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000962', 'Agent groupes', 'G1');
insert into public.staff_assignments (actor_id, role)
values
  ('00000000-0000-4000-8000-000000000961', 'ADMIN'),
  ('00000000-0000-4000-8000-000000000962', 'GUICHET');

insert into ref.capability (code, label, group_label, description, sort_order)
values ('admin:groups', 'Gérer les pôles et agences', 'Administration', 'Administrer les groupes organisationnels et leurs agences.', 325)
on conflict (code) do update set label = excluded.label;
insert into ref.role_capability (role_code, capability)
values ('ADMIN', 'admin:groups') on conflict do nothing;

select ok(to_regprocedure('public.cfc_admin_list_groups()') is not null, 'the protected groups read model exists');
select ok(to_regprocedure('public.cfc_save_pole(text,text,text,smallint)') is not null, 'pole changes use an audited capability-checked RPC');
select ok(to_regprocedure('public.cfc_save_agency(uuid,text,text,text,text,boolean)') is not null, 'agency changes use an audited capability-checked RPC');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000961', true);

select is(public.cfc_save_pole('TEST-POLE', 'Pôle de test', 'Groupe organisationnel de test', 777::smallint), 'TEST-POLE', 'admin can create or update an organizational pole');
select lives_ok(
  $$select public.cfc_save_agency(null, 'TEST-AGENCY', 'Agence de test', 'Yaoundé', 'Centre', false)$$,
  'admin can create an agency and receive its persistent ID'
);
select is((select count(*)::integer from public.agencies where code = 'TEST-AGENCY'), 1, 'new agency is visible in the authorized directory');
select lives_ok(
  $$select public.cfc_save_agency(
      (select id from public.agencies where code = 'TEST-AGENCY'), 'TEST-AGENCY',
      'Agence renommée', 'Yaoundé', 'Centre', false
    )$$,
  'agency properties can be edited without re-keying its business code'
);
select throws_ok(
  $$select public.cfc_save_agency(
      (select id from public.agencies where code = 'TEST-AGENCY'), 'RENAMED-AGENCY',
      'Agence renommée', 'Yaoundé', 'Centre', false
    )$$,
  '22023', 'agency_code_immutable', 'a persisted agency code cannot be changed'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000962', true);
select throws_ok(
  $$select public.cfc_save_pole('BLOCKED', 'Interdit', null, 999::smallint)$$,
  '42501', 'admin_groups_forbidden', 'ordinary staff cannot create organizational groups'
);

select * from finish();
rollback;
