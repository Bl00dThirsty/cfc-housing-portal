-- KYC dropdown values are reference data: persist them, version them and let
-- the public onboarding form read the effective catalogue from Supabase.

create table if not exists ref.kyc_option (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'family_status', 'employment_status', 'income_origin', 'income_band',
    'id_document_type', 'occupation_status', 'pep_reason'
  )),
  code text not null check (length(trim(code)) > 0),
  label text not null check (length(trim(label)) > 0),
  sort_order smallint not null check (sort_order > 0),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  constraint kyc_option_effective_window check (
    effective_to is null or effective_to >= effective_from
  ),
  unique (category, code, effective_from)
);

create index if not exists kyc_option_current_idx
  on ref.kyc_option (category, sort_order, code)
  where deleted_at is null;

select private.attach_audit_trigger('ref.kyc_option');

alter table ref.kyc_option enable row level security;
alter table ref.kyc_option force row level security;

drop policy if exists kyc_option_read on ref.kyc_option;
create policy kyc_option_read on ref.kyc_option
  for select to anon, authenticated using (true);

drop policy if exists kyc_option_write on ref.kyc_option;
create policy kyc_option_write on ref.kyc_option
  for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'catalogue:write')))
  with check ((select private.has_capability((select private.current_role()), 'catalogue:write')));

grant usage on schema ref to anon, authenticated;
grant select on ref.kyc_option to anon, authenticated;
grant insert, update, delete on ref.kyc_option to authenticated;
grant all on ref.kyc_option to service_role;
revoke update (created_by, updated_by, deleted_by) on ref.kyc_option from authenticated;

create or replace view public.cfc_kyc_option
with (security_invoker = true) as
  select category, code, label, sort_order, effective_from, effective_to, deleted_at
  from ref.kyc_option;

grant select on public.cfc_kyc_option to anon, authenticated;
grant all on public.cfc_kyc_option to service_role;

insert into ref.kyc_option (category, code, label, sort_order, effective_from) values
  ('family_status', 'célibataire', 'Célibataire', 10, date '2026-01-01'),
  ('family_status', 'marié(e)', 'Marié(e)', 20, date '2026-01-01'),
  ('family_status', 'divorcé(e)', 'Divorcé(e)', 30, date '2026-01-01'),
  ('family_status', 'veuf(ve)', 'Veuf(ve)', 40, date '2026-01-01'),
  ('employment_status', 'CDI', 'CDI', 10, date '2026-01-01'),
  ('employment_status', 'CDD', 'CDD', 20, date '2026-01-01'),
  ('employment_status', 'indépendant', 'Indépendant', 30, date '2026-01-01'),
  ('employment_status', 'fonctionnaire', 'Fonctionnaire', 40, date '2026-01-01'),
  ('employment_status', 'étudiant', 'Étudiant', 50, date '2026-01-01'),
  ('employment_status', 'retraité', 'Retraité', 60, date '2026-01-01'),
  ('employment_status', 'sans emploi', 'Sans emploi', 70, date '2026-01-01'),
  ('income_origin', 'salaire', 'Salaire', 10, date '2026-01-01'),
  ('income_origin', 'revenus fonciers', 'Revenus fonciers', 20, date '2026-01-01'),
  ('income_origin', 'revenus commerciaux', 'Revenus commerciaux', 30, date '2026-01-01'),
  ('income_origin', 'revenus agricoles', 'Revenus agricoles', 40, date '2026-01-01'),
  ('income_origin', 'transferts', 'Transferts', 50, date '2026-01-01'),
  ('income_origin', 'pension', 'Pension', 60, date '2026-01-01'),
  ('income_origin', 'autre', 'Autre', 70, date '2026-01-01'),
  ('income_band', 'moins de 100 000', 'Moins de 100 000 FCFA', 10, date '2026-01-01'),
  ('income_band', '100 000 – 400 000', '100 000 – 400 000 FCFA', 20, date '2026-01-01'),
  ('income_band', '400 000 – 800 000', '400 000 – 800 000 FCFA', 30, date '2026-01-01'),
  ('income_band', '800 000 – 1 500 000', '800 000 – 1 500 000 FCFA', 40, date '2026-01-01'),
  ('income_band', '1 500 000 – 3 000 000', '1 500 000 – 3 000 000 FCFA', 50, date '2026-01-01'),
  ('income_band', 'plus de 3 000 000', 'Plus de 3 000 000 FCFA', 60, date '2026-01-01'),
  ('id_document_type', 'CNI', 'Carte nationale d’identité', 10, date '2026-01-01'),
  ('id_document_type', 'Carte de séjour', 'Carte de séjour', 20, date '2026-01-01'),
  ('id_document_type', 'Passeport', 'Passeport', 30, date '2026-01-01'),
  ('id_document_type', 'Permis de conduire', 'Permis de conduire', 40, date '2026-01-01'),
  ('id_document_type', 'Attestation administrative', 'Attestation administrative', 50, date '2026-01-01'),
  ('occupation_status', 'propriétaire', 'Propriétaire', 10, date '2026-01-01'),
  ('occupation_status', 'locataire', 'Locataire', 20, date '2026-01-01'),
  ('occupation_status', 'hébergé', 'Hébergé', 30, date '2026-01-01'),
  ('occupation_status', 'logement de famille', 'Logement de famille', 40, date '2026-01-01'),
  ('occupation_status', 'logement de fonction', 'Logement de fonction', 50, date '2026-01-01'),
  ('pep_reason', 'personne politiquement exposée', 'Personne politiquement exposée', 10, date '2026-01-01'),
  ('pep_reason', 'membre de famille d’une PPE', 'Membre de famille d’une PPE', 20, date '2026-01-01'),
  ('pep_reason', 'mandataire d’une PPE', 'Mandataire d’une PPE', 30, date '2026-01-01'),
  ('pep_reason', 'autre exposition', 'Autre exposition', 40, date '2026-01-01')
on conflict (category, code, effective_from) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    effective_to = null,
    deleted_at = null,
    updated_at = now();

create or replace function private.invalid_kyc_option_category(
  p_identity jsonb,
  p_residence jsonb,
  p_employment jsonb,
  p_compliance jsonb
) returns text
language sql stable security definer set search_path = '' as $function$
  with selected(category, selected_code, ordinal) as (
    values
      ('family_status', nullif(trim(p_identity ->> 'family_status'), ''), 1),
      ('id_document_type', nullif(trim(p_identity ->> 'id_document_type'), ''), 2),
      ('occupation_status', nullif(trim(p_residence ->> 'occupation_status'), ''), 3),
      ('employment_status', nullif(trim(p_employment ->> 'status'), ''), 4),
      ('income_band', nullif(trim(p_employment ->> 'income_band'), ''), 5),
      ('income_origin', nullif(trim(p_employment ->> 'income_origin'), ''), 6),
      ('pep_reason', nullif(trim(p_compliance ->> 'pep_reason'), ''), 7)
  )
  select selected.category
  from selected
  where selected.selected_code is not null
    and not exists (
      select 1
      from ref.kyc_option option
      where option.category = selected.category
        and option.code = selected.selected_code
        and option.effective_from <= current_date
        and (option.effective_to is null or option.effective_to >= current_date)
        and option.deleted_at is null
    )
  order by selected.ordinal
  limit 1;
$function$;

revoke all on function private.invalid_kyc_option_category(jsonb, jsonb, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.submit_kyc_profile(p_dossier_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_current_state text;
  v_submitted_at timestamptz;
  v_dossier public.dossiers%rowtype;
  v_kyc public.kyc_profiles%rowtype;
  v_invalid_category text;
begin
  if v_actor_id is null then
    raise exception 'not_a_citizen' using errcode = '42501';
  end if;

  select profile.kyc_state into v_current_state
  from public.citizen_profiles profile
  where profile.id = v_actor_id and profile.deleted_at is null;

  if v_current_state is null then
    raise exception 'not_a_citizen' using errcode = '42501';
  end if;

  select dossier.* into v_dossier
  from public.dossiers dossier
  where dossier.id = p_dossier_id
    and dossier.citizen_id = v_actor_id
    and dossier.deleted_at is null
  for update;

  if v_dossier.id is null or v_dossier.onboarding_state <> 'kyc' then
    raise exception 'borrower_request_not_found' using errcode = '42501';
  end if;

  select profile.* into v_kyc
  from public.kyc_profiles profile
  where profile.citizen_id = v_actor_id and profile.deleted_at is null
  for update;

  if v_kyc.citizen_id is null then
    raise exception 'kyc_profile_required' using errcode = '23514';
  end if;

  select profile.submitted_at into v_submitted_at
  from public.kyc_profiles profile
  where profile.citizen_id = v_actor_id;

  if v_submitted_at is not null
     or v_current_state not in ('pre_boarding', 'identity_capture', 'document_verification') then
    raise exception 'kyc_not_submittable' using errcode = '42501';
  end if;

  v_invalid_category := private.invalid_kyc_option_category(
    v_kyc.identity, v_kyc.residence, v_kyc.employment, v_kyc.compliance
  );
  if v_invalid_category is not null then
    raise exception 'invalid_kyc_option:%', v_invalid_category using errcode = '23514';
  end if;

  update public.kyc_profiles
  set submitted_at = now(), updated_at = now(), updated_by = v_actor_id
  where citizen_id = v_actor_id;

  perform set_config('app.system_update', '1', true);
  update public.citizen_profiles
  set kyc_state = 'document_verification', updated_at = now(), updated_by = v_actor_id
  where id = v_actor_id;
  perform set_config('app.system_update', '0', true);

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  ) values (
    v_dossier.id,
    'KYC_SUBMITTED',
    v_actor_id,
    'CITIZEN',
    jsonb_build_object('kyc_state', 'document_verification'),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return 'document_verification';
end
$function$;

revoke all on function public.submit_kyc_profile(uuid) from public, anon;
grant execute on function public.submit_kyc_profile(uuid) to authenticated, service_role;
