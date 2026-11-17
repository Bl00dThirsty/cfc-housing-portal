
create or replace function private.refresh_dossier_progress(p_dossier_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_service_code text;
  v_required int;
  v_satisfied int;
  v_percent smallint;
  v_savings_target numeric;
  v_savings_current numeric;
  v_savings_percent numeric;
begin
  select d.service_code, d.savings_target, d.savings_current
    into v_service_code, v_savings_target, v_savings_current
    from public.dossiers d
   where d.id = p_dossier_id;

  if v_service_code is null then
    return;
  end if;

  select count(*)::int
    into v_required
    from ref.service_document_requirement r
   where r.service_code = v_service_code
     and r.deleted_at is null
     and r.effective_to is null
     and r.required
     and r.stage in ('ONBOARDING', 'SAVINGS', 'CREDIT_FILE');

  select count(*)::int
    into v_satisfied
    from ref.service_document_requirement r
   where r.service_code = v_service_code
     and r.deleted_at is null
     and r.effective_to is null
     and r.required
     and r.stage in ('ONBOARDING', 'SAVINGS', 'CREDIT_FILE')
     and (
       select count(*)::int
         from public.dossier_documents d
        where d.dossier_id = p_dossier_id
          and d.doc_type_code = r.doc_type_code
          and d.deleted_at is null
          and d.status in ('uploaded', 'under_review', 'validated')
     ) >= greatest(r.min_count, 1);

  if v_required = 0 then
    v_percent := 0;
  else
    v_percent := round((v_satisfied::numeric / v_required) * 100)::smallint;
  end if;

  if v_savings_target is null or v_savings_target <= 0 then
    v_savings_percent := null;
  else
    v_savings_percent := least(100, round((coalesce(v_savings_current, 0) / v_savings_target) * 100));
  end if;

  perform set_config('app.system_update', '1', true);

  update public.dossiers
     set completion_percent = v_percent,
         savings_percent = v_savings_percent
   where id = p_dossier_id
     and (completion_percent is distinct from v_percent
       or savings_percent is distinct from v_savings_percent);

  perform set_config('app.system_update', '0', true);
end;
$function$;

insert into public.dossier_documents
  (dossier_id, doc_type_code, chemise_code, storage_path, original_filename, mime_type, size_bytes, checksum_sha256, status, uploaded_by, uploaded_at)
select d.id, v.dtype, v.chemise, 'seed/' || d.duc_code || '/' || v.dtype || '_' || v.n || '.pdf',
       v.dtype || '_' || v.n || '.pdf', 'application/pdf', 240000 + v.n * 1000,
       encode(extensions.digest(d.duc_code || v.dtype || v.n::text, 'sha256'), 'hex'), 'validated',
       d.owner_user_id, d.created_at + interval '1 day'
from public.dossiers d
cross join (values
  ('CNI','C1',1),('ATTESTATION_TRAVAIL','C1',1),('TITRE_FONCIER','C2',1),
  ('BULLETIN_SALAIRE','C1',1),('BULLETIN_SALAIRE','C1',2),('BULLETIN_SALAIRE','C1',3),
  ('RELEVE_BANCAIRE','C1',1),('RELEVE_BANCAIRE','C1',2),('RELEVE_BANCAIRE','C1',3),
  ('DEVIS_TRAVAUX','C2',1)
) as v(dtype, chemise, n)
where d.duc_code in ('CFC-2026-1003')
  and not exists (select 1 from public.dossier_documents x where x.dossier_id = d.id and x.doc_type_code = v.dtype);

insert into public.dossier_documents
  (dossier_id, doc_type_code, chemise_code, storage_path, original_filename, mime_type, size_bytes, checksum_sha256, status, uploaded_by, uploaded_at)
select d.id, v.dtype, v.chemise, 'seed/' || d.duc_code || '/' || v.dtype || '.pdf',
       v.dtype || '.pdf', 'application/pdf', 210000,
       encode(extensions.digest(d.duc_code || v.dtype, 'sha256'), 'hex'), 'validated',
       d.owner_user_id, d.created_at + interval '2 day'
from public.dossiers d
cross join (values ('CNI','C1'),('ATTESTATION_TRAVAIL','C1'),('TITRE_FONCIER','C2')) as v(dtype, chemise)
where d.duc_code in ('CFC-2026-1001','CFC-2026-1005')
  and not exists (select 1 from public.dossier_documents x where x.dossier_id = d.id and x.doc_type_code = v.dtype);

insert into public.dossier_events (dossier_id, event_type, actor_id, actor_role, occurred_at, payload)
select d.id, e.event_type, d.owner_user_id, sa.role,
       d.created_at + e.delay, e.payload || jsonb_build_object('duc', d.duc_code)
from public.dossiers d
left join lateral (
  select s.role from public.staff_assignments s
  where s.actor_id = d.owner_user_id and s.deleted_at is null
  order by s.created_at desc limit 1) sa on true
cross join lateral (values
  ('DOSSIER_CREATED', interval '0 days', jsonb_build_object('channel','agence')),
  ('DOCUMENT_RECEIVED', interval '1 days', jsonb_build_object('doc_type','CNI')),
  ('STEP_ADVANCED', interval '3 days', jsonb_build_object('step', d.current_step, 'phase', d.current_phase))
) as e(event_type, delay, payload)
where not exists (select 1 from public.dossier_events x where x.dossier_id = d.id);
;
