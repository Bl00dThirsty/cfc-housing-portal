--- 020 — Fil de support : pièces jointes et réponse à un message.
---
--- Le fil passe d'un simple échange de texte à une **conversation de
--- dossier** : une pièce jointe (image ou document), une réponse à un message
--- précis, et un rendu de type messagerie instantanée.
---
--- Le fil est **strictement cloisonné** : une pièce jointe n'est lisible que
--- par les deux parties de la conversation (l'emprunteur du dossier et les
--- agents habilités à le lire). Le chemin de l'objet commence par
--- l'identifiant du dossier : c'est lui qui porte le droit d'accès.

set search_path = public, extensions;
-- ---------------------------------------------------------------------------
-- Colonnes du message
-- ---------------------------------------------------------------------------

alter table public.support_messages
  add column if not exists reply_to_id uuid references public.support_messages (id) on delete set null,
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text,
  add column if not exists attachment_size bigint,
  add column if not exists step_code text,
  add column if not exists document_id uuid references public.dossier_documents (id) on delete set null;
create index if not exists support_messages_reply_idx
  on public.support_messages (reply_to_id)
  where reply_to_id is not null;
-- Un message peut être ancré sur une étape du circuit (`CRD-07`) ou sur une
-- pièce du dossier : c'est ce qui permet de retrouver une pièce de
-- conversation dans le parcours de l'emprunteur.
create index if not exists support_messages_step_idx
  on public.support_messages (dossier_id, step_code)
  where step_code is not null;
-- Un message peut ne porter qu'une pièce jointe : son texte est alors vide.
-- La contrainte est relâchée de 1 à 0 caractère, et **l'une des deux** formes
-- est exigée.
alter table public.support_messages
  drop constraint if exists support_messages_content_check;
alter table public.support_messages
  add constraint support_messages_content_check
  check (length(content) between 0 and 4000);
alter table public.support_messages
  add constraint support_messages_body_check
  check (
    length(content) > 0
    or (attachment_path is not null and length(attachment_path) > 0)
  );
comment on column public.support_messages.reply_to_id is
  'Message auquel celui-ci répond. NULL si le message ne répond de personne.';
comment on column public.support_messages.attachment_path is
  'Chemin de l''objet dans le coffre « support-attachments ». NULL si le message ne porte pas de pièce jointe.';
comment on column public.support_messages.step_code is
  'Étape du circuit de crédit visée par le message (CRD-01…CRD-13, GAR-01). NULL si le message n''est ancré sur aucune étape.';
comment on column public.support_messages.document_id is
  'Pièce du dossier visée par le message. NULL si le message n''est ancré sur aucune pièce.';
-- ---------------------------------------------------------------------------
-- Coffre des pièces jointes
-- ---------------------------------------------------------------------------

-- Le coffre est **privé** : une pièce jointe ne s'atteint jamais par une
-- adresse devinable. Elle passe par une URL signée, comme les pièces du DUC.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do nothing;
-- Le dossier est le premier segment du chemin : c'est lui qui donne le droit.
create or replace function private.support_attachment_dossier_id(p_object_name text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif((storage.foldername(p_object_name))[1], '')::uuid
$$;
-- L'emprunteur lit les pièces jointes de son propre dossier.
--
-- `storage.objects.name` est **qualifié** : la sous-requête porte sur
-- `dossiers`, qui a elle aussi une colonne `name` (le nom de l'emprunteur) —
-- sans qualification, c'est elle qui serait lue, et aucune pièce ne
-- correspondrait jamais.
create policy support_attachments_citizen_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'support-attachments'
    and exists (
      select 1
      from public.dossiers d
      where d.id = private.support_attachment_dossier_id(storage.objects.name)
        and d.citizen_id = (select auth.uid())
    )
  );
-- Les agents lisent les pièces jointes des dossiers qu'ils peuvent lire.
create policy support_attachments_staff_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'support-attachments'
    and (select private.current_role()) is not null
    and (select private.current_role()) <> 'CITIZEN'
    and (select private.has_capability((select private.current_role()), 'dossier:read'))
    and exists (
      select 1
      from public.dossiers d
      where d.id = private.support_attachment_dossier_id(storage.objects.name)
    )
  );
-- Le dépôt : l'emprunteur dépose dans son dossier, l'agent dans un dossier
-- qu'il lit. Le nom de l'objet ne peut pas désigner un autre dossier que
-- celui du premier segment.
create policy support_attachments_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'support-attachments'
    and exists (
      select 1
      from public.dossiers d
      where d.id = private.support_attachment_dossier_id(storage.objects.name)
        and (
          d.citizen_id = (select auth.uid())
          or (
            (select private.current_role()) is not null
            and (select private.current_role()) <> 'CITIZEN'
            and (select private.has_capability((select private.current_role()), 'dossier:read'))
          )
        )
    )
  );
grant execute on function private.support_attachment_dossier_id(text) to authenticated, service_role;
-- ---------------------------------------------------------------------------
-- Cloisonnement du fil
-- ---------------------------------------------------------------------------

-- La lecture suit le **périmètre** du dossier, pas le seul rôle : un agent
-- ne lit les conversations que des dossiers qu'il peut instruire.
drop policy if exists support_messages_read on public.support_messages;
create policy support_messages_read on public.support_messages for select to authenticated
  using (
    author_user_id = (select auth.uid())
    or exists (
      select 1
      from public.dossiers d
      where d.id = support_messages.dossier_id
        and d.citizen_id = (select auth.uid())
    )
    or (
      (select private.current_role()) is not null
      and (select private.current_role()) <> 'CITIZEN'
      and (select private.has_capability((select private.current_role()), 'dossier:read'))
      and exists (
        select 1
        from public.dossiers d
        where d.id = support_messages.dossier_id
          and (select private.can_act_on_dossier(
            (select private.current_pole()),
            d.owner_user_id,
            d.agency_id,
            d.is_diaspora,
            d.id
          ))
      )
    )
  );
