begin;

select plan(8);

select has_index(
  'ref',
  'service_document_requirement',
  'service_document_requirement_one_open_per_key_idx',
  'one open version per service, stage, and document type is enforced'
);

select is(
  (
    select count(*)::integer
    from (
      select service_code, stage, doc_type_code
      from ref.service_document_requirement
      where deleted_at is null and effective_to is null
      group by service_code, stage, doc_type_code
      having count(*) > 1
    ) duplicate_open_requirements
  ),
  0,
  'the reference seed has no overlapping open requirement versions'
);

select has_index(
  'ref',
  'product_rate',
  'product_rate_one_open_per_rate_idx',
  'one open rate version per product, rate code, and duration is enforced'
);
select has_index(
  'ref',
  'debt_capacity_policy',
  'debt_capacity_policy_one_open_idx',
  'one open debt-capacity policy version per code is enforced'
);
select has_index(
  'ref',
  'retention_policy',
  'retention_policy_one_open_idx',
  'one open retention policy version per code is enforced'
);
select is(
  (
    select count(*)::integer
    from (
      select product_code, rate_code, duration_years
      from ref.product_rate
      where deleted_at is null and valid_to is null
      group by product_code, rate_code, duration_years
      having count(*) > 1
    ) duplicate_open_rates
  ),
  0,
  'the reference seed has no overlapping open product-rate versions'
);
select is(
  (
    select count(*)::integer
    from (
      select code
      from ref.debt_capacity_policy
      where deleted_at is null and effective_to is null
      group by code
      having count(*) > 1
    ) duplicate_open_policies
  ),
  0,
  'the reference seed has no overlapping open debt-capacity versions'
);
select is(
  (
    select count(*)::integer
    from (
      select code
      from ref.retention_policy
      where deleted_at is null and effective_to is null
      group by code
      having count(*) > 1
    ) duplicate_open_policies
  ),
  0,
  'the reference seed has no overlapping open retention versions'
);

select * from finish();
rollback;
