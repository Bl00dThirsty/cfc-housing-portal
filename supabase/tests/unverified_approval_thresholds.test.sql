begin;

select plan(1);

select is(
  (
    select count(*)::integer
    from ref.approval_threshold
    where code in ('CGR_DELEGATION', 'CRC_ARBITRAGE', 'PCA_INSTITUTIONNEL')
      and deleted_at is null
      and effective_from <= current_date
      and (effective_to is null or effective_to >= current_date)
  ),
  0,
  'unverified approval bands are not effective'
);

select * from finish();
rollback;
