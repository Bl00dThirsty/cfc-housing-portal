begin;

select plan(13);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, banned_until,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000951', 'authenticated', 'authenticated', 'admin-directory@cfc.local', '', now(), null, '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000952', 'authenticated', 'authenticated', 'staff-directory@cfc.local', '', now(), null, '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000953', 'authenticated', 'authenticated', 'disabled-directory@cfc.local', '', now(), 'infinity', '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000954', 'authenticated', 'authenticated', 'invited-directory@cfc.local', '', null, null, '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000957', 'authenticated', 'authenticated', 'new-invite-directory@cfc.local', '', null, null, '{}', '{"actor_type":"staff"}', now(), now()),
  ('00000000-0000-4000-8000-000000000955', 'authenticated', 'authenticated', 'citizen-directory@cfc.local', '', now(), null, '{}', '{"actor_type":"citizen"}', now(), now());

insert into public.agencies (id, code, label, region, country)
values ('00000000-0000-4000-8000-000000000956', 'ADMIN-DIR-CENTRE', 'Agence de contrôle', 'Centre', 'CM');

insert into public.staff_profiles (id, full_name, pole, agency_id, initials)
values
  ('00000000-0000-4000-8000-000000000951', 'Administratrice test', 'ADMIN', '00000000-0000-4000-8000-000000000956', 'AT'),
  ('00000000-0000-4000-8000-000000000952', 'Gestionnaire test', 'G2', '00000000-0000-4000-8000-000000000956', 'GT'),
  ('00000000-0000-4000-8000-000000000953', 'Agent suspendu', 'G2', '00000000-0000-4000-8000-000000000956', 'AS'),
  ('00000000-0000-4000-8000-000000000954', 'Agent invité', 'G2', '00000000-0000-4000-8000-000000000956', 'AI');

insert into public.staff_assignments (actor_id, role, agency_id)
values
  ('00000000-0000-4000-8000-000000000951', 'ADMIN', '00000000-0000-4000-8000-000000000956'),
  ('00000000-0000-4000-8000-000000000952', 'GESTIONNAIRE', '00000000-0000-4000-8000-000000000956'),
  ('00000000-0000-4000-8000-000000000953', 'GESTIONNAIRE', '00000000-0000-4000-8000-000000000956'),
  ('00000000-0000-4000-8000-000000000954', 'GESTIONNAIRE', '00000000-0000-4000-8000-000000000956');

update public.staff_profiles set deleted_at = now(), deleted_by = '00000000-0000-4000-8000-000000000951'
where id = '00000000-0000-4000-8000-000000000953';
update public.staff_assignments set deleted_at = now(), deleted_by = '00000000-0000-4000-8000-000000000951', ends_at = now()
where actor_id = '00000000-0000-4000-8000-000000000953';

insert into public.actor_profile_media (actor_id, avatar_path)
values ('00000000-0000-4000-8000-000000000952', '00000000-0000-4000-8000-000000000952/00000000-0000-4000-8000-000000000952.webp');

insert into ref.role_capability (role_code, capability)
values ('ADMIN', 'admin:users') on conflict do nothing;

select ok(to_regprocedure('public.cfc_admin_list_staff()') is not null, 'the protected directory RPC exists');
select ok(to_regprocedure('public.cfc_register_invited_staff(uuid,text,text,uuid,text)') is not null, 'the invitation registration RPC does not accept a password');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000951', true);

select is((select active from public.cfc_admin_list_staff() where id = '00000000-0000-4000-8000-000000000952'), true, 'active staff appears active');
select is((select email_confirmed from public.cfc_admin_list_staff() where id = '00000000-0000-4000-8000-000000000954'), false, 'pending invitation is visible');
select is((select active from public.cfc_admin_list_staff() where id = '00000000-0000-4000-8000-000000000953'), false, 'disabled staff remains visible for reactivation');
select is((select avatar_path from public.cfc_admin_list_staff() where id = '00000000-0000-4000-8000-000000000952'), '00000000-0000-4000-8000-000000000952/00000000-0000-4000-8000-000000000952.webp', 'authorized directory row includes the staff avatar path');
select is((select count(*)::integer from public.cfc_admin_list_staff() where id = '00000000-0000-4000-8000-000000000955'), 0, 'citizen accounts never appear in the staff directory');

select lives_ok(
  $$select public.cfc_register_invited_staff(
    '00000000-0000-4000-8000-000000000957', 'Nouvel agent invité', 'GESTIONNAIRE',
    '00000000-0000-4000-8000-000000000956', 'Conseiller clientèle'
  )$$,
  'admin can attach an Auth-created invitation without passing a password'
);
select is((select actor_type from public.actors where id = '00000000-0000-4000-8000-000000000957'), 'staff', 'invited account is marked as staff');
select is((select count(*)::integer from public.staff_assignments where actor_id = '00000000-0000-4000-8000-000000000957' and deleted_at is null), 1, 'invited staff receives one active assignment');

select lives_ok(
  $$select public.cfc_set_user_active('00000000-0000-4000-8000-000000000953', true)$$,
  'reactivating a disabled staff member restores their last assignment'
);
select is((select active from public.cfc_admin_list_staff() where id = '00000000-0000-4000-8000-000000000953'), true, 'reactivated staff is immediately usable');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000952', true);
select throws_ok(
  $$select * from public.cfc_admin_list_staff()$$,
  '42501',
  'admin_users_forbidden',
  'a non-admin staff member cannot list staff accounts'
);

select * from finish();
rollback;
