-- These three rows were added as placeholder delegation bands. They conflict
-- with the supplied meeting notes and public CFC information, and no signed,
-- effective CFC delegation has been recorded as their source. Retire only
-- these exact seed codes. Do not substitute inferred public thresholds.
update ref.approval_threshold
   set deleted_at = now(),
       updated_at = now()
 where code in ('CGR_DELEGATION', 'CRC_ARBITRAGE', 'PCA_INSTITUTIONNEL')
   and deleted_at is null;
