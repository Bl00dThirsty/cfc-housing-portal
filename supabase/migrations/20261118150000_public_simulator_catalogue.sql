-- The public onboarding and simulator read only the active reference catalogue.
-- Business rows stay in ref; these scoped RLS policies and the public view keep
-- the authenticated and anonymous app paths on the same source of truth.

drop policy if exists ref_anonymous_catalogue_read on ref.service;
create policy ref_anonymous_catalogue_read on ref.service for select to anon
  using (is_active and deleted_at is null);
drop policy if exists ref_anonymous_catalogue_read on ref.product;
create policy ref_anonymous_catalogue_read on ref.product for select to anon
  using (is_active and deleted_at is null);
drop policy if exists ref_anonymous_catalogue_read on ref.product_rate;
create policy ref_anonymous_catalogue_read on ref.product_rate for select to anon
  using (
    deleted_at is null
    and valid_from <= current_date
    and (valid_to is null or valid_to >= current_date)
  );
drop policy if exists ref_anonymous_catalogue_read on ref.document_type;
create policy ref_anonymous_catalogue_read on ref.document_type for select to anon
  using (
    deleted_at is null
    and valid_from <= current_date
    and (valid_to is null or valid_to >= current_date)
  );
drop policy if exists ref_anonymous_catalogue_read on ref.document_nature;
create policy ref_anonymous_catalogue_read on ref.document_nature for select to anon
  using (deleted_at is null);
drop policy if exists ref_anonymous_catalogue_read on ref.service_document_requirement;
create policy ref_anonymous_catalogue_read on ref.service_document_requirement for select to anon
  using (
    deleted_at is null
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  );
drop policy if exists ref_anonymous_catalogue_read on ref.debt_capacity_policy;
create policy ref_anonymous_catalogue_read on ref.debt_capacity_policy for select to anon
  using (
    deleted_at is null
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  );

grant select on
  ref.service,
  ref.product,
  ref.product_rate,
  ref.document_type,
  ref.document_nature,
  ref.service_document_requirement,
  ref.debt_capacity_policy
to anon;

create or replace view public.cfc_debt_capacity_policy
with (security_invoker = true) as
  select code, label, description, max_debt_ratio, applies_to,
         effective_from, effective_to, deleted_at
  from ref.debt_capacity_policy;

grant select on public.cfc_debt_capacity_policy to anon, authenticated;
grant all on public.cfc_debt_capacity_policy to service_role;
