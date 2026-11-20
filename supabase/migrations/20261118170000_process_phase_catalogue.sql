-- Reference process phases and steps live in Postgres so tracking, analytics,
-- and staff-managed catalogues share one source of truth.

create table if not exists ref.process_phase (
  code text primary key check (code in (
    'kyc_savings', 'risk_bet', 'committees',
    'notary_mortgage', 'disbursements', 'closing_release'
  )),
  label text not null,
  sort_order smallint not null unique check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into ref.process_phase (code, label, sort_order) values
  ('kyc_savings', 'Instruction et constitution de l''épargne', 10),
  ('risk_bet', 'Évaluation technique et contre-expertise BET', 20),
  ('committees', 'Décision d''octroi', 30),
  ('notary_mortgage', 'Constitution des garanties et mise en place', 40),
  ('disbursements', 'Déblocages sur inspection de chantier', 50),
  ('closing_release', 'Extinction de dette et mainlevée', 60)
on conflict (code) do update
  set label = excluded.label,
      sort_order = excluded.sort_order,
      updated_at = now();

alter table ref.process_phase enable row level security;
drop policy if exists process_phase_read on ref.process_phase;
create policy process_phase_read on ref.process_phase
  for select to authenticated using (true);

alter table ref.process_step
  add column if not exists sort_order integer not null default 10000;

with step_order(code, sort_order) as (values
  ('CRD-01', 100), ('CRD-02', 200), ('CRD-03', 300),
  ('CRD-04', 400), ('CRD-06', 500),
  ('CRD-07', 600), ('CRD-08', 700), ('CRD-09', 800), ('CRD-10', 900),
  ('GAR-01', 1000), ('CRD-11', 1100),
  ('CRD-12', 1200), ('CRD-13', 1300),
  ('GAR-06', 1400), ('REC-06', 1500), ('REC-09', 1600),
  ('REC-10', 1700), ('GAR-05', 1800)
)
update ref.process_step as step
set sort_order = step_order.sort_order
from step_order
where step.code = step_order.code;

create or replace view public.cfc_process_steps
with (security_invoker = true) as
  select s.code, s.process_code, s.label, s.phase, s.lane,
         s.is_external, s.sla_days, s.deleted_at, s.sort_order
  from ref.process_step s;

create or replace view public.cfc_process_phases
with (security_invoker = true) as
  select p.code, p.label, p.sort_order
  from ref.process_phase p;

grant select on public.cfc_process_steps, public.cfc_process_phases to authenticated;

create or replace function public.cfc_save_process_step(
  p_code text,
  p_process_code text,
  p_label text,
  p_phase text default null,
  p_lane text default 'agence',
  p_sla_days int default null,
  p_is_external boolean default false
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_role text := (select private."current_role"());
begin
  if not (select private.has_capability(v_role, 'workflow:manage')) then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if not exists (
    select 1 from ref.process p
    where p.code = upper(trim(p_process_code)) and p.deleted_at is null
  ) then
    raise exception 'unknown_process:%', p_process_code using errcode = '22023';
  end if;
  if length(trim(coalesce(p_label, ''))) = 0 then
    raise exception 'invalid_label' using errcode = '22023';
  end if;
  if p_lane not in ('client','agence','siege','partenaires','support') then
    raise exception 'invalid_lane' using errcode = '22023';
  end if;
  if p_phase is not null and not exists (
    select 1 from ref.process_phase phase where phase.code = p_phase
  ) then
    raise exception 'invalid_phase' using errcode = '22023';
  end if;
  if p_sla_days is not null and p_sla_days <= 0 then
    raise exception 'invalid_sla' using errcode = '22023';
  end if;

  insert into ref.process_step (
    code, process_code, label, phase, lane, sla_days, is_external, sort_order
  ) values (
    upper(trim(p_code)), upper(trim(p_process_code)), trim(p_label),
    p_phase, p_lane, p_sla_days, p_is_external,
    coalesce((select max(step.sort_order) + 100 from ref.process_step step), 100)
  )
  on conflict (code) do update
    set process_code = excluded.process_code,
        label = excluded.label,
        phase = excluded.phase,
        lane = excluded.lane,
        sla_days = excluded.sla_days,
        is_external = excluded.is_external,
        deleted_at = null;

  return jsonb_build_object(
    'code', upper(trim(p_code)),
    'process_code', upper(trim(p_process_code))
  );
end $$;

grant execute on function public.cfc_save_process_step(text, text, text, text, text, int, boolean)
  to authenticated;
