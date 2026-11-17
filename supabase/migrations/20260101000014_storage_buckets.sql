-- 014 — Stockage des pièces du dossier.
--
-- Le seau `dossier-docs` est **privé** : aucune URL publique. Les pièces sont
-- servies par URL signées à durée de vie courte. Un document d'identité ne
-- doit jamais être accessible par une adresse devinable.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dossier-docs',
  'dossier-docs',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- Les agents lisent les pièces de leur périmètre. La fronts de lecture suit
-- le rattachement du dossier, pas le rôle seul.
create policy dossier_docs_staff_read on storage.objects for select to authenticated
  using (
    bucket_id = 'dossier-docs'
    and (select private.current_role()) is not null
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = name
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
-- L'emprunteur lit les pièces de son propre dossier.
create policy dossier_docs_citizen_read on storage.objects for select to authenticated
  using (
    bucket_id = 'dossier-docs'
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = name
        and d.citizen_id = (select auth.uid())
    )
  );
-- Dépôt : dans un dossier dont l'acteur a la charge, sous un premier
-- niveau de chemin indexé sur son propre identifiant.
create policy dossier_docs_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dossier-docs'
    and (select private.has_capability((select private.current_role()), 'document:upload'))
    and exists (
      select 1
      from public.dossier_documents dd
      join public.dossiers d on d.id = dd.dossier_id
      where dd.storage_path = name
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
-- Suppression : l'auteur de la pièce, ou l'administrateur.
create policy dossier_docs_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'dossier-docs'
    and (
      owner_id = (select auth.uid()::text)
      or (select private.has_capability((select private.current_role()), 'admin:roles'))
    )
  );
