
create or replace view public.cfc_pole_scope
with (security_invoker = true) as
  select r.pole_code as pole_code, min(r.scope) as scope, count(*)::int as role_count
  from ref.role r where r.deleted_at is null and r.pole_code is not null
  group by r.pole_code;

create or replace view public.cfc_roles
with (security_invoker = true) as
  select r.code, r.label, r.description, r.pole_code, r.scope, r.landing_path,
         r.sort_order, r.created_at, r.updated_at, r.deleted_at
  from ref.role r;

create or replace view public.cfc_capabilities
with (security_invoker = true) as
  select c.code, c.label, c.group_label, c.description, c.sort_order, c.deleted_at
  from ref.capability c;

create or replace view public.cfc_role_capabilities
with (security_invoker = true) as
  select rc.role_code, rc.capability
  from ref.role_capability rc
  where rc.deleted_at is null;

create or replace view public.cfc_processes
with (security_invoker = true) as
  select p.code, p.label, p.family, p.chain_order, p.pilote, p.priority, p.deleted_at
  from ref.process p;

create or replace view public.cfc_process_steps
with (security_invoker = true) as
  select s.code, s.process_code, s.label, s.phase, s.lane, s.is_external, s.sla_days, s.deleted_at
  from ref.process_step s;

create or replace view public.cfc_email_templates
with (security_invoker = true) as
  select t.code, t.version, t.label, t.subject_template, t.html_template, t.text_template,
         t.event_type, t.audience, t.is_active, t.variables, t.effective_from, t.effective_to
  from ref.email_template t;

grant select on public.cfc_roles, public.cfc_capabilities, public.cfc_role_capabilities,
  public.cfc_processes, public.cfc_process_steps, public.cfc_email_templates, public.cfc_pole_scope
  to authenticated;
;
