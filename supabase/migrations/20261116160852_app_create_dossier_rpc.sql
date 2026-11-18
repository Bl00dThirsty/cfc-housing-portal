
create or replace function public.cfc_create_dossier(
  p_name text,
  p_cni text,
  p_phone text,
  p_email text default null,
  p_city text default null,
  p_region text default null,
  p_project_type text default 'Villa individuelle',
  p_project_title text default null,
  p_project_cost numeric default 0,
  p_loan_amount numeric default 0,
  p_duration_years smallint default 15,
  p_monthly_income numeric default 0,
  p_product_code text default 'CRD-STD'
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_role text := (select private."current_role"());
  v_seq int;
  v_duc text;
  v_rate numeric := 7.5;
  v_monthly numeric;
  v_ratio numeric;
  v_agency uuid := (select private.actor_agency_id());
  v_agency_label text;
  v_service text;
  v_citizen uuid;
  v_is_citizen boolean := (v_role = 'CITIZEN');
begin
  if not (select private.has_capability(v_role, 'dossier:create')) then
    raise exception 'dossier_create_forbidden' using errcode = '42501';
  end if;
  if length(coalesce(p_name, '')) < 3 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if length(coalesce(p_cni, '')) < 6 then
    raise exception 'invalid_cni' using errcode = '22023';
  end if;
  if p_project_cost <= 0 or p_loan_amount <= 0 or p_duration_years <= 0 then
    raise exception 'invalid_amounts' using errcode = '22023';
  end if;
  if p_loan_amount > p_project_cost then
    raise exception 'loan_exceeds_project' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.dossiers d
    where d.cni_normalised = p_cni::extensions.citext and d.deleted_at is null
  ) then
    raise exception 'cni_already_used' using errcode = '23505';
  end if;

  select s.service_code into v_service
  from ref.product s where s.code = p_product_code and s.deleted_at is null;
  if v_service is null then
    v_service := 'CRD';
    p_product_code := 'CRD-STD';
  end if;

  select coalesce(r.rate_percent, 7.5) into v_rate
  from ref.product_rate r
  where r.product_code = p_product_code
    and r.effective_from <= current_date
    and (r.effective_to is null or r.effective_to >= current_date)
  order by r.effective_from desc
  limit 1;

  v_rate := coalesce(v_rate, 7.5);
  v_monthly := round(p_loan_amount * (v_rate / 1200) /
    (1 - power(1 + v_rate / 1200, -p_duration_years * 12)), 0);
  v_ratio := case when p_monthly_income > 0
    then round(v_monthly / p_monthly_income * 100, 2) else null end;

  select count(*) + 1001 into v_seq
  from public.dossiers where duc_code like 'CFC-' || to_char(now(), 'YYYY') || '-%';
  v_duc := 'CFC-' || to_char(now(), 'YYYY') || '-' || v_seq::text;

  if v_agency is not null then
    select a.label into v_agency_label from public.agencies a where a.id = v_agency;
  end if;

  if v_is_citizen then
    v_citizen := (select auth.uid());
    if not exists (select 1 from public.citizen_profiles cp where cp.id = v_citizen) then
      insert into public.citizen_profiles (id, full_name, affiliation_status, cni_raw, phone, email, city, region, kyc_state, risk_rating, is_diaspora)
      values (v_citizen, p_name, 'first_time', p_cni, p_phone, p_email, p_city, p_region, 'identity_capture', 'STANDARD', false);
    end if;
  end if;

  insert into public.dossiers (
    id, duc_code, citizen_id, owner_user_id, agency_id, service_code, product_code,
    name, cni_raw, phone, email, city, region, agency, advisor,
    project_type, project_title, project_cost, monthly_income,
    loan_amount, rate, duration_years, monthly_payment, debt_ratio,
    risk_level, status, current_phase, current_step, progress, completion_percent,
    entered_phase_at, created_by
  ) values (
    v_id, v_duc, v_citizen, (select auth.uid()), v_agency, v_service, p_product_code,
    p_name, p_cni, p_phone, p_email, p_city, p_region, v_agency_label,
    case when v_is_citizen then p_name else
      (select sp.full_name from public.staff_profiles sp where sp.id = (select auth.uid())) end,
    p_project_type, coalesce(p_project_title, p_name), p_project_cost, p_monthly_income,
    p_loan_amount, v_rate, p_duration_years, v_monthly, v_ratio,
    case when coalesce(v_ratio, 100) > 40 then 'HIGH'
         when coalesce(v_ratio, 100) > 30 then 'STANDARD' else 'LOW' end,
    'open', 'kyc_savings', 'CRD-01', 5, 0,
    now(), (select auth.uid())
  );

  perform private.append_dossier_event(
    v_id, 'DOSSIER_CREATED',
    jsonb_build_object('duc', v_duc, 'channel', case when v_is_citizen then 'client' else 'agence' end),
    null, null, null);

  return jsonb_build_object('id', v_id, 'duc_code', v_duc, 'monthly_payment', v_monthly, 'debt_ratio', v_ratio);
end $$;
grant execute on function public.cfc_create_dossier(text, text, text, text, text, text, text, text, numeric, numeric, smallint, numeric, text) to authenticated;
;
