-- Retry-safe savings postings and append-only correction entries.
-- A validated entry is never edited to correct it: the reverse RPC posts an
-- equal and opposite validated entry linked to its source.

alter table public.savings_transactions
  add column if not exists idempotency_key uuid,
  add column if not exists request_fingerprint text,
  add column if not exists reversal_of uuid references public.savings_transactions (id) on delete restrict;

alter table public.savings_transactions
  drop constraint if exists savings_transactions_not_own_reversal;
alter table public.savings_transactions
  add constraint savings_transactions_not_own_reversal
  check (reversal_of is null or reversal_of <> id);

create unique index if not exists savings_transactions_account_idempotency_key
  on public.savings_transactions (account_id, idempotency_key)
  where idempotency_key is not null and deleted_at is null;
create unique index if not exists savings_transactions_single_reversal
  on public.savings_transactions (reversal_of)
  where reversal_of is not null and deleted_at is null;
create index if not exists savings_transactions_reversal_lookup
  on public.savings_transactions (account_id, reversal_of)
  where reversal_of is not null and deleted_at is null;

-- This additive capability is deliberately limited to portfolio managers and
-- administrators. Frontend policy and database policy remain in sync.
insert into ref.role_capability (role_code, capability)
values ('GESTIONNAIRE', 'savings:reverse'), ('ADMIN', 'savings:reverse')
on conflict do nothing;

drop function if exists public.record_savings_transaction(uuid, text, numeric, text, text, text);

create function public.record_savings_transaction(
  p_account_id uuid,
  p_idempotency_key uuid,
  p_transaction_type text,
  p_amount numeric,
  p_channel text,
  p_reference text,
  p_description text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
  actor_role text := (select private.current_role());
  account_row public.savings_accounts%rowtype;
  dossier_row public.dossiers%rowtype;
  existing_row public.savings_transactions%rowtype;
  operation_id uuid;
  operation_reference text;
  normalized_reference text;
  fingerprint text;
begin
  if actor_id is null then
    raise exception 'savings_auth_required' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'savings_input_invalid' using errcode = '22023';
  end if;
  if p_transaction_type is null
     or p_transaction_type not in ('deposit', 'withdrawal')
     or p_amount is null
     or p_amount::text = 'NaN'
     or p_amount <= 0
     or p_amount <> round(p_amount, 2)
     or p_amount > 1000000000000
     or p_channel is null
     or p_channel not in (
       'agency', 'mobile_money_mtn', 'mobile_money_orange', 'bank_transfer',
       'systac', 'employer_debit', 'swift_transfer', 'cash'
     ) then
    raise exception 'savings_input_invalid' using errcode = '22023';
  end if;
  if length(coalesce(p_reference, '')) > 120 or length(coalesce(p_description, '')) > 240 then
    raise exception 'savings_input_too_long' using errcode = '22023';
  end if;
  if p_transaction_type = 'deposit'
     and not (select private.has_capability(actor_role, 'savings:credit')) then
    raise exception 'savings_credit_forbidden' using errcode = '42501';
  end if;
  if p_transaction_type = 'withdrawal'
     and not (select private.has_capability(actor_role, 'savings:debit')) then
    raise exception 'savings_debit_forbidden' using errcode = '42501';
  end if;

  select * into account_row
  from public.savings_accounts sa
  where sa.id = p_account_id and sa.deleted_at is null
  for update;
  if account_row.id is null then
    raise exception 'savings_account_not_found' using errcode = 'P0002';
  end if;
  if account_row.dossier_id is null or account_row.status not in ('active', 'objective_reached') then
    raise exception 'savings_account_unavailable' using errcode = '42501';
  end if;

  select * into dossier_row
  from public.dossiers d
  where d.id = account_row.dossier_id and d.deleted_at is null;
  if dossier_row.id is null or not (select private.can_act_on_dossier(
    (select private.current_pole()),
    dossier_row.owner_user_id,
    dossier_row.agency_id,
    dossier_row.is_diaspora,
    dossier_row.id
  )) then
    raise exception 'savings_account_forbidden' using errcode = '42501';
  end if;

  fingerprint := encode(extensions.digest(
    jsonb_build_object(
      'account_id', account_row.id,
      'type', p_transaction_type,
      'amount', p_amount,
      'channel', p_channel,
      'reference', nullif(btrim(p_reference), ''),
      'description', nullif(btrim(p_description), '')
    )::text,
    'sha256'
  ), 'hex');

  select * into existing_row
  from public.savings_transactions st
  where st.account_id = account_row.id
    and st.idempotency_key = p_idempotency_key
    and st.deleted_at is null
  for update;
  if existing_row.id is not null then
    if existing_row.created_by is distinct from actor_id
       or existing_row.reversal_of is not null
       or existing_row.request_fingerprint is distinct from fingerprint then
      raise exception 'savings_idempotency_conflict' using errcode = '23505';
    end if;
    return existing_row.id;
  end if;

  operation_reference := coalesce(
    nullif(btrim(p_reference), ''),
    'CFC-' || upper(substr(gen_random_uuid()::text, 1, 12))
  );
  normalized_reference := lower(btrim(operation_reference));

  insert into public.savings_transactions (
    account_id, dossier_id, transaction_type, amount, debit, credit,
    balance_after, channel, reference, description, transaction_date,
    decision_state, created_by, idempotency_key, request_fingerprint
  ) values (
    account_row.id, dossier_row.id, p_transaction_type, p_amount, null, null,
    account_row.balance, p_channel, operation_reference, nullif(btrim(p_description), ''), current_date,
    'pending', actor_id, p_idempotency_key, fingerprint
  )
  on conflict do nothing
  returning id into operation_id;

  if operation_id is null then
    select * into existing_row
    from public.savings_transactions st
    where st.account_id = account_row.id
      and lower(btrim(st.reference)) = normalized_reference
      and st.deleted_at is null
    for update;
    if existing_row.id is null
       or existing_row.transaction_type <> p_transaction_type
       or existing_row.amount <> p_amount
       or existing_row.channel <> p_channel
       or existing_row.description is distinct from nullif(btrim(p_description), '') then
      raise exception 'savings_reference_conflict' using errcode = '23505';
    end if;
    return existing_row.id;
  end if;

  perform public.append_dossier_event(
    dossier_row.id,
    'SAVINGS_TRANSACTION_RECORDED',
    jsonb_build_object(
      'transaction_id', operation_id,
      'transaction_type', p_transaction_type,
      'amount', p_amount,
      'reference', operation_reference
    ),
    'COBAC R-2023/01 — traçabilité des opérations'
  );
  return operation_id;
end
$function$;

create or replace function public.reverse_savings_transaction(
  p_transaction_id uuid,
  p_idempotency_key uuid,
  p_reason text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
  actor_role text := (select private.current_role());
  source_row public.savings_transactions%rowtype;
  existing_row public.savings_transactions%rowtype;
  account_row public.savings_accounts%rowtype;
  dossier_row public.dossiers%rowtype;
  reversal_id uuid;
  reversal_reference text;
  next_balance numeric(15, 2);
  fingerprint text;
begin
  if actor_id is null or not (select private.has_capability(actor_role, 'savings:reverse')) then
    raise exception 'savings_reversal_forbidden' using errcode = '42501';
  end if;
  if p_idempotency_key is null or length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'savings_input_invalid' using errcode = '22023';
  end if;
  if length(btrim(p_reason)) > 240 then
    raise exception 'savings_input_too_long' using errcode = '22023';
  end if;

  select * into source_row
  from public.savings_transactions st
  where st.id = p_transaction_id and st.deleted_at is null;
  if source_row.id is null then
    raise exception 'savings_transaction_not_reversible' using errcode = 'P0002';
  end if;

  select * into account_row
  from public.savings_accounts sa
  where sa.id = source_row.account_id and sa.deleted_at is null
  for update;
  if account_row.id is null or account_row.status = 'closed' then
    raise exception 'savings_transaction_not_reversible' using errcode = '55000';
  end if;

  select * into source_row
  from public.savings_transactions st
  where st.id = p_transaction_id
    and st.account_id = account_row.id
    and st.deleted_at is null
  for update;
  if source_row.id is null then
    raise exception 'savings_transaction_not_reversible' using errcode = 'P0002';
  end if;

  fingerprint := encode(extensions.digest(
    jsonb_build_object('transaction_id', source_row.id, 'reason', btrim(p_reason))::text,
    'sha256'
  ), 'hex');

  select * into existing_row
  from public.savings_transactions st
  where st.account_id = account_row.id
    and st.idempotency_key = p_idempotency_key
    and st.deleted_at is null
  for update;
  if existing_row.id is not null then
    if existing_row.reversal_of = source_row.id
       and existing_row.created_by = actor_id
       and existing_row.request_fingerprint = fingerprint then
      return existing_row.id;
    end if;
    raise exception 'savings_idempotency_conflict' using errcode = '23505';
  end if;

  if source_row.decision_state <> 'validated'
     or source_row.reversal_of is not null
     or source_row.transaction_type not in ('deposit', 'withdrawal') then
    raise exception 'savings_transaction_not_reversible' using errcode = '55000';
  end if;
  if source_row.created_by is not null and source_row.created_by = actor_id then
    raise exception 'savings_reversal_maker_forbidden' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.savings_transactions st
    where st.reversal_of = source_row.id and st.deleted_at is null
  ) then
    raise exception 'savings_transaction_already_reversed' using errcode = '55000';
  end if;

  select * into dossier_row
  from public.dossiers d
  where d.id = account_row.dossier_id and d.deleted_at is null;
  if dossier_row.id is null or not (select private.can_act_on_dossier(
    (select private.current_pole()),
    dossier_row.owner_user_id,
    dossier_row.agency_id,
    dossier_row.is_diaspora,
    dossier_row.id
  )) then
    raise exception 'savings_reversal_forbidden' using errcode = '42501';
  end if;

  if source_row.transaction_type = 'deposit' and account_row.balance < source_row.amount then
    raise exception 'savings_insufficient_balance' using errcode = '22023';
  end if;
  next_balance := case
    when source_row.transaction_type = 'deposit' then account_row.balance - source_row.amount
    else account_row.balance + source_row.amount
  end;
  reversal_reference := 'CFC-REV-' || upper(substr(gen_random_uuid()::text, 1, 12));

  insert into public.savings_transactions (
    account_id, dossier_id, transaction_type, amount, debit, credit,
    balance_after, channel, reference, description, transaction_date,
    decision_state, decision_note, decided_by, decided_at, validated_by,
    validated_at, created_by, idempotency_key, request_fingerprint, reversal_of
  ) values (
    account_row.id,
    dossier_row.id,
    case when source_row.transaction_type = 'deposit' then 'withdrawal' else 'deposit' end,
    source_row.amount,
    case when source_row.transaction_type = 'deposit' then source_row.amount else null end,
    case when source_row.transaction_type = 'withdrawal' then source_row.amount else null end,
    next_balance,
    source_row.channel,
    reversal_reference,
    'Contrepassation de ' || coalesce(source_row.reference, source_row.id::text),
    current_date,
    'validated',
    btrim(p_reason),
    actor_id,
    now(),
    actor_id,
    now(),
    actor_id,
    p_idempotency_key,
    fingerprint,
    source_row.id
  ) returning id into reversal_id;

  update public.savings_accounts
  set balance = next_balance,
      status = case
        when status = 'objective_reached' and target_amount is not null and next_balance < target_amount
          then 'active'
        when status = 'active' and target_amount is not null and next_balance >= target_amount
          then 'objective_reached'
        else status
      end,
      updated_at = now()
  where id = account_row.id;

  perform public.append_dossier_event(
    dossier_row.id,
    'SAVINGS_TRANSACTION_REVERSED',
    jsonb_build_object(
      'transaction_id', source_row.id,
      'reversal_id', reversal_id,
      'amount', source_row.amount,
      'balance_after', next_balance,
      'reference', source_row.reference,
      'reversal_reference', reversal_reference,
      'reason', btrim(p_reason)
    ),
    'COBAC R-2023/01 — traçabilité des opérations'
  );
  return reversal_id;
end
$function$;

revoke all on function public.record_savings_transaction(uuid, uuid, text, numeric, text, text, text) from public, anon;
grant execute on function public.record_savings_transaction(uuid, uuid, text, numeric, text, text, text) to authenticated, service_role;
revoke all on function public.reverse_savings_transaction(uuid, uuid, text) from public, anon;
grant execute on function public.reverse_savings_transaction(uuid, uuid, text) to authenticated, service_role;
