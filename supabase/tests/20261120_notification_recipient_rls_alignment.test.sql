-- Regression: the notification payload gate must mirror the role/capability
-- resolution RLS uses (private.current_role() + private.has_capability()), so a
-- divergent multi-role ordering or a soft-deleted grant can never leak a scoped
-- record payload to an actor RLS would deny. pgTAP runs as a privileged role, so
-- the service_role-only grant on the RPC is not an obstacle here.
begin;

select plan(3);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000701', 'authenticated', 'authenticated', 'rls-alignment-multirole@cfc.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000702', 'authenticated', 'authenticated', 'rls-alignment-softdelete@cfc.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-4000-8000-000000000703', 'authenticated', 'authenticated', 'rls-alignment-control@cfc.local', '', now(), '{}', '{}', now(), now());

update public.actors
set actor_type = 'staff'
where id in (
  '00000000-0000-4000-8000-000000000701',
  '00000000-0000-4000-8000-000000000702',
  '00000000-0000-4000-8000-000000000703'
);

-- Actor 1: two non-deleted assignments for DIFFERENT roles.
--   DIASPORA: no register:read, LATER created_at, EARLIER starts_at.
--   GUICHET : has register:read, EARLIER created_at, LATER starts_at (still active).
-- RLS resolves the effective role by created_at desc -> DIASPORA (no grant),
-- while the old RPC picked the role by starts_at desc -> GUICHET (grant).
insert into public.staff_assignments (actor_id, role, starts_at, ends_at, created_at) values
  ('00000000-0000-4000-8000-000000000701', 'DIASPORA', now() - interval '10 days', null, now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000701', 'GUICHET',  now() - interval '2 days',  null, now() - interval '10 days');

-- Actor 2: single active GUICHET role. Its register:read grant is soft-deleted
-- below; RLS (rc.deleted_at is null) then denies the capability.
insert into public.staff_assignments (actor_id, role, starts_at, ends_at, created_at) values
  ('00000000-0000-4000-8000-000000000702', 'GUICHET', now() - interval '3 days', null, now() - interval '3 days');

-- Actor 3: control with an intact grant (ADMIN) to prove the RPC still works.
insert into public.staff_assignments (actor_id, role, starts_at, ends_at, created_at) values
  ('00000000-0000-4000-8000-000000000703', 'ADMIN', now() - interval '3 days', null, now() - interval '3 days');

-- Transaction-scoped: rolled back by the surrounding test harness.
update ref.role_capability
set deleted_at = now()
where role_code = 'GUICHET' and capability = 'register:read';

select is(
  (select has_register_read from public.cfc_active_notification_recipients()
   where id = '00000000-0000-4000-8000-000000000701'),
  false,
  'multi-role actor uses RLS-effective role (created_at desc = DIASPORA): no register:read'
);

select is(
  (select has_register_read from public.cfc_active_notification_recipients()
   where id = '00000000-0000-4000-8000-000000000702'),
  false,
  'soft-deleted register:read grant yields no register:read for the recipient'
);

select is(
  (select has_register_read from public.cfc_active_notification_recipients()
   where id = '00000000-0000-4000-8000-000000000703'),
  true,
  'control actor with an intact grant still receives register:read'
);

select * from finish();
rollback;
