-- Staff permissions and profile resolution must honor the assignment's
-- validity window. A future or expired row is not an active authorization.
create index if not exists staff_assignments_actor_validity_idx
  on public.staff_assignments (actor_id, starts_at desc, created_at desc)
  where deleted_at is null;

create or replace function private.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select sa.role
  from public.staff_assignments sa
  where sa.actor_id = (select auth.uid())
    and sa.deleted_at is null
    and sa.starts_at <= now()
    and (sa.ends_at is null or sa.ends_at > now())
  order by sa.starts_at desc, sa.created_at desc
  limit 1;
$$;

create or replace function private.actor_agency_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select sa.agency_id
  from public.staff_assignments sa
  where sa.actor_id = (select auth.uid())
    and sa.deleted_at is null
    and sa.starts_at <= now()
    and (sa.ends_at is null or sa.ends_at > now())
  order by sa.starts_at desc, sa.created_at desc
  limit 1;
$$;

comment on function private.current_role() is
  'Returns the most recent currently valid staff assignment for auth.uid().';
comment on function private.actor_agency_id() is
  'Returns the agency from the most recent currently valid staff assignment for auth.uid().';
