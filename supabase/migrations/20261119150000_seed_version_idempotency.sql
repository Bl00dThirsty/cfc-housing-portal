begin;

-- Earlier versions of seed.sql used current_date for every catalogue row.
-- Re-running on another day created an additional open version. Preserve the
-- complete history while closing each version at the day before its successor.
with ordered as (
  select
    id,
    effective_from,
    lead(effective_from) over (
      partition by service_code, stage, doc_type_code
      order by effective_from, created_at, id
    ) as next_from
  from ref.service_document_requirement
  where deleted_at is null
)
update ref.service_document_requirement as requirement
set effective_to = ordered.next_from - 1,
    updated_at = now()
from ordered
where requirement.id = ordered.id
  and ordered.next_from is not null
  and (requirement.effective_to is null or requirement.effective_to >= ordered.next_from);

with ordered as (
  select
    id,
    valid_from,
    lead(valid_from) over (
      partition by product_code, rate_code, duration_years
      order by valid_from, created_at, id
    ) as next_from
  from ref.product_rate
  where deleted_at is null
)
update ref.product_rate as rate
set valid_to = ordered.next_from - 1,
    updated_at = now()
from ordered
where rate.id = ordered.id
  and ordered.next_from is not null
  and (rate.valid_to is null or rate.valid_to >= ordered.next_from);

with ordered as (
  select
    id,
    effective_from,
    lead(effective_from) over (
      partition by code
      order by effective_from, created_at, id
    ) as next_from
  from ref.debt_capacity_policy
  where deleted_at is null
)
update ref.debt_capacity_policy as policy
set effective_to = ordered.next_from - 1,
    updated_at = now()
from ordered
where policy.id = ordered.id
  and ordered.next_from is not null
  and (policy.effective_to is null or policy.effective_to >= ordered.next_from);

with ordered as (
  select
    id,
    effective_from,
    lead(effective_from) over (
      partition by code
      order by effective_from, created_at, id
    ) as next_from
  from ref.retention_policy
  where deleted_at is null
)
update ref.retention_policy as policy
set effective_to = ordered.next_from - 1,
    updated_at = now()
from ordered
where policy.id = ordered.id
  and ordered.next_from is not null
  and (policy.effective_to is null or policy.effective_to >= ordered.next_from);

create unique index if not exists service_document_requirement_one_open_per_key_idx
  on ref.service_document_requirement (service_code, stage, doc_type_code)
  where deleted_at is null and effective_to is null;

create unique index if not exists product_rate_one_open_per_rate_idx
  on ref.product_rate (product_code, rate_code, coalesce(duration_years, -1))
  where deleted_at is null and valid_to is null;

create unique index if not exists debt_capacity_policy_one_open_idx
  on ref.debt_capacity_policy (code)
  where deleted_at is null and effective_to is null;

create unique index if not exists retention_policy_one_open_idx
  on ref.retention_policy (code)
  where deleted_at is null and effective_to is null;

commit;
