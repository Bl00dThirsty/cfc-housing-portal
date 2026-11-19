begin;

select plan(7);

select ok(
  not exists (
    select 1
    from ref.role_capability rc
    left join ref.capability c on c.code = rc.capability and c.deleted_at is null
    where rc.deleted_at is null and c.code is null
  ),
  'every effective role grant has a visible capability catalogue entry'
);
select ok(
  private.has_capability('GESTIONNAIRE', 'kyc:read')
  and private.has_capability('GESTIONNAIRE', 'kyc:verify')
  and private.has_capability('GESTIONNAIRE', 'kyc:decide'),
  'the assigned loan manager role retains KYC review and decision grants'
);
select ok(
  not exists (
    select 1 from ref.role_capability
    where deleted_at is null and role_code <> 'GESTIONNAIRE'
      and capability in ('kyc:read', 'kyc:verify', 'kyc:decide')
  ),
  'no other role can read or decide full client KYC'
);
select ok(
  not private.has_capability('ADMIN', 'kyc:read')
  and not private.has_capability('ADMIN', 'kyc:verify')
  and not private.has_capability('ADMIN', 'kyc:decide'),
  'system administration does not include full client KYC access'
);
select ok(
  not private.has_capability('PMO', 'admin:users')
  and not private.has_capability('PMO', 'admin:roles')
  and not private.has_capability('PMO', 'admin:audit'),
  'workflow administration does not also administer staff identities or permissions'
);
select ok(
  not private.has_capability('AUDIT', 'admin:users')
  and not private.has_capability('AUDIT', 'admin:roles')
  and private.has_capability('AUDIT', 'admin:audit'),
  'audit staff retain read-only audit authority without account administration'
);
select ok(
  (select count(*) from ref.role where deleted_at is null and code in (
    'GUICHET', 'GESTIONNAIRE', 'RISQUES_BET', 'NOTAIRE', 'COMITE', 'DIASPORA',
    'PMO', 'ANALYSTE', 'RECOUVREMENT', 'ARCHIVISTE', 'AUDIT', 'ADMIN'
  )) = 12,
  'all active staff roles in the reference catalogue remain addressable by the app'
);

select * from finish();
rollback;
