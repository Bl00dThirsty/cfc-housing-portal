-- Forward-only alignment for public.cfc_active_notification_recipients().
-- The has_register_read gate must mirror the EXACT role/capability resolution
-- RLS uses, otherwise a divergent multi-role ordering or a soft-deleted grant
-- can emit a scoped payload (record label + deep link) to an actor RLS denies.
-- This mirrors private.current_role() (role from staff_assignments where
-- deleted_at is null, ORDER BY created_at DESC LIMIT 1 -- no validity window)
-- and private.has_capability() (rc.deleted_at is null), parameterized by actor
-- a.id, so the payload gate cannot diverge from RLS. Everything else is kept
-- identical to 20261120132000: same signature, SECURITY INVOKER, service_role
-- only, active-recipient selection via starts_at/ends_at and DISTINCT ON (a.id).
create or replace function public.cfc_active_notification_recipients()
returns table (id uuid, role text, has_register_read boolean)
language sql stable
set search_path = ''
as $$
  select distinct on (a.id)
         a.id,
         coalesce(sa.role, 'CITIZEN')::text,
         exists (
           select 1
           from ref.role_capability rc
           where rc.role_code = (
             select rls_sa.role
             from public.staff_assignments rls_sa
             where rls_sa.actor_id = a.id
               and rls_sa.deleted_at is null
             order by rls_sa.created_at desc
             limit 1
           )
             and rc.capability = 'register:read'
             and rc.deleted_at is null
         )
  from public.actors a
  left join public.staff_assignments sa
    on sa.actor_id = a.id
   and sa.deleted_at is null
   and sa.starts_at <= now()
   and (sa.ends_at is null or sa.ends_at > now())
  left join public.citizen_profiles cp on cp.id = a.id
  where cp.id is not null or sa.id is not null
  order by a.id, sa.starts_at desc;
$$;
revoke all on function public.cfc_active_notification_recipients() from anon, public, authenticated;
grant execute on function public.cfc_active_notification_recipients() to service_role;
