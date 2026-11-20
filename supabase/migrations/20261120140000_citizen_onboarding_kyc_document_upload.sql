-- Allow citizens to upload C1 onboarding/KYC documents on their own dossier
-- before a service/phase requirement context exists (new account KYC draft),
-- and ensure the KYC residence proof document type exists.

begin;

-- Ensure nature exists (some environments are missing seed catalogue rows).
insert into ref.document_nature (
  code, label, description, requires_issuer_check, requires_validity_check, requires_human_review, sort_order
) values (
  'RESIDENCE',
  'Résidence',
  'Justificatif de domicile ou de résidence effective.',
  true,
  false,
  true,
  2
)
on conflict (code) do update set
  label = excluded.label,
  description = coalesce(ref.document_nature.description, excluded.description),
  deleted_at = null,
  deleted_by = null,
  updated_at = now();

-- Missing in some environments: required by KYC onboarding UI (KYC_DOCUMENTS).
insert into ref.document_type (
  code, nature_code, label, issuing_authority, issuing_country,
  validity_months, renewal_reminder_days, accepted_mime, max_size_bytes,
  min_count, max_count, standalone_ok, requires_signature, requires_photograph,
  valid_from, category, chemise_code
) values (
  'PROOF_OF_RESIDENCE',
  'RESIDENCE',
  'Justificatif de domicile',
  'CFC, bailleur, unité administrative',
  'CM',
  6,
  15,
  array['application/pdf','image/jpeg','image/png']::text[],
  10485760,
  1,
  1,
  true,
  false,
  false,
  date '2026-11-19',
  'emprunteur',
  'C1'
)
on conflict (code) do update set
  nature_code = excluded.nature_code,
  label = excluded.label,
  issuing_authority = excluded.issuing_authority,
  issuing_country = excluded.issuing_country,
  validity_months = excluded.validity_months,
  renewal_reminder_days = excluded.renewal_reminder_days,
  accepted_mime = excluded.accepted_mime,
  max_size_bytes = excluded.max_size_bytes,
  min_count = excluded.min_count,
  max_count = excluded.max_count,
  standalone_ok = excluded.standalone_ok,
  requires_signature = excluded.requires_signature,
  requires_photograph = excluded.requires_photograph,
  category = coalesce(ref.document_type.category, excluded.category),
  chemise_code = coalesce(ref.document_type.chemise_code, excluded.chemise_code),
  deleted_at = null,
  deleted_by = null,
  updated_at = now();

create or replace function private.can_act_on_document(
  p_dossier_id uuid,
  p_doc_type_code text,
  p_chemise_code text,
  p_action text
) returns boolean
language sql stable security definer set search_path = '' as $$
  with actor as (
    select (select auth.uid()) as actor_id, (select private.current_role()) as role_code
  ),
  dossier as (
    select d.id, d.citizen_id, d.owner_user_id, d.agency_id, d.is_diaspora,
           d.service_code, d.current_phase, d.onboarding_state, a.role_code, a.actor_id
    from public.dossiers d
    cross join actor a
    where d.id = p_dossier_id and d.deleted_at is null
  ),
  eligible_requirement as (
    select r.stage
    from dossier d
    join ref.service_document_requirement r on r.service_code = d.service_code
    join ref.document_stage_phase stage on stage.stage_code = r.stage and stage.deleted_at is null
    join ref.document_type type on type.code = r.doc_type_code and type.deleted_at is null
    where r.doc_type_code = p_doc_type_code
      and r.deleted_at is null
      and r.effective_from <= current_date
      and (r.effective_to is null or r.effective_to >= current_date)
      and type.chemise_code = p_chemise_code
      and d.current_phase = stage.phase_code
  ),
  doc_type as (
    select type.chemise_code
    from ref.document_type type
    where type.code = p_doc_type_code and type.deleted_at is null
  )
  select case
    when p_action not in ('upload', 'validate', 'reject') then false
    when not exists (select 1 from dossier) then false
    when p_chemise_code = 'C1'
      and p_action in ('validate', 'reject')
      and exists (select 1 from dossier d where d.role_code is not null and d.role_code <> 'GESTIONNAIRE') then false
    -- Citizen onboarding/KYC: allow owner to upload C1 documents on their own
    -- dossier before service/phase requirement routing is established, so
    -- justificatifs can be submitted for gestionnaire review/DUC activation.
    when p_action = 'upload'
      and p_chemise_code = 'C1'
      and exists (
        select 1 from dossier d
        where d.role_code is null
          and d.citizen_id = d.actor_id
          and d.onboarding_state in ('kyc', 'service', 'documents')
      )
      and exists (select 1 from doc_type t where t.chemise_code = 'C1')
    then true
    when not exists (select 1 from eligible_requirement) then false
    when p_action = 'upload' and exists (
      select 1 from dossier d
      where d.role_code is null and d.citizen_id = d.actor_id and p_chemise_code = 'C1'
    ) then true
    when not exists (
      select 1
      from dossier d
      join eligible_requirement r on true
      join ref.document_stage_role_policy policy
        on policy.stage_code = r.stage
       and policy.role_code = d.role_code
       and policy.action = p_action
       and policy.enabled
       and policy.deleted_at is null
      where private.has_capability(
        d.role_code,
        case p_action when 'upload' then 'document:upload'
          when 'validate' then 'document:validate' else 'document:reject' end
      )
        and private.can_act_on_dossier(
          (select private.current_pole()), d.owner_user_id, d.agency_id, d.is_diaspora, d.id
        )
    ) then false
    else true
  end;
$$;

revoke all on function private.can_act_on_document(uuid, text, text, text) from public;
grant execute on function private.can_act_on_document(uuid, text, text, text) to authenticated, service_role;

commit;
