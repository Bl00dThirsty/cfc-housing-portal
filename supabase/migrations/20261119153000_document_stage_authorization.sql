begin;

-- A document type owns its DUC chemise. The browser cannot choose a less
-- restrictive destination for a type that contains identity evidence.
alter table ref.document_type
  add column if not exists chemise_code text references ref.chemise(code);

update ref.document_type
set chemise_code = case
  when nature_code in ('IDENTITE', 'RESIDENCE', 'REVENU', 'REVENUS', 'BANCAIRE', 'PATRIMOINE', 'CONFORMITE', 'MANDAT') then 'C1'
  when nature_code in ('TECHNIQUE', 'TRAVAUX') then 'C2'
  when nature_code in ('FONCIER', 'GARANTIE', 'NOTARIE') then 'C3'
  else null
end
where chemise_code is null;

create table if not exists ref.document_stage_phase (
  stage_code text primary key check (stage_code in (
    'ONBOARDING', 'SAVINGS', 'CREDIT_FILE', 'NOTARY', 'MORTGAGE', 'PAYOFF', 'DISBURSEMENT'
  )),
  phase_code text not null references ref.process_phase(code),
  label text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

insert into ref.document_stage_phase(stage_code, phase_code, label, sort_order) values
  ('ONBOARDING', 'kyc_savings', 'Entrée en relation et contrôle KYC', 10),
  ('SAVINGS', 'kyc_savings', 'Constitution de l’épargne', 20),
  ('CREDIT_FILE', 'risk_bet', 'Instruction et expertise crédit', 30),
  ('NOTARY', 'notary_mortgage', 'Actes notariés', 40),
  ('MORTGAGE', 'notary_mortgage', 'Garanties et assurances', 50),
  ('DISBURSEMENT', 'disbursements', 'Déblocages et inspections', 60),
  ('PAYOFF', 'closing_release', 'Extinction et mainlevée', 70)
on conflict (stage_code) do nothing;

create table if not exists ref.document_stage_role_policy (
  stage_code text not null references ref.document_stage_phase(stage_code),
  role_code text not null references ref.role(code),
  action text not null check (action in ('upload', 'validate', 'reject')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  primary key(stage_code, role_code, action)
);

-- Initial configurable duties reflect the current CFC work lanes. Full KYC
-- remains a hard boundary for the assigned GESTIONNAIRE regardless of later
-- workflow configuration. CITIZEN uploads are separately fenced by ownership.
insert into ref.document_stage_role_policy(stage_code, role_code, action) values
  ('ONBOARDING', 'GUICHET', 'upload'),
  ('ONBOARDING', 'GESTIONNAIRE', 'upload'),
  ('ONBOARDING', 'GESTIONNAIRE', 'validate'),
  ('ONBOARDING', 'GESTIONNAIRE', 'reject'),
  ('SAVINGS', 'GESTIONNAIRE', 'upload'),
  ('SAVINGS', 'GESTIONNAIRE', 'validate'),
  ('SAVINGS', 'GESTIONNAIRE', 'reject'),
  ('CREDIT_FILE', 'GESTIONNAIRE', 'upload'),
  ('CREDIT_FILE', 'GESTIONNAIRE', 'validate'),
  ('CREDIT_FILE', 'GESTIONNAIRE', 'reject'),
  ('CREDIT_FILE', 'RISQUES_BET', 'upload'),
  ('CREDIT_FILE', 'RISQUES_BET', 'validate'),
  ('CREDIT_FILE', 'RISQUES_BET', 'reject'),
  ('CREDIT_FILE', 'ANALYSTE', 'upload'),
  ('CREDIT_FILE', 'ANALYSTE', 'validate'),
  ('CREDIT_FILE', 'ANALYSTE', 'reject'),
  ('NOTARY', 'NOTAIRE', 'upload'),
  ('NOTARY', 'NOTAIRE', 'validate'),
  ('NOTARY', 'NOTAIRE', 'reject'),
  ('MORTGAGE', 'NOTAIRE', 'upload'),
  ('MORTGAGE', 'NOTAIRE', 'validate'),
  ('MORTGAGE', 'NOTAIRE', 'reject'),
  ('DISBURSEMENT', 'RISQUES_BET', 'upload'),
  ('DISBURSEMENT', 'RISQUES_BET', 'validate'),
  ('DISBURSEMENT', 'RISQUES_BET', 'reject'),
  ('CREDIT_FILE', 'ARCHIVISTE', 'validate'),
  ('CREDIT_FILE', 'ARCHIVISTE', 'reject'),
  ('NOTARY', 'ARCHIVISTE', 'validate'),
  ('NOTARY', 'ARCHIVISTE', 'reject'),
  ('MORTGAGE', 'ARCHIVISTE', 'validate'),
  ('MORTGAGE', 'ARCHIVISTE', 'reject'),
  ('DISBURSEMENT', 'ARCHIVISTE', 'validate'),
  ('DISBURSEMENT', 'ARCHIVISTE', 'reject')
on conflict (stage_code, role_code, action) do nothing;

insert into ref.role_capability(role_code, capability)
values ('ANALYSTE', 'document:upload'), ('ARCHIVISTE', 'document:upload')
on conflict (role_code, capability) do update
set deleted_at = null, deleted_by = null
where ref.role_capability.deleted_at is not null;

select private.attach_audit_trigger('ref.document_stage_phase');
select private.attach_audit_trigger('ref.document_stage_role_policy');

alter table ref.document_stage_phase enable row level security;
alter table ref.document_stage_phase force row level security;
alter table ref.document_stage_role_policy enable row level security;
alter table ref.document_stage_role_policy force row level security;

create policy document_stage_phase_read on ref.document_stage_phase
  for select to authenticated using (deleted_at is null);
create policy document_stage_phase_write on ref.document_stage_phase
  for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'workflow:manage')))
  with check ((select private.has_capability((select private.current_role()), 'workflow:manage')));
create policy document_stage_role_policy_read on ref.document_stage_role_policy
  for select to authenticated using (deleted_at is null);
create policy document_stage_role_policy_write on ref.document_stage_role_policy
  for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'workflow:manage')))
  with check ((select private.has_capability((select private.current_role()), 'workflow:manage')));

-- The configured chemise catalogue cannot widen identity access beyond the
-- assigned-manager role. A citizen gets their own documents through ownership
-- predicates in the public and Storage RLS policies.
delete from ref.chemise_readable_by
where chemise_code = 'C1'
  and role_code not in ('GESTIONNAIRE', 'CITIZEN');

create or replace function private.can_read_chemise(p_role text, p_chemise text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when p_chemise = 'C1' then p_role = 'GESTIONNAIRE'
    else exists (
      select 1
      from ref.chemise_readable_by c
      where c.chemise_code = p_chemise
        and c.role_code = p_role
        and c.deleted_at is null
    )
  end;
$$;

create or replace function private.can_act_on_document(
  p_dossier_id uuid,
  p_doc_type_code text,
  p_chemise_code text,
  p_action text
) returns boolean
language sql stable security definer set search_path = '' as $$
  with actor as (
    select
      (select auth.uid()) as actor_id,
      (select private.current_role()) as role_code
  ),
  dossier as (
    select d.id, d.citizen_id, d.owner_user_id, d.agency_id, d.is_diaspora,
           d.service_code, d.current_phase, a.role_code, a.actor_id
    from public.dossiers d
    cross join actor a
    where d.id = p_dossier_id
      and d.deleted_at is null
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
  )
  select case
    when p_action not in ('upload', 'validate', 'reject') then false
    when not exists (select 1 from eligible_requirement) then false
    when p_chemise_code = 'C1' and p_action in ('validate', 'reject') and exists (
      select 1 from dossier d
      where d.role_code is not null and d.role_code <> 'GESTIONNAIRE'
    ) then false
    when p_action = 'upload' and exists (
      select 1 from dossier d
      where d.role_code is null
        and d.citizen_id = d.actor_id
        and p_chemise_code = 'C1'
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
        case p_action
          when 'upload' then 'document:upload'
          when 'validate' then 'document:validate'
          else 'document:reject'
        end
      )
        and private.can_act_on_dossier(
          (select private.current_pole()), d.owner_user_id, d.agency_id, d.is_diaspora, d.id
        )
    ) then false
    else true
  end;
$$;

comment on function private.can_act_on_document(uuid, text, text, text) is
  'Checks current service requirement, configured phase, role action, capability, chemise, and dossier scope.';

drop policy if exists dossier_documents_insert on public.dossier_documents;
create policy dossier_documents_insert on public.dossier_documents for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (select private.can_act_on_document(dossier_id, doc_type_code, chemise_code, 'upload'))
  );
drop policy if exists dossier_documents_citizen_insert on public.dossier_documents;

drop policy if exists dossier_documents_read on public.dossier_documents;
create policy dossier_documents_read on public.dossier_documents for select to authenticated
  using (
    exists (
      select 1 from public.dossiers d
      where d.id = dossier_id and (
        d.citizen_id = (select auth.uid())
        or (
          (select private.has_capability((select private.current_role()), 'document:read'))
          and (select private.can_act_on_dossier(
            (select private.current_pole()), d.owner_user_id, d.agency_id, d.is_diaspora, d.id
          ))
          and (select private.can_read_chemise((select private.current_role()), chemise_code))
        )
      )
    )
  );

-- Decisions stay atomic and cannot be made by a role acting at the wrong
-- process phase, outside its assigned dossier scope, or across the KYC fence.
create or replace function public.decide_dossier_document(
  p_document_id uuid,
  p_decision text,
  p_note text
) returns text
language plpgsql security definer set search_path = '' as $function$
declare
  document_row public.dossier_documents%rowtype;
  dossier_row public.dossiers%rowtype;
  decision text := lower(trim(coalesce(p_decision, '')));
  note text := trim(coalesce(p_note, ''));
  event_type text;
begin
  if p_document_id is null or decision not in ('validated', 'rejected') then
    raise exception 'invalid_document_decision' using errcode = '42501';
  end if;
  select * into document_row
  from public.dossier_documents
  where id = p_document_id and deleted_at is null
  for update;
  if not found then raise exception 'document_not_found' using errcode = '42501'; end if;
  select * into dossier_row
  from public.dossiers
  where id = document_row.dossier_id and deleted_at is null;
  if not found then raise exception 'dossier_not_found' using errcode = '42501'; end if;
  if not private.can_act_on_document(
    dossier_row.id, document_row.doc_type_code, document_row.chemise_code,
    case decision when 'validated' then 'validate' else 'reject' end
  ) then
    raise exception 'document_decision_forbidden' using errcode = '42501';
  end if;
  if document_row.status not in ('uploaded', 'under_review') then
    raise exception 'document_not_decidable' using errcode = '42501';
  end if;
  if decision = 'rejected' and note = '' then
    raise exception 'motif_required' using errcode = '42501';
  end if;

  event_type := case decision when 'validated' then 'DOCUMENT_VALIDATED' else 'DOCUMENT_REJECTED' end;
  update public.dossier_documents
  set status = decision,
      validated_by = (select auth.uid()),
      validated_at = now(),
      rejection_reason = case when decision = 'rejected' then note else null end,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = document_row.id;

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  ) values (
    dossier_row.id, event_type, (select auth.uid()), (select private.current_role()),
    jsonb_build_object(
      'document_id', document_row.id, 'doc_type_code', document_row.doc_type_code,
      'decision', decision, 'note', nullif(note, ''), 'duc_code', dossier_row.duc_code
    ),
    'Contrôle documentaire selon le circuit et la phase en vigueur.', now()
  );
  return event_type;
end;
$function$;

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

-- Keep the client-side upload pipeline from bypassing the server's storage
-- verification or the atomic decision RPC by directly editing document facts.
drop policy if exists dossier_documents_update on public.dossier_documents;
drop policy if exists dossier_documents_owner_update on public.dossier_documents;
revoke update on public.dossier_documents from authenticated;

-- Restrict direct access to policy configuration; workflow:manage is the only
-- write gate, and changes are audited by the shared catalogue trigger.
revoke all on ref.document_stage_phase, ref.document_stage_role_policy from anon;
grant select on ref.document_stage_phase, ref.document_stage_role_policy to authenticated;
grant all on ref.document_stage_phase, ref.document_stage_role_policy to service_role;
grant execute on function private.can_read_chemise(text, text) to authenticated, service_role;
grant execute on function private.can_act_on_document(uuid, text, text, text) to authenticated, service_role;
revoke all on function public.decide_dossier_document(uuid, text, text) from public, anon;
grant execute on function public.decide_dossier_document(uuid, text, text) to authenticated, service_role;

create or replace view public.cfc_document_type
with (security_invoker = true) as
  select code, nature_code, label, category, issuing_authority, issuing_country,
         validity_months, renewal_reminder_days, accepted_mime, max_size_bytes,
         min_count, max_count, standalone_ok, requires_signature,
         requires_photograph, valid_from, valid_to, created_at, updated_at,
         deleted_at, chemise_code
  from ref.document_type;

create or replace view public.cfc_document_stage_phase
with (security_invoker = true) as
  select stage_code, phase_code, label, sort_order, updated_at
  from ref.document_stage_phase where deleted_at is null;

create or replace view public.cfc_document_stage_role_policy
with (security_invoker = true) as
  select stage_code, role_code, action, enabled, updated_at
  from ref.document_stage_role_policy where deleted_at is null;

grant select on public.cfc_document_type,
  public.cfc_document_stage_phase,
  public.cfc_document_stage_role_policy to authenticated;
grant all on public.cfc_document_type,
  public.cfc_document_stage_phase,
  public.cfc_document_stage_role_policy to service_role;

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
      select 1
      from public.dossier_documents document
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
      select 1
      from public.dossier_documents document
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
