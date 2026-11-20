-- SECURITY INVOKER on purpose: no new SECURITY DEFINER function in public.
-- The server-only service-role client reads this through PostgREST and
-- already bypasses RLS; anon and authenticated are explicitly excluded.
create or replace function public.cfc_active_notification_recipients()
returns table (id uuid, role text, has_register_read boolean)
language sql stable
set search_path = ''
as $$
  select a.id,
         coalesce(sa.role, 'CITIZEN')::text,
         exists (
           select 1 from ref.role_capability rc
           where rc.role_code = sa.role and rc.capability = 'register:read'
         )
  from public.actors a
  left join public.staff_assignments sa
    on sa.actor_id = a.id and sa.starts_at <= current_date
   and (sa.ends_at is null or sa.ends_at >= current_date)
  left join public.citizen_profiles cp on cp.id = a.id
  where cp.id is not null or sa.id is not null;
$$;
revoke all on function public.cfc_active_notification_recipients() from anon, public, authenticated;
grant execute on function public.cfc_active_notification_recipients() to service_role;
