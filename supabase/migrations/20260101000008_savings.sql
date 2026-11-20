-- 008 — Épargne préalable : comptes et opérations.

create table if not exists public.savings_accounts (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid references public.dossiers (id) on delete cascade,
  citizen_id      uuid references public.actors (id) on delete set null,
  account_number  text not null,
  opening_date    date not null default current_date,
  closing_date    date,
  balance         numeric(15, 2) not null default 0,
  target_amount   numeric(15, 2),
  interest_rate   numeric(6, 3),
  currency        char(3) not null default 'XAF',
  status          text not null default 'active' check (status in ('active', 'objective_reached', 'suspended', 'closed')),
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references auth.users (id) on delete set null
);
create unique index if not exists savings_accounts_number_key
  on public.savings_accounts (account_number) where deleted_at is null;
create index if not exists savings_accounts_dossier_idx on public.savings_accounts (dossier_id);
create index if not exists savings_accounts_citizen_idx on public.savings_accounts (citizen_id);
create table if not exists public.savings_transactions (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.savings_accounts (id) on delete cascade,
  dossier_id     uuid references public.dossiers (id) on delete cascade,
  transaction_type text not null check (transaction_type in ('deposit', 'withdrawal', 'interest', 'fee', 'adjustment')),
  amount         numeric(15, 2) not null check (amount >= 0),
  debit          numeric(15, 2) check (debit is null or debit >= 0),
  credit         numeric(15, 2) check (credit is null or credit >= 0),
  balance_after  numeric(15, 2) not null,
  channel         text not null check (channel in (
                     'agency', 'mobile_money_mtn', 'mobile_money_orange', 'bank_transfer',
                     'systac', 'employer_debit', 'swift_transfer', 'cash'
                   )),
  reference       text,
  receipt_ref     text,
  validated_by    uuid references auth.users (id) on delete set null,
  validated_at    timestamptz,
  transaction_date date not null default current_date,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references auth.users (id) on delete set null
);
create index if not exists savings_transactions_account_idx
  on public.savings_transactions (account_id, transaction_date desc);
create index if not exists savings_transactions_dossier_idx on public.savings_transactions (dossier_id);
create index if not exists savings_transactions_validated_idx
  on public.savings_transactions (validated_by) where validated_at is null and deleted_at is null;
select private.attach_audit_trigger('public.savings_accounts');
select private.attach_audit_trigger('public.savings_transactions');
grant select, insert, update, delete on
  public.savings_accounts, public.savings_transactions to authenticated;
grant all on public.savings_accounts, public.savings_transactions to service_role;
revoke update (created_by, updated_by, deleted_by) on public.savings_accounts from authenticated;
revoke update (created_by, updated_by, deleted_by) on public.savings_transactions from authenticated;
