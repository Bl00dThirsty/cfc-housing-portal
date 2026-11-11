-- 017 — Dépôt documentaire : policies de coffre, chaînage des versions et
-- exposition du journal des événements.
--
-- Trois besoins distincts, une seule migration :
--
-- 1. **Policies de `storage.objects`** — celles de la migration 014 ne
--    comparent pas le nom de l'objet à celui de la pièce : le `name` non
--    qualifié y désigne la colonne `dossiers.name` (le nom de l'emprunteur),
--    et non `storage.objects.name`. La comparaison ne pouvait donc jamais
--    être vraie : aucun dépôt n'était possible. Les policies sont recréées
--    ici avec la qualification explicite, une policy d'**mise à jour** est
--    ajoutée (le service de stockage finalise le dépôt par un `upsert`), et
--    l'emprunteur reçoit le droit d'écrire **dans son seul dossier**.
--
-- 2. **Chaînage des versions** — une pièce n'est jamais dupliquée : un
--    dépôt du même type supersède la pièce vivante. L'opération touche deux
--    lignes et doit être atomique : elle passe par une fonction `security
--    definer`, seule voie pour archiver une pièce déposée par un autre.
--
-- 3. **Journal des événements** — `private.append_dossier_event` n'est pas
--    exposée par l'API (le schéma `private` ne l'est jamais) : une fonction
--    d'enveloppe dans `public` rend l'appel possible depuis une application
--    tout en gardant l'autorisation et la trace d'audit dans `private`.
--
-- Règles appliquées (cf. migration 013) : `USING` pour les lectures,
-- `WITH CHECK` pour les écritures ; aucune prédicat recopié ; idempotence
-- par `if not exists` / `drop policy if exists`.

-- ---------------------------------------------------------------------------
-- Index de la chaîne de versions
-- ---------------------------------------------------------------------------
--
-- La recherche de la pièce vivante d'un couple (dossier, type de document)
-- est faite à chaque dépôt : sans index, c'est un balayage de toutes les
-- pièces du dossier. L'index ne porte que sur les pièces **vivantes** : une
-- pièce archivée n'est plus jamais candidate à une supersession.

create index if not exists dossier_documents_live_type_idx
  on public.dossier_documents (dossier_id, doc_type_code)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Policies de coffre — dépôt, mise à jour, lecture
-- ---------------------------------------------------------------------------

-- Lecture par les agents : périmètre du dossier **et** chemise autorisée.
drop policy if exists dossier_docs_staff_read on storage.objects;
create policy dossier_docs_staff_read on storage.objects for select to authenticated
  using (
    bucket_id = 'dossier-docs'
    and (select private.current_role()) is not null
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = storage.objects.name
        and (
          (select private.has_capability((select private.current_role()), 'document:read'))
          and (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
        )
        and (
          (select private.current_role()) = 'ADMIN'
          or (select private.can_read_chemise((select private.current_role()), dd.chemise_code))
        )
    )
  );

-- Lecture par l'emprunteur : les pièces de son seul dossier.
drop policy if exists dossier_docs_citizen_read on storage.objects;
create policy dossier_docs_citizen_read on storage.objects for select to authenticated
  using (
    bucket_id = 'dossier-docs'
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = storage.objects.name
        and d.citizen_id = (select auth.uid())
    )
  );

-- Dépôt par les agents : la pièce doit exister et appartenir à un dossier
-- sur lequel l'acteur agit.
drop policy if exists dossier_docs_upload on storage.objects;
create policy dossier_docs_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dossier-docs'
    and (select private.has_capability((select private.current_role()), 'document:upload'))
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = storage.objects.name
        and (
          d.citizen_id = (select auth.uid())
          or (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
        )
    )
  );

-- Dépôt par l'emprunteur : dans **son** dossier, sur **ses** pièces, et
-- seulement dans la chemise d'identification (C1) — la seule qu'il puisse
-- composer seul.
drop policy if exists dossier_docs_citizen_upload on storage.objects;
create policy dossier_docs_citizen_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dossier-docs'
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = storage.objects.name
        and dd.uploaded_by = (select auth.uid())
        and dd.chemise_code = 'C1'
        and d.citizen_id = (select auth.uid())
    )
  );

-- Finalisation du dépôt : le service de stockage écrit l'objet définitif par
-- un `INSERT ... ON CONFLICT DO UPDATE`. Sans policy de mise à jour, cette
-- seconde écriture est refusée et le dépôt échoue alors même que l'envoi a
-- réussi. L'écriture reste contenue : l'objet doit appartenir à son
-- déposant et à une pièce autorisée.
drop policy if exists dossier_docs_update on storage.objects;
create policy dossier_docs_update on storage.objects for update to authenticated
  using (
    bucket_id = 'dossier-docs'
    and owner_id = (select auth.uid()::text)
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = storage.objects.name
        and (
          d.citizen_id = (select auth.uid())
          or (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
        )
    )
  )
  with check (
    bucket_id = 'dossier-docs'
    and owner_id = (select auth.uid()::text)
  );

-- ---------------------------------------------------------------------------
-- Dépôt de l'emprunteur dans `dossier_documents`
-- ---------------------------------------------------------------------------
--
-- La policy d'insertion de la migration 013 exige la capacité
-- `document:upload` du **rôle** : un emprunteur n'a pas d'affectation, donc
-- pas de rôle, donc pas de capacité. Son dépôt est fondé sur la propriété
-- du dossier, pas sur un paquet de capacités.

drop policy if exists dossier_documents_citizen_insert on public.dossier_documents;
create policy dossier_documents_citizen_insert on public.dossier_documents
  for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and chemise_code = 'C1'
    and exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Chaînage des versions
-- ---------------------------------------------------------------------------
--
-- `public.dossier_documents` n'accorde pas à `authenticated` la mise à jour
-- de `deleted_by` : l'archivage d'une pièce déposée par un autre ne peut
-- donc pas passer par une simple instruction `UPDATE`. La fonction ci-dessous
-- est `security definer` : elle porte l'autorisation **et** l'atomicité.
--
-- Elle ne fait qu'**exécuter** la décision : la version et la pièce
-- supersédée sont calculées par l'application (fonction pure, testée sans
-- base) et passées en arguments. La fonction refuse une chaîne incohérente
-- — dossier ou type de document différent, pièce déjà archivée.

create or replace function public.apply_document_version(
  p_document_id uuid,
  p_version integer,
  p_supersedes_id uuid
) returns table (version integer, supersedes_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document public.dossier_documents%rowtype;
  v_previous public.dossier_documents%rowtype;
begin
  select * into v_document
  from public.dossier_documents
  where id = p_document_id;

  if not found then
    raise exception 'document_not_found' using errcode = 'P0002';
  end if;

  -- Autorisation : l'auteur de la pièce, ou un agent habilité au dépôt.
  if v_document.uploaded_by is distinct from (select auth.uid())
    and not (select private.has_capability((select private.current_role()), 'document:upload'))
  then
    raise exception 'document_forbidden' using errcode = '42501';
  end if;

  if p_version is null or p_version < 1 then
    raise exception 'invalid_version' using errcode = '22023';
  end if;

  if p_supersedes_id is not null then
    select * into v_previous
    from public.dossier_documents
    where id = p_supersedes_id
    for update;

    if not found then
      raise exception 'superseded_document_not_found' using errcode = 'P0002';
    end if;
    if v_previous.deleted_at is not null then
      raise exception 'version_chain_conflict' using errcode = '40001';
    end if;
    if v_previous.dossier_id is distinct from v_document.dossier_id
      or v_previous.doc_type_code is distinct from v_document.doc_type_code
    then
      raise exception 'version_chain_mismatch' using errcode = '22023';
    end if;

    update public.dossier_documents
    set deleted_at = now(),
        deleted_by = (select auth.uid())
    where id = p_supersedes_id;
  end if;

  update public.dossier_documents
  set version = p_version,
      supersedes_id = p_supersedes_id
  where id = p_document_id;

  return query select p_version, p_supersedes_id;
end;
$$;

revoke all on function public.apply_document_version(uuid, integer, uuid) from public, anon;
grant execute on function public.apply_document_version(uuid, integer, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Journal des événements — enveloppe exposée
-- ---------------------------------------------------------------------------
--
-- `private.append_dossier_event` reste la seule voie d'écriture : elle
-- refuse un acteur non habilité et renseigne l'acteur et son rôle. Elle n'est
-- simplement pas atteignable depuis l'API, le schéma `private` n'étant pas
-- exposé. L'enveloppe ci-dessous ne fait que la relayer — elle ne modifie ni
-- la trace d'audit, ni les règles d'accès.

create or replace function public.append_dossier_event(
  p_dossier_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb,
  p_legal_basis text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  v_id := private.append_dossier_event(
    p_dossier_id,
    p_event_type,
    p_payload,
    p_legal_basis,
    null,
    null
  );

  -- Un emprunteur n'a pas d'affectation : `current_role()` est nul et le rôle
  -- de l'acteur resterait vide. Il est restitué explicitement, pour que la
  -- trace reste lisible.
  if (select private.current_role()) is null then
    update public.dossier_events
    set actor_role = 'CITIZEN'
    where id = v_id and actor_role is null;
  end if;

  return v_id;
end;
$$;

revoke all on function public.append_dossier_event(uuid, text, jsonb, text) from public, anon;
grant execute on function public.append_dossier_event(uuid, text, jsonb, text) to authenticated, service_role;
