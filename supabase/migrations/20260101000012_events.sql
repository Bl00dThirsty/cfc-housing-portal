-- 012 — Journal d'audit des dossiers (ajout seul) et demandes d'exercice
-- des droits des personnes.

-- ---------------------------------------------------------------------------
-- Journal d'événements — EN AJOUT SEUL
--
-- Aucune politique UPDATE ni DELETE n'est créée pour `authenticated` et le
-- privilège corresponding est révoqué : les écritures passent uniquement par
-- `private.append_dossier_event`, qui refuse un acteur non habilité.
-- ---------------------------------------------------------------------------

create table if not exists public.dossier_events (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.dossiers (id) on delete cascade,
  event_type    text not null,
  actor_id      uuid references auth.users (id) on delete set null,
  actor_role    text,
  occurred_at   timestamptz not null default now(),
  payload       jsonb not null default '{}'::jsonb,
  legal_basis   text,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
create index if not exists dossier_events_dossier_idx
  on public.dossier_events (dossier_id, occurred_at desc);
create index if not exists dossier_events_type_idx on public.dossier_events (event_type);
create index if not exists dossier_events_actor_idx on public.dossier_events (actor_id);
select private.attach_audit_trigger('public.dossier_events');
grant select, insert on public.dossier_events to authenticated;
grant all on public.dossier_events to service_role;
-- Ajout seul : ni modification, ni suppression.
revoke update, delete on public.dossier_events from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.dossier_events from authenticated;
-- ---------------------------------------------------------------------------
-- Demandes d'exercice des droits (Loi n° 2024/017)
-- ---------------------------------------------------------------------------

create table if not exists public.data_subject_requests (
  id                 uuid primary key default gen_random_uuid(),
  requester_actor_id uuid not null references public.actors (id) on delete cascade,
  subject_dossier_id uuid references public.dossiers (id) on delete set null,
  request_type       text not null check (request_type in ('access', 'rectification', 'erasure', 'portability', 'opposition', 'restriction')),
  received_at        timestamptz not null default now(),
  due_at             timestamptz,
  status             text not null default 'received' check (status in ('received', 'in_progress', 'fulfilled', 'refused', 'cancelled')),
  processed_at       timestamptz,
  processed_by       uuid references auth.users (id) on delete set null,
  response_ref       text,
  created_at         timestamptz not null default now(),
  created_by         uuid references auth.users (id) on delete set null,
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users (id) on delete set null,
  deleted_at         timestamptz,
  deleted_by         uuid references auth.users (id) on delete set null
);
create index if not exists data_subject_requests_requester_idx on public.data_subject_requests (requester_actor_id);
create index if not exists data_subject_requests_open_idx
  on public.data_subject_requests (received_at desc) where status in ('received', 'in_progress') and deleted_at is null;
select private.attach_audit_trigger('public.data_subject_requests');
grant select, insert, update, delete on public.data_subject_requests to authenticated;
grant all on public.data_subject_requests to service_role;
revoke update (created_by, updated_by, deleted_by) on public.data_subject_requests from authenticated;
-- ---------------------------------------------------------------------------
-- Journal d'audit applicatif
-- ---------------------------------------------------------------------------

create or replace function private.append_dossier_event(
  p_dossier_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb,
  p_legal_basis text default null,
  p_ip_address text default null,
  p_user_agent text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_actor uuid := (select auth.uid());
begin
  if not exists (
    select 1
    from public.dossiers d
    where d.id = p_dossier_id
      and (
        d.citizen_id = v_actor
        or (
          (select private.has_capability((select private.current_role()), 'dossier:read'))
          and (
            select private.can_act_on_dossier(
              (select private.current_pole()),
              d.owner_user_id,
              d.agency_id,
              d.is_diaspora,
              d.id
            )
          )
        )
      )
  ) then
    raise exception 'dossier_event_forbidden' using errcode = '42501';
  end if;

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, occurred_at,
    payload, legal_basis, ip_address, user_agent
  )
  values (
    p_dossier_id, p_event_type, v_actor, (select private.current_role()), now(),
    coalesce(p_payload, '{}'::jsonb), p_legal_basis, p_ip_address, p_user_agent
  )
  returning id into v_id;

  return v_id;
end $$;
grant execute on function private.append_dossier_event(uuid, text, jsonb, text, text, text)
  to authenticated, service_role;
