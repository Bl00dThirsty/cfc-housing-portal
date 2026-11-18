-- 007 — Pièces du dossier (chemises C1/C2/C3) et leur chaîne de versions.

create table if not exists public.dossier_documents (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers (id) on delete cascade,
  doc_type_code     text not null references ref.document_type (code),
  chemise_code      text not null references ref.chemise (code),
  version           integer not null default 1 check (version > 0),
  supersedes_id     uuid references public.dossier_documents (id) on delete set null,
  storage_path      text not null,
  original_filename text not null,
  mime_type         text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes        bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  checksum_sha256   text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  status            text not null default 'awaiting_upload' check (status in (
                      'awaiting_upload', 'uploaded', 'under_review', 'validated', 'rejected', 'expired'
                    )),
  valid_from        date,
  valid_until       date,
  uploaded_by       uuid references auth.users (id) on delete set null,
  uploaded_at       timestamptz not null default now(),
  validated_by      uuid references auth.users (id) on delete set null,
  validated_at      timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null,
  unique (storage_path)
);
create index if not exists dossier_documents_dossier_idx
  on public.dossier_documents (dossier_id, status);
create index if not exists dossier_documents_type_idx on public.dossier_documents (doc_type_code);
create index if not exists dossier_documents_chemise_idx on public.dossier_documents (chemise_code);
create index if not exists dossier_documents_supersedes_idx on public.dossier_documents (supersedes_id);
create index if not exists dossier_documents_checksum_idx on public.dossier_documents (checksum_sha256);
select private.attach_audit_trigger('public.dossier_documents');
grant select, insert, update, delete on public.dossier_documents to authenticated;
grant all on public.dossier_documents to service_role;
revoke update (created_by, updated_by, deleted_by) on public.dossier_documents from authenticated;
-- ---------------------------------------------------------------------------
-- Moteur de satisfaction documentaire
--
-- Un seul implément, lu par le portail comme par le back-office : les deux
-- ne peuvent pas diverger sur la question « quelle pièce manque ? ».
-- ---------------------------------------------------------------------------

create or replace function ref.missing_documents(p_service_code text, p_dossier_id uuid, p_stage text)
returns table (doc_type_code text, label text, nature_code text)
language sql stable security definer set search_path = '' as $$
  select r.doc_type_code, d.label, d.nature_code
  from ref.service_document_requirement r
  join ref.document_type d on d.code = r.doc_type_code
  where r.service_code = p_service_code
    and r.stage = p_stage
    and r.required
    and r.deleted_at is null
    and r.effective_from <= current_date
    and (r.effective_to is null or r.effective_to > current_date)
    and not exists (
      select 1
      from public.dossier_documents dd
      where dd.dossier_id = p_dossier_id
        and dd.doc_type_code = r.doc_type_code
        and dd.deleted_at is null
        and dd.status <> 'rejected'
    )
  order by d.label;
$$;
grant execute on function ref.missing_documents(text, uuid, text) to authenticated, service_role;
