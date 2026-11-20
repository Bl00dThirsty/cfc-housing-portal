begin;

-- Stage policy grants are independent of UI defaults but still require the
-- role's global upload capability.
insert into ref.role_capability(role_code, capability)
values ('ANALYSTE', 'document:upload'), ('ARCHIVISTE', 'document:upload')
on conflict (role_code, capability) do update
set deleted_at = null, deleted_by = null
where ref.role_capability.deleted_at is not null;

-- Complete and version the document in one guarded RPC after the application
-- has verified the uploaded object's byte length and checksum.
create or replace function public.apply_document_version(
  p_document_id uuid,
  p_version integer,
  p_supersedes_id uuid
) returns table (version integer, supersedes_id uuid)
language plpgsql security definer set search_path = '' as $function$
declare
  document_row public.dossier_documents%rowtype;
  previous_row public.dossier_documents%rowtype;
begin
  select * into document_row
  from public.dossier_documents
  where id = p_document_id and deleted_at is null
  for update;
  if not found then raise exception 'document_not_found' using errcode = 'P0002'; end if;

  if document_row.uploaded_by is distinct from (select auth.uid())
    or not private.can_act_on_document(
      document_row.dossier_id, document_row.doc_type_code, document_row.chemise_code, 'upload'
    ) then
    raise exception 'document_forbidden' using errcode = '42501';
  end if;
  if p_version is null or p_version < 1 then
    raise exception 'invalid_version' using errcode = '22023';
  end if;
  if document_row.status not in ('awaiting_upload', 'uploaded') then
    raise exception 'document_upload_not_pending' using errcode = '42501';
  end if;
  if not exists (
    select 1 from storage.objects object
    where object.bucket_id = 'dossier-docs'
      and object.name = document_row.storage_path
      and object.owner_id = (select auth.uid())::text
  ) then
    raise exception 'document_storage_object_missing' using errcode = '42501';
  end if;

  if p_supersedes_id is not null then
    select * into previous_row
    from public.dossier_documents
    where id = p_supersedes_id
    for update;
    if not found or previous_row.deleted_at is not null then
      raise exception 'version_chain_conflict' using errcode = '40001';
    end if;
    if previous_row.dossier_id is distinct from document_row.dossier_id
      or previous_row.doc_type_code is distinct from document_row.doc_type_code then
      raise exception 'version_chain_mismatch' using errcode = '22023';
    end if;
    update public.dossier_documents
    set deleted_at = now(), deleted_by = (select auth.uid())
    where id = p_supersedes_id;
  end if;

  update public.dossier_documents
  set status = 'uploaded',
      version = p_version,
      supersedes_id = p_supersedes_id,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = p_document_id;
  return query select p_version, p_supersedes_id;
end;
$function$;

revoke all on function public.apply_document_version(uuid, integer, uuid) from public, anon;
grant execute on function public.apply_document_version(uuid, integer, uuid) to authenticated, service_role;

drop policy if exists dossier_docs_staff_read on storage.objects;
create policy dossier_docs_staff_read on storage.objects for select to authenticated
  using (
    bucket_id = 'dossier-docs'
    and (select private.has_capability((select private.current_role()), 'document:read'))
    and exists (
      select 1
      from public.dossier_documents document
      join public.dossiers dossier on dossier.id = document.dossier_id
      where document.storage_path = storage.objects.name
        and (select private.can_act_on_dossier(
          (select private.current_pole()), dossier.owner_user_id,
          dossier.agency_id, dossier.is_diaspora, dossier.id
        ))
        and (select private.can_read_chemise(
          (select private.current_role()), document.chemise_code
        ))
    )
  );

drop policy if exists dossier_docs_upload on storage.objects;
create policy dossier_docs_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dossier-docs'
    and exists (
      select 1 from public.dossier_documents document
      where document.storage_path = storage.objects.name
        and (select private.can_act_on_document(
          document.dossier_id, document.doc_type_code, document.chemise_code, 'upload'
        ))
    )
  );

drop policy if exists dossier_docs_citizen_upload on storage.objects;
create policy dossier_docs_citizen_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dossier-docs'
    and exists (
      select 1 from public.dossier_documents document
      where document.storage_path = storage.objects.name
        and (select private.can_act_on_document(
          document.dossier_id, document.doc_type_code, document.chemise_code, 'upload'
        ))
    )
  );

drop policy if exists dossier_docs_update on storage.objects;
create policy dossier_docs_update on storage.objects for update to authenticated
  using (
    bucket_id = 'dossier-docs'
    and owner_id = (select auth.uid()::text)
    and exists (
      select 1 from public.dossier_documents document
      where document.storage_path = storage.objects.name
        and (select private.can_act_on_document(
          document.dossier_id, document.doc_type_code, document.chemise_code, 'upload'
        ))
    )
  )
  with check (bucket_id = 'dossier-docs' and owner_id = (select auth.uid()::text));

commit;
