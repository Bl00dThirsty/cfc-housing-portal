-- 035 — L'écriture du catalogue, par des fonctions de la plateforme.
--
-- Les vues de la migration 034 sont **en lecture seule** : l'écran de
-- paramétrage de la Direction Générale doit pourtant écrire le catalogue
-- (une pièce, un service, une nature, une exigence).
--
-- L'écriture passe donc par des fonctions `security definer` :
--
-- - elles sont **dans `public`**, donc accessibles à la plateforme hébergée ;
-- - elles **vérifient l'habilitation** elles-mêmes — `security definer`
--   contourne la RLS, et c'est donc à elles de dire qui peut écrire ;
-- - elles écrivent **dans `ref`**, qui reste la source unique du référentiel.
--
-- Une fonction par écriture : pas de SQL dynamique, pas de nom de table
-- reçu de l'extérieur, et une surface d'audit lisible.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- L'habilitation, vérifiée une fois pour toutes
-- ---------------------------------------------------------------------------

create or replace function private.require_catalogue_write()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not (select private.has_capability((select private.current_role()), 'catalogue:write')) then
    raise exception 'catalogue_write_forbidden' using errcode = '42501';
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Les services
-- ---------------------------------------------------------------------------

create or replace function public.cfc_upsert_service(
  p_code text,
  p_label text,
  p_description text,
  p_is_active boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.require_catalogue_write();

  insert into ref.service as s (code, label, description, is_active, updated_at)
  values (upper(p_code), p_label, nullif(p_description, ''), coalesce(p_is_active, true), now())
  on conflict (code) do update
    set label = excluded.label,
        description = excluded.description,
        is_active = excluded.is_active,
        updated_at = now();

  return true;
end;
$function$;

comment on function public.cfc_upsert_service(text, text, text, boolean) is
  'Cree ou met a jour un service du catalogue.';

-- ---------------------------------------------------------------------------
-- Les natures de piece
-- ---------------------------------------------------------------------------

create or replace function public.cfc_upsert_document_nature(
  p_code text,
  p_label text,
  p_description text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.require_catalogue_write();

  insert into ref.document_nature as n (code, label, description, updated_at)
  values (upper(p_code), p_label, nullif(p_description, ''), now())
  on conflict (code) do update
    set label = excluded.label,
        description = excluded.description,
        updated_at = now();

  return true;
end;
$function$;

comment on function public.cfc_upsert_document_nature(text, text, text) is
  'Cree ou met a jour une nature de piece.';

-- ---------------------------------------------------------------------------
-- Les types de piece
-- ---------------------------------------------------------------------------

create or replace function public.cfc_upsert_document_type(
  p_code text,
  p_label text,
  p_nature_code text,
  p_issuing_authority text,
  p_validity_months integer,
  p_max_size_bytes integer,
  p_min_count integer,
  p_max_count integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.require_catalogue_write();

  insert into ref.document_type as d (
    code, label, nature_code, issuing_authority, validity_months,
    max_size_bytes, min_count, max_count, accepted_mime, valid_from, updated_at
  )
  values (
    upper(p_code), p_label, p_nature_code, nullif(p_issuing_authority, ''),
    p_validity_months, coalesce(p_max_size_bytes, 10485760),
    greatest(coalesce(p_min_count, 1), 1), p_max_count,
    array['application/pdf', 'image/jpeg', 'image/png']::text[],
    current_date, now()
  )
  on conflict (code) do update
    set label = excluded.label,
        nature_code = excluded.nature_code,
        issuing_authority = excluded.issuing_authority,
        validity_months = excluded.validity_months,
        max_size_bytes = excluded.max_size_bytes,
        min_count = excluded.min_count,
        max_count = excluded.max_count,
        updated_at = now();

  return true;
end;
$function$;

comment on function public.cfc_upsert_document_type(text, text, text, text, integer, integer, integer, integer) is
  'Cree ou met a jour un type de piece du catalogue.';

-- ---------------------------------------------------------------------------
-- Les exigences documentaires, versionnees par date d'effet
-- ---------------------------------------------------------------------------

create or replace function public.cfc_close_service_requirement(
  p_service_code text,
  p_stage text,
  p_doc_type_code text,
  p_effective_to date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer;
begin
  perform private.require_catalogue_write();

  update ref.service_document_requirement
  set effective_to = p_effective_to,
      updated_at = now()
  where service_code = p_service_code
    and stage = p_stage
    and doc_type_code = p_doc_type_code
    and effective_to is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

comment on function public.cfc_close_service_requirement(text, text, text, date) is
  'Ferme les exigences vivantes d''un couple service / etape / piece.';

create or replace function public.cfc_open_service_requirement(
  p_service_code text,
  p_stage text,
  p_doc_type_code text,
  p_required boolean,
  p_min_count integer,
  p_max_count integer,
  p_effective_from date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
begin
  perform private.require_catalogue_write();

  insert into ref.service_document_requirement (
    service_code, stage, doc_type_code, required, min_count, max_count,
    effective_from, effective_to, updated_at
  )
  values (
    p_service_code, p_stage, p_doc_type_code, coalesce(p_required, true),
    greatest(coalesce(p_min_count, 1), 1), p_max_count,
    coalesce(p_effective_from, current_date), null, now()
  )
  on conflict (service_code, stage, doc_type_code, effective_from)
  do update
    set required = excluded.required,
        min_count = excluded.min_count,
        max_count = excluded.max_count,
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$function$;

comment on function public.cfc_open_service_requirement(text, text, text, boolean, integer, integer, date) is
  'Ouvre une exigence documentaire a une date d''effet donnee.';

-- ---------------------------------------------------------------------------
-- Les droits
-- ---------------------------------------------------------------------------

revoke all on function private.require_catalogue_write() from public;

revoke all on function public.cfc_upsert_service(text, text, text, boolean) from public;
revoke all on function public.cfc_upsert_document_nature(text, text, text) from public;
revoke all on function public.cfc_upsert_document_type(text, text, text, text, integer, integer, integer, integer) from public;
revoke all on function public.cfc_close_service_requirement(text, text, text, date) from public;
revoke all on function public.cfc_open_service_requirement(text, text, text, boolean, integer, integer, date) from public;

grant execute on function public.cfc_upsert_service(text, text, text, boolean) to authenticated, service_role;
grant execute on function public.cfc_upsert_document_nature(text, text, text) to authenticated, service_role;
grant execute on function public.cfc_upsert_document_type(text, text, text, text, integer, integer, integer, integer) to authenticated, service_role;
grant execute on function public.cfc_close_service_requirement(text, text, text, date) to authenticated, service_role;
grant execute on function public.cfc_open_service_requirement(text, text, text, boolean, integer, integer, date) to authenticated, service_role;
