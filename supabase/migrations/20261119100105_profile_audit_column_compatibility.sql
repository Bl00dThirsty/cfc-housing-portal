-- The shared audit trigger references deleted_at/deleted_by for every
-- INSERT/UPDATE. These profile tables were audited without those fields,
-- causing their first insert to fail before the trigger could return NEW.
alter table public.actor_profile_media
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users (id) on delete set null;

alter table public.citizen_profile_change_requests
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users (id) on delete set null;

drop policy if exists actor_profile_media_read on public.actor_profile_media;
create policy actor_profile_media_read
  on public.actor_profile_media for select to authenticated
  using (
    deleted_at is null
    and (select private.can_read_profile_media(actor_id))
  );

drop policy if exists actor_profile_media_insert on public.actor_profile_media;
create policy actor_profile_media_insert
  on public.actor_profile_media for insert to authenticated
  with check (
    deleted_at is null
    and actor_id = (select auth.uid())
    and split_part(avatar_path, '/', 1) = (select auth.uid())::text
  );

drop policy if exists actor_profile_media_update on public.actor_profile_media;
create policy actor_profile_media_update
  on public.actor_profile_media for update to authenticated
  using (actor_id = (select auth.uid()) and deleted_at is null)
  with check (
    actor_id = (select auth.uid())
    and deleted_at is null
    and split_part(avatar_path, '/', 1) = (select auth.uid())::text
  );

drop policy if exists actor_profile_media_delete on public.actor_profile_media;
create policy actor_profile_media_delete
  on public.actor_profile_media for delete to authenticated
  using (actor_id = (select auth.uid()) and deleted_at is null);

drop policy if exists profile_avatars_read_authorized on storage.objects;
create policy profile_avatars_read_authorized
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and exists (
      select 1
      from public.actor_profile_media media
      where media.avatar_path = storage.objects.name
        and media.deleted_at is null
    )
  );

drop index if exists public.citizen_profile_change_requests_pending_idx;
create unique index citizen_profile_change_requests_pending_idx
  on public.citizen_profile_change_requests (citizen_id)
  where status = 'pending' and deleted_at is null;

drop policy if exists citizen_profile_change_requests_read on public.citizen_profile_change_requests;
create policy citizen_profile_change_requests_read
  on public.citizen_profile_change_requests for select to authenticated
  using (
    deleted_at is null
    and (
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
    )
  );
