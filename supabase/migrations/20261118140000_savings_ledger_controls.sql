-- Post savings operations through audited, atomic RPCs. The account balance is
-- the sum of validated entries only; a pending entry is not available money.

alter table public.savings_transactions
  add column if not exists description text,
  add column if not exists decision_state text not null default 'pending',
  add column if not exists decision_note text,
  add column if not exists decided_by uuid references auth.users (id) on delete set null,
  add column if not exists decided_at timestamptz;

alter table public.savings_transactions
  drop constraint if exists savings_transactions_decision_state_check;
alter table public.savings_transactions
  add constraint savings_transactions_decision_state_check
  check (decision_state in ('pending', 'validated', 'rejected'));

update public.savings_transactions
set decision_state = case when validated_at is null then 'pending' else 'validated' end,
    decided_by = case when validated_at is null then null else validated_by end,
    decided_at = validated_at
where decision_state = 'pending' and validated_at is not null;

create index if not exists savings_transactions_pending_idx
  on public.savings_transactions (account_id, created_at)
  where decision_state = 'pending' and deleted_at is null;
create unique index if not exists savings_transactions_account_reference_key
  on public.savings_transactions (account_id, lower(btrim(reference)))
  where reference is not null and deleted_at is null;

drop policy if exists savings_transactions_read on public.savings_transactions;
create policy savings_transactions_read on public.savings_transactions for select to authenticated
  using (
    exists (
      select 1
      from public.savings_accounts sa
      left join public.dossiers d on d.id = sa.dossier_id
      where sa.id = account_id
        and (
          sa.citizen_id = (select auth.uid())
          or (
            d.id is not null
            and (select private.has_capability((select private.current_role()), 'savings:read'))
            and (select private.can_act_on_dossier(
              (select private.current_pole()),
              d.owner_user_id,
              d.agency_id,
              d.is_diaspora,
              d.id
            ))
          )
        )
    )
  );

drop policy if exists savings_transactions_insert on public.savings_transactions;
drop policy if exists savings_transactions_update on public.savings_transactions;
revoke insert, update, delete on public.savings_transactions from authenticated;

create or replace function public.record_savings_transaction(
  p_account_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_channel text,
  p_reference text default null,
  p_description text default null
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
  operation_id uuid;
  operation_reference text;
  normalized_reference text;
begin
  if actor_id is null then
    raise exception 'savings_auth_required' using errcode = '42501';
  end if;

  if p_transaction_type is null
     or p_transaction_type not in ('deposit', 'withdrawal')
     or p_amount is null
     or p_amount::text = 'NaN'
     or p_amount <= 0
     or p_amount > 1000000000000
     or p_channel is null
     or p_channel not in (
       'agency', 'mobile_money_mtn', 'mobile_money_orange', 'bank_transfer',
       'systac', 'employer_debit', 'swift_transfer', 'cash'
     ) then
    raise exception 'savings_input_invalid' using errcode = '22023';
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

  operation_reference := coalesce(
    nullif(btrim(p_reference), ''),
    'CFC-' || upper(substr(gen_random_uuid()::text, 1, 12))
  );
  if length(operation_reference) > 120 or length(coalesce(p_description, '')) > 240 then
    raise exception 'savings_input_too_long' using errcode = '22023';
  end if;
  normalized_reference := lower(btrim(operation_reference));

  insert into public.savings_transactions (
    account_id, dossier_id, transaction_type, amount, debit, credit,
    balance_after, channel, reference, description, transaction_date,
    decision_state, created_by
  ) values (
    account_row.id, dossier_row.id, p_transaction_type, p_amount, null, null,
    account_row.balance, p_channel, operation_reference, nullif(btrim(p_description), ''), current_date,
    'pending', actor_id
  )
  on conflict do nothing
  returning id into operation_id;

  if operation_id is null then
    select st.id into operation_id
    from public.savings_transactions st
    where st.account_id = account_row.id
      and lower(btrim(st.reference)) = normalized_reference
      and st.deleted_at is null;
    if operation_id is null then
      raise exception 'savings_reference_conflict' using errcode = '23505';
    end if;

    if not exists (
      select 1 from public.savings_transactions st
      where st.id = operation_id
        and st.transaction_type = p_transaction_type
        and st.amount = p_amount
        and st.channel = p_channel
        and st.description is not distinct from nullif(btrim(p_description), '')
    ) then
      raise exception 'savings_reference_conflict' using errcode = '23505';
    end if;
    return operation_id;
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

create or replace function public.decide_savings_transaction(
  p_transaction_id uuid,
  p_decision text,
  p_reason text default null
) returns numeric
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
  actor_role text := (select private.current_role());
  account_id uuid;
  account_row public.savings_accounts%rowtype;
  dossier_row public.dossiers%rowtype;
  transaction_row public.savings_transactions%rowtype;
  next_balance numeric(15, 2);
begin
  if actor_id is null or not (select private.has_capability(actor_role, 'savings:validate')) then
    raise exception 'savings_validation_forbidden' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('validate', 'reject') then
    raise exception 'savings_decision_invalid' using errcode = '22023';
  end if;
  if p_decision = 'reject' and length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'savings_rejection_reason_required' using errcode = '22023';
  end if;

  select st.account_id into account_id
  from public.savings_transactions st
  where st.id = p_transaction_id and st.deleted_at is null;
  if account_id is null then
    raise exception 'savings_transaction_not_found' using errcode = 'P0002';
  end if;

  select * into account_row
  from public.savings_accounts sa
  where sa.id = account_id and sa.deleted_at is null
  for update;
  if account_row.id is null then
    raise exception 'savings_account_not_found' using errcode = 'P0002';
  end if;

  select * into transaction_row
  from public.savings_transactions st
  where st.id = p_transaction_id and st.account_id = account_row.id and st.deleted_at is null
  for update;
  if transaction_row.id is null or transaction_row.decision_state <> 'pending' then
    raise exception 'savings_transaction_not_pending' using errcode = '55000';
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

  if p_decision = 'reject' then
    update public.savings_transactions
    set decision_state = 'rejected',
        decision_note = nullif(btrim(p_reason), ''),
        decided_by = actor_id,
        decided_at = now(),
        updated_at = now()
    where id = transaction_row.id;
    perform public.append_dossier_event(
      dossier_row.id,
      'SAVINGS_TRANSACTION_REJECTED',
      jsonb_build_object('transaction_id', transaction_row.id, 'reason', btrim(p_reason)),
      'COBAC R-2023/01 — traçabilité des opérations'
    );
    return account_row.balance;
  end if;

  if transaction_row.transaction_type = 'withdrawal'
     and account_row.balance < transaction_row.amount then
    raise exception 'savings_insufficient_balance' using errcode = '22023';
  end if;

  next_balance := case
    when transaction_row.transaction_type = 'deposit' then account_row.balance + transaction_row.amount
    when transaction_row.transaction_type = 'withdrawal' then account_row.balance - transaction_row.amount
    else null
  end;
  if next_balance is null then
    raise exception 'savings_transaction_type_invalid' using errcode = '22023';
  end if;

  update public.savings_transactions
  set debit = case when transaction_row.transaction_type = 'withdrawal' then transaction_row.amount else null end,
      credit = case when transaction_row.transaction_type = 'deposit' then transaction_row.amount else null end,
      balance_after = next_balance,
      decision_state = 'validated',
      validated_by = actor_id,
      validated_at = now(),
      decided_by = actor_id,
      decided_at = now(),
      decision_note = nullif(btrim(p_reason), ''),
      updated_at = now()
  where id = transaction_row.id;

  update public.savings_accounts
  set balance = next_balance,
      status = case
        when target_amount is not null and next_balance >= target_amount and status = 'active'
          then 'objective_reached'
        else status
      end,
      updated_at = now()
  where id = account_row.id;

  perform public.append_dossier_event(
    dossier_row.id,
    'SAVINGS_TRANSACTION_VALIDATED',
    jsonb_build_object(
      'transaction_id', transaction_row.id,
      'transaction_type', transaction_row.transaction_type,
      'amount', transaction_row.amount,
      'balance_after', next_balance,
      'reference', transaction_row.reference
    ),
    'COBAC R-2023/01 — traçabilité des opérations'
  );
  return next_balance;
end
$function$;

revoke all on function public.record_savings_transaction(uuid, text, numeric, text, text, text) from public, anon;
grant execute on function public.record_savings_transaction(uuid, text, numeric, text, text, text) to authenticated, service_role;
revoke all on function public.decide_savings_transaction(uuid, text, text) from public, anon;
grant execute on function public.decide_savings_transaction(uuid, text, text) to authenticated, service_role;
