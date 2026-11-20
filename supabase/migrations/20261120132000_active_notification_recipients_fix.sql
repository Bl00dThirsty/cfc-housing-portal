-- Forward-only fix for public.cfc_active_notification_recipients().
-- `staff_assignments.starts_at` is a timestamptz: comparing it to
-- `current_date` (midnight) excluded every assignment that began earlier the
-- same day, so staff actors never received a register notification. Use the
-- same validity window as private.current_role(), and ignore soft-deleted
-- rows. DISTINCT ON keeps exactly one notification per active actor even when
-- several assignments overlap. Still SECURITY INVOKER, still service_role-only.
create or replace function public.cfc_active_notification_recipients()
returns table (id uuid, role text, has_register_read boolean)
language sql stable
set search_path = ''
as $$
  select distinct on (a.id)
         a.id,
         coalesce(sa.role, 'CITIZEN')::text,
         exists (
           select 1 from ref.role_capability rc
           where rc.role_code = sa.role and rc.capability = 'register:read'
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
