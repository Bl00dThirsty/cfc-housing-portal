
create or replace function public.cfc_list_users()
returns table (
  id uuid, email text, full_name text, role text, pole text, job_title text,
  department text, phone text, initials text, avatar_tone text,
  agency_id uuid, agency_label text, scope text,
  created_at timestamptz, last_sign_in_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select sp.id, u.email::text, sp.full_name, sa.role, sp.pole, sp.job_title,
         sp.department, sp.phone, sp.initials, sp.avatar_tone,
         sp.agency_id, a.label, coalesce(r.scope, sa.scope),
         sp.created_at, u.last_sign_in_at
  from public.staff_profiles sp
  join auth.users u on u.id = sp.id
  left join public.staff_assignments sa
    on sa.actor_id = sp.id and sa.deleted_at is null
  left join ref.role r on r.code = sa.role
  left join public.agencies a on a.id = sp.agency_id
  where sp.deleted_at is null
    and (
      (select private.has_capability((select private."current_role"()), 'admin:users'))
      or sp.id = (select auth.uid())
    )
  order by sp.created_at;
$$;
grant execute on function public.cfc_list_users() to authenticated;
;
