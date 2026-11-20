begin;

select plan(4);

select has_table(
  'ref',
  'document_stage_phase',
  'document stages map to configurable process phases'
);
select has_table(
  'ref',
  'document_stage_role_policy',
  'document-stage actions are controlled by persisted role policy'
);
select ok(
  to_regprocedure('private.can_act_on_document(uuid,text,text,text)') is not null,
  'the database exposes one stage-aware authorization predicate for document actions'
);
select is(
  private.can_read_chemise('ADMIN', 'C1'),
  false,
  'system administrators cannot read identity evidence from the KYC chemise'
);

select * from finish();
rollback;
