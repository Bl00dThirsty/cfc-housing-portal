-- Profiles are self-service data, while roles, KYC state, and dossier ownership
-- remain platform-controlled. Avatar objects are private and use the same
-- actor visibility boundary as the corresponding profile rows.

create table if not exists public.actor_profile_media (
  actor_id uuid primary key references public.actors (id) on delete cascade,
  avatar_path text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint actor_profile_media_avatar_path_owner_check
    check (split_part(avatar_path, '/', 1) = actor_id::text),
  constraint actor_profile_media_avatar_path_format_check
    check (avatar_path ~ ('^' || actor_id::text || '/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$'))
);

create index if not exists actor_profile_media_updated_idx
  on public.actor_profile_media (updated_at desc);

select private.attach_audit_trigger('public.actor_profile_media');

alter table public.actor_profile_media enable row level security;
alter table public.actor_profile_media force row level security;

create or replace function private.can_read_profile_media(p_actor_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_viewer uuid := (select auth.uid());
  v_actor_type text;
  v_role text;
  v_viewer_agency uuid;
  v_target_agency uuid;
begin
  if v_viewer is null or p_actor_id is null then
    return false;
  end if;

  if p_actor_id = v_viewer then
    return true;
  end if;

  select actor.actor_type into v_actor_type
  from public.actors actor
  where actor.id = p_actor_id and actor.deleted_at is null;

  if v_actor_type is null then
    return false;
  end if;

  v_role := (select private.current_role());

  if v_actor_type = 'citizen' then
    return v_role = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:read'))
      and exists (
        select 1
        from public.dossiers dossier
        where dossier.citizen_id = p_actor_id
          and dossier.owner_user_id = v_viewer
          and dossier.deleted_at is null
      );
  end if;

  if v_actor_type <> 'staff' or v_role is null then
    return false;
  end if;

  if v_role = 'ADMIN'
     and (select private.has_capability('ADMIN', 'admin:users')) then
    return true;
  end if;

  select coalesce(active_assignment.agency_id, profile.agency_id)
    into v_viewer_agency
  from public.staff_profiles profile
  left join lateral (
    select assignment.agency_id
    from public.staff_assignments assignment
    where assignment.actor_id = v_viewer
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
    order by assignment.starts_at desc, assignment.created_at desc
    limit 1
  ) active_assignment on true
  where profile.id = v_viewer and profile.deleted_at is null;

  select coalesce(active_assignment.agency_id, profile.agency_id)
    into v_target_agency
  from public.staff_profiles profile
  left join lateral (
    select assignment.agency_id
    from public.staff_assignments assignment
    where assignment.actor_id = p_actor_id
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
    order by assignment.starts_at desc, assignment.created_at desc
    limit 1
  ) active_assignment on true
  where profile.id = p_actor_id and profile.deleted_at is null;

  return v_viewer_agency is not null and v_viewer_agency = v_target_agency;
end
$function$;

revoke all on function private.can_read_profile_media(uuid) from public, anon, service_role;
grant execute on function private.can_read_profile_media(uuid) to authenticated;

create policy actor_profile_media_read
  on public.actor_profile_media for select to authenticated
  using ((select private.can_read_profile_media(actor_id)));

create policy actor_profile_media_insert
  on public.actor_profile_media for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and split_part(avatar_path, '/', 1) = (select auth.uid())::text
  );

create policy actor_profile_media_update
  on public.actor_profile_media for update to authenticated
  using (actor_id = (select auth.uid()))
  with check (
    actor_id = (select auth.uid())
    and split_part(avatar_path, '/', 1) = (select auth.uid())::text
  );

create policy actor_profile_media_delete
  on public.actor_profile_media for delete to authenticated
  using (actor_id = (select auth.uid()));

grant select, insert, update, delete on public.actor_profile_media to authenticated;
grant all on public.actor_profile_media to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy profile_avatars_read_authorized
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and exists (
      select 1
      from public.actor_profile_media media
      where media.avatar_path = storage.objects.name
    )
  );

create policy profile_avatars_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$')
  );

create policy profile_avatars_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create table if not exists public.citizen_profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.actors (id) on delete cascade,
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  requested_full_name text not null check (length(trim(requested_full_name)) between 2 and 160),
  reason text not null check (length(trim(reason)) between 10 and 1000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users (id) on delete set null,
  review_note text check (review_note is null or length(trim(review_note)) <= 1000),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  constraint profile_change_request_reviewer_consistency check (
    (status = 'pending' and reviewer_id is null and reviewed_at is null)
    or (status <> 'pending' and reviewer_id is not null and reviewed_at is not null)
  )
);

create unique index if not exists citizen_profile_change_requests_pending_idx
  on public.citizen_profile_change_requests (citizen_id)
  where status = 'pending';
create index if not exists citizen_profile_change_requests_dossier_idx
  on public.citizen_profile_change_requests (dossier_id, created_at desc);
create index if not exists dossiers_citizen_owner_profile_idx
  on public.dossiers (citizen_id, owner_user_id)
  where deleted_at is null;

select private.attach_audit_trigger('public.citizen_profile_change_requests');

alter table public.citizen_profile_change_requests enable row level security;
alter table public.citizen_profile_change_requests force row level security;

create policy citizen_profile_change_requests_read
  on public.citizen_profile_change_requests for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) = 'GESTIONNAIRE'
      and (select private.has_capability('GESTIONNAIRE', 'kyc:read'))
      and exists (
        select 1
        from public.dossiers dossier
        where dossier.id = citizen_profile_change_requests.dossier_id
          and dossier.citizen_id = citizen_profile_change_requests.citizen_id
          and dossier.owner_user_id = (select auth.uid())
          and dossier.deleted_at is null
      )
    )
  );

grant select on public.citizen_profile_change_requests to authenticated;
grant all on public.citizen_profile_change_requests to service_role;

create or replace function public.update_own_profile(
  p_full_name text,
  p_phone text
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_type text;
  v_kyc_state text;
  v_submitted_at timestamptz;
  v_phone text := nullif(trim(p_phone), '');
  v_dossier_id uuid;
begin
  if v_actor_id is null then
    raise exception 'profile_session_required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_full_name, ''))) not between 2 and 160 then
    raise exception 'profile_name_invalid' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'profile_phone_invalid' using errcode = '22023';
  end if;

  select actor.actor_type into v_actor_type
  from public.actors actor
  where actor.id = v_actor_id and actor.deleted_at is null;

  if v_actor_type = 'citizen' then
    select profile.kyc_state, kyc.submitted_at
      into v_kyc_state, v_submitted_at
    from public.citizen_profiles profile
    left join public.kyc_profiles kyc on kyc.citizen_id = profile.id
    where profile.id = v_actor_id and profile.deleted_at is null
    for update of profile;

    if not found then
      raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    if p_full_name is distinct from (
      select profile.full_name from public.citizen_profiles profile where profile.id = v_actor_id
    ) and (
      v_kyc_state not in ('pre_boarding', 'identity_capture')
      or v_submitted_at is not null
    ) then
      raise exception 'profile_name_review_required' using errcode = '42501';
    end if;

    update public.citizen_profiles
    set full_name = trim(p_full_name),
        phone = v_phone,
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_actor_id;

    select dossier.id into v_dossier_id
    from public.dossiers dossier
    where dossier.citizen_id = v_actor_id and dossier.deleted_at is null
    order by dossier.created_at desc, dossier.id desc
    limit 1
    for update;

    if v_dossier_id is not null then
      update public.dossiers
      set name = trim(p_full_name),
          phone = v_phone,
          updated_at = now(),
          updated_by = v_actor_id
      where id = v_dossier_id;
    end if;

    return;
  end if;

  if v_actor_type = 'staff' then
    if (select private.current_role()) is null then
      raise exception 'profile_staff_assignment_required' using errcode = '42501';
    end if;

    update public.staff_profiles
    set full_name = trim(p_full_name),
        phone = v_phone,
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_actor_id and deleted_at is null;

    if not found then
      raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    return;
  end if;

  raise exception 'profile_actor_forbidden' using errcode = '42501';
end
$function$;

revoke all on function public.update_own_profile(text, text) from public, anon;
grant execute on function public.update_own_profile(text, text) to authenticated;

create or replace function private.guard_submitted_citizen_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_submitted_at timestamptz;
begin
  if old.full_name is distinct from new.full_name
     and (select auth.uid()) = old.id
     and (select private.current_role()) is null then
    select kyc.submitted_at into v_submitted_at
    from public.kyc_profiles kyc
    where kyc.citizen_id = old.id;

    if old.kyc_state not in ('pre_boarding', 'identity_capture')
       or v_submitted_at is not null then
      raise exception 'citizen_profile_field_forbidden' using errcode = '42501';
    end if;
  end if;

  return new;
end
$function$;

revoke all on function private.guard_submitted_citizen_name() from public, anon, authenticated, service_role;

drop trigger if exists guard_submitted_citizen_name on public.citizen_profiles;
create trigger guard_submitted_citizen_name
  before update of full_name on public.citizen_profiles
  for each row execute function private.guard_submitted_citizen_name();

create or replace function public.request_citizen_name_correction(
  p_requested_full_name text,
  p_reason text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_kyc_state text;
  v_submitted_at timestamptz;
  v_current_name text;
  v_dossier_id uuid;
  v_dossier_code text;
  v_manager_id uuid;
  v_request_id uuid;
begin
  if v_actor_id is null then
    raise exception 'profile_session_required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_requested_full_name, ''))) not between 2 and 160 then
    raise exception 'profile_name_invalid' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_reason, ''))) not between 10 and 1000 then
    raise exception 'profile_name_correction_reason_required' using errcode = '22023';
  end if;

  select profile.full_name, profile.kyc_state, kyc.submitted_at
    into v_current_name, v_kyc_state, v_submitted_at
  from public.citizen_profiles profile
  left join public.kyc_profiles kyc on kyc.citizen_id = profile.id
  where profile.id = v_actor_id and profile.deleted_at is null;

  if not found or (select actor.actor_type from public.actors actor where actor.id = v_actor_id) <> 'citizen' then
    raise exception 'profile_actor_forbidden' using errcode = '42501';
  end if;
  if v_kyc_state in ('pre_boarding', 'identity_capture') and v_submitted_at is null then
    raise exception 'profile_name_correction_not_required' using errcode = '22023';
  end if;
  if trim(p_requested_full_name) = coalesce(v_current_name, '') then
    raise exception 'profile_name_unchanged' using errcode = '22023';
  end if;

  select dossier.id, dossier.duc_code, dossier.owner_user_id
    into v_dossier_id, v_dossier_code, v_manager_id
  from public.dossiers dossier
  where dossier.citizen_id = v_actor_id and dossier.deleted_at is null
  order by dossier.created_at desc, dossier.id desc
  limit 1
  for update;

  if v_dossier_id is null or v_manager_id is null then
    raise exception 'profile_name_correction_manager_unavailable' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.staff_assignments assignment
    where assignment.actor_id = v_manager_id
      and assignment.role = 'GESTIONNAIRE'
      and assignment.deleted_at is null
      and assignment.starts_at <= now()
      and (assignment.ends_at is null or assignment.ends_at > now())
  ) then
    raise exception 'profile_name_correction_manager_unavailable' using errcode = '23514';
  end if;

  insert into public.citizen_profile_change_requests (
    citizen_id, dossier_id, requested_full_name, reason, created_by, updated_by
  ) values (
    v_actor_id, v_dossier_id, trim(p_requested_full_name), trim(p_reason), v_actor_id, v_actor_id
  ) returning id into v_request_id;

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, occurred_at, payload, created_by, updated_by
  ) values (
    v_dossier_id,
    'PROFILE_NAME_CORRECTION_REQUESTED',
    v_actor_id,
    'CITIZEN',
    now(),
    jsonb_build_object('change_request_id', v_request_id),
    v_actor_id,
    v_actor_id
  );

  insert into public.notifications (
    recipient_user_id, type, title, body, dossier_id, action_url, created_by, updated_by
  ) values (
    v_manager_id,
    'profile.name_correction_requested',
    'Demande de correction de nom',
    'Une demande attend votre vérification pour le dossier ' || v_dossier_code || '.',
    v_dossier_id,
    '/portail-cfc/clients/' || v_dossier_id::text || '?tab=kyc',
    v_actor_id,
    v_actor_id
  );

  return v_request_id;
exception
  when unique_violation then
    raise exception 'profile_name_correction_pending' using errcode = '23505';
end
$function$;

revoke all on function public.request_citizen_name_correction(text, text) from public, anon;
grant execute on function public.request_citizen_name_correction(text, text) to authenticated;

create or replace function public.decide_citizen_name_correction(
  p_request_id uuid,
  p_decision text,
  p_review_note text default null
) returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_request public.citizen_profile_change_requests%rowtype;
  v_dossier_code text;
begin
  if v_actor_id is null then
    raise exception 'profile_session_required' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'profile_name_correction_decision_invalid' using errcode = '22023';
  end if;
  if p_review_note is not null and length(trim(p_review_note)) > 1000 then
    raise exception 'profile_name_correction_note_invalid' using errcode = '22023';
  end if;
  if p_decision = 'rejected' and length(trim(coalesce(p_review_note, ''))) < 10 then
    raise exception 'profile_name_correction_note_required' using errcode = '22023';
  end if;
  if (select private.current_role()) <> 'GESTIONNAIRE'
     or not (select private.has_capability('GESTIONNAIRE', 'kyc:decide')) then
    raise exception 'profile_name_correction_forbidden' using errcode = '42501';
  end if;

  select request.* into v_request
  from public.citizen_profile_change_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'profile_name_correction_not_found' using errcode = 'P0002';
  end if;
  if v_request.status <> 'pending'
     or not exists (
       select 1 from public.dossiers dossier
       where dossier.id = v_request.dossier_id
         and dossier.citizen_id = v_request.citizen_id
         and dossier.owner_user_id = v_actor_id
         and dossier.deleted_at is null
     ) then
    raise exception 'profile_name_correction_forbidden' using errcode = '42501';
  end if;

  select dossier.duc_code into v_dossier_code
  from public.dossiers dossier where dossier.id = v_request.dossier_id;

  if p_decision = 'approved' then
    update public.citizen_profiles
    set full_name = v_request.requested_full_name,
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_request.citizen_id and deleted_at is null;

    if not found then
      raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    update public.dossiers
    set name = v_request.requested_full_name,
        updated_at = now(),
        updated_by = v_actor_id
    where id = v_request.dossier_id and deleted_at is null;

    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, occurred_at, payload, created_by, updated_by
    ) values (
      v_request.dossier_id,
      'PROFILE_NAME_CORRECTION_APPROVED',
      v_actor_id,
      'GESTIONNAIRE',
      now(),
      jsonb_build_object('change_request_id', v_request.id),
      v_actor_id,
      v_actor_id
    );
  else
    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, occurred_at, payload, created_by, updated_by
    ) values (
      v_request.dossier_id,
      'PROFILE_NAME_CORRECTION_REJECTED',
      v_actor_id,
      'GESTIONNAIRE',
      now(),
      jsonb_build_object('change_request_id', v_request.id),
      v_actor_id,
      v_actor_id
    );
  end if;

  update public.citizen_profile_change_requests
  set status = p_decision,
      reviewer_id = v_actor_id,
      review_note = nullif(trim(p_review_note), ''),
      reviewed_at = now(),
      updated_at = now(),
      updated_by = v_actor_id
  where id = v_request.id;

  insert into public.notifications (
    recipient_user_id, type, title, body, dossier_id, action_url, created_by, updated_by
  ) values (
    v_request.citizen_id,
    'profile.name_correction_decided',
    case when p_decision = 'approved' then 'Correction de nom approuvée' else 'Correction de nom refusée' end,
    'Votre demande de correction pour le dossier ' || coalesce(v_dossier_code, '') || ' a été traitée.',
    v_request.dossier_id,
    '/portail-client/profil',
    v_actor_id,
    v_actor_id
  );

  return p_decision;
end
$function$;

revoke all on function public.decide_citizen_name_correction(uuid, text, text) from public, anon;
grant execute on function public.decide_citizen_name_correction(uuid, text, text) to authenticated;

create or replace function private.sync_confirmed_auth_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.email is distinct from old.email
     and exists (
       select 1 from public.actors actor
       where actor.id = new.id
         and actor.actor_type = 'citizen'
         and actor.deleted_at is null
     ) then
    update public.citizen_profiles
    set email = new.email,
        updated_at = now(),
        updated_by = new.id
    where id = new.id and deleted_at is null;

    update public.dossiers
    set email = new.email,
        updated_at = now(),
        updated_by = new.id
    where citizen_id = new.id and deleted_at is null;
  end if;

  return new;
end
$function$;

revoke all on function private.sync_confirmed_auth_email() from public, anon, authenticated, service_role;

drop trigger if exists sync_confirmed_auth_email on auth.users;
create trigger sync_confirmed_auth_email
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_confirmed_auth_email();

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (type in (
    'kyc.decision', 'document.requested', 'document.validated',
    'document.rejected', 'document.uploaded', 'committee.decision', 'loan.offer',
    'disbursement.released', 'payoff.statement', 'mainlevee.ready',
    'support.message', 'dossier.updated', 'dossier.assigned',
    'profile.name_correction_requested', 'profile.name_correction_decided'
  ));

comment on table public.actor_profile_media is
  'Private profile-image object references. Object keys are owner-scoped; URLs are generated only after RLS authorization.';
comment on table public.citizen_profile_change_requests is
  'Auditable, assigned-GESTIONNAIRE-reviewed client legal-name corrections after KYC submission.';
comment on function public.update_own_profile(text, text) is
  'Updates only the authenticated actor''s display/contact name and phone; staff authorization fields are not writable.';
