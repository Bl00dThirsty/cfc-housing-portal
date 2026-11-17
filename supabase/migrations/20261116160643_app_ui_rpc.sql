
create or replace function public.cfc_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  pole text,
  job_title text,
  department text,
  phone text,
  initials text,
  avatar_tone text,
  agency_id uuid,
  agency_label text,
  scope text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select sp.id,
         u.email::text,
         sp.full_name,
         sa.role,
         sp.pole,
         sp.job_title,
         sp.department,
         sp.phone,
         sp.initials,
         sp.avatar_tone,
         sp.agency_id,
         a.label,
         coalesce(r.scope, sa.scope),
         sp.created_at,
         u.last_sign_in_at
  from public.staff_profiles sp
  join auth.users u on u.id = sp.id
  left join public.staff_assignments sa
    on sa.actor_id = sp.id and sa.deleted_at is null
  left join ref.role r on r.code = sa.role
  left join public.agencies a on a.id = sp.agency_id
  where sp.deleted_at is null
    and (select private.has_capability((select private."current_role"()), 'admin:users'))
     or sp.id = (select auth.uid())
  order by sp.created_at;
$$;
grant execute on function public.cfc_list_users() to authenticated;

create or replace function public.cfc_post_message(
  p_dossier_id uuid,
  p_content text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_name text;
  v_role text := (select private."current_role"());
  v_duc text;
begin
  if not (select private.has_capability(v_role, 'message:send')) then
    raise exception 'message_forbidden' using errcode = '42501';
  end if;
  if length(coalesce(p_content, '')) = 0 or length(p_content) > 4000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  select coalesce(
           (select sp.full_name from public.staff_profiles sp where sp.id = (select auth.uid())),
           (select cp.full_name from public.citizen_profiles cp where cp.id = (select auth.uid())),
           'Utilisateur'
         ),
         d.duc_code
    into v_name, v_duc
  from public.dossiers d
  where d.id = p_dossier_id and d.deleted_at is null;

  if v_duc is null then
    raise exception 'dossier_not_found' using errcode = '22023';
  end if;

  insert into public.support_messages
    (room_name, dossier_id, author_user_id, author_name, author_role, content)
  values ('dossier:' || v_duc, p_dossier_id, (select auth.uid()), v_name,
          coalesce(v_role, 'CITIZEN'), p_content)
  returning id into v_id;

  perform public.cfc_notify(
    (select d.owner_user_id from public.dossiers d where d.id = p_dossier_id),
    'support.message',
    'Nouveau message sur ' || v_duc,
    left(p_content, 160),
    p_dossier_id,
    '/dossiers/' || p_dossier_id::text);

  return v_id;
end $$;
grant execute on function public.cfc_post_message(uuid, text) to authenticated;

create or replace function public.cfc_mark_notifications_read(p_ids uuid[] default null)
returns int
language plpgsql security definer set search_path = ''
as $$
declare v_count int;
begin
  update public.notifications n
     set read_at = now()
   where n.recipient_user_id = (select auth.uid())
     and n.read_at is null
     and (p_ids is null or n.id = any(p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end $$;
grant execute on function public.cfc_mark_notifications_read(uuid[]) to authenticated;

create or replace function public.cfc_audit_feed(p_limit int default 100)
returns table (
  occurred_at timestamptz,
  category text,
  event_type text,
  dossier_code text,
  dossier_id uuid,
  actor_name text,
  actor_role text,
  detail jsonb
)
language sql stable security definer set search_path = ''
as $$
  select e.occurred_at,
         'dossier'::text,
         e.event_type,
         d.duc_code,
         e.dossier_id,
         coalesce(sp.full_name, cp.full_name, 'Systeme'),
         e.actor_role,
         e.payload
  from public.dossier_events e
  join public.dossiers d on d.id = e.dossier_id
  left join public.staff_profiles sp on sp.id = e.actor_id
  left join public.citizen_profiles cp on cp.id = e.actor_id
  where (select private.has_capability((select private."current_role"()), 'admin:audit'))
  order by e.occurred_at desc
  limit greatest(1, coalesce(p_limit, 100));
$$;
grant execute on function public.cfc_audit_feed(int) to authenticated;

create or replace function public.cfc_dashboard_stats()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'total', count(*),
    'open', count(*) filter (where status = 'open'),
    'on_hold', count(*) filter (where status = 'on_hold'),
    'closed', count(*) filter (where status = 'closed'),
    'overdue', count(*) filter (where sla_deadline < now() and status <> 'closed'),
    'diaspora', count(*) filter (where is_diaspora),
    'portfolio', coalesce(sum(loan_amount), 0),
    'savings', coalesce(sum(savings_current), 0),
    'avg_progress', coalesce(round(avg(progress)), 0),
    'by_phase', coalesce((select jsonb_object_agg(current_phase, n) from (
        select current_phase, count(*)::int n from public.dossiers
        where deleted_at is null group by current_phase) x), '{}'::jsonb),
    'by_risk', coalesce((select jsonb_object_agg(risk_level, n) from (
        select risk_level, count(*)::int n from public.dossiers
        where deleted_at is null group by risk_level) y), '{}'::jsonb)
  )
  from public.dossiers
  where deleted_at is null;
$$;
grant execute on function public.cfc_dashboard_stats() to authenticated;
;
