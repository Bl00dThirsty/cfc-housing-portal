-- Compact operational analytics for the admin dashboard.
-- SECURITY INVOKER keeps every aggregate inside the caller's existing RLS scope.
create or replace function public.get_cfc_analytics_rollup()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select jsonb_build_object(
    'dossiers', jsonb_build_object(
      'total', (
        select count(*) from public.dossiers d where d.deleted_at is null
      ),
      'diaspora', (
        select count(*) from public.dossiers d
        where d.deleted_at is null and d.is_diaspora
      ),
      'by_phase', coalesce((
        select jsonb_object_agg(phase_key, phase_count)
        from (
          select coalesce(d.current_phase, 'unphased') as phase_key, count(*) as phase_count
          from public.dossiers d
          where d.deleted_at is null
          group by coalesce(d.current_phase, 'unphased')
        ) phase_counts
      ), '{}'::jsonb)
    ),
    'savings', jsonb_build_object(
      'active_accounts', (
        select count(*) from public.savings_accounts a
        where a.deleted_at is null and a.status = 'active'
      ),
      'active_balance', coalesce((
        select sum(a.balance) from public.savings_accounts a
        where a.deleted_at is null and a.status = 'active'
      ), 0),
      'pending_operations', (
        select count(*) from public.savings_transactions t
        where t.deleted_at is null and t.decision_state = 'pending'
      ),
      'operations_by_channel', coalesce((
        select jsonb_object_agg(channel, operation_count)
        from (
          select t.channel, count(*) as operation_count
          from public.savings_transactions t
          where t.deleted_at is null
          group by t.channel
        ) channel_counts
      ), '{}'::jsonb)
    ),
    'credit', jsonb_build_object(
      'committee_sessions', (
        select count(*) from public.committee_deliberations c where c.deleted_at is null
      ),
      'sessions_by_status', coalesce((
        select jsonb_object_agg(status, session_count)
        from (
          select c.status, count(*) as session_count
          from public.committee_deliberations c
          where c.deleted_at is null
          group by c.status
        ) session_counts
      ), '{}'::jsonb),
      'loan_offers', (
        select count(*) from public.loan_offers o where o.deleted_at is null
      ),
      'offers_by_status', coalesce((
        select jsonb_object_agg(status, offer_count)
        from (
          select o.status, count(*) as offer_count
          from public.loan_offers o
          where o.deleted_at is null
          group by o.status
        ) offer_counts
      ), '{}'::jsonb)
    ),
    'notary', jsonb_build_object(
      'instruments', (
        select count(*) from public.notary_instruments n where n.deleted_at is null
      ),
      'open_oppositions', (
        select count(*) from public.oppositions o
        where o.deleted_at is null and o.status in ('open', 'maintained')
      ),
      'active_insurances', (
        select count(*) from public.insurances i
        where i.deleted_at is null and i.status = 'active'
      )
    ),
    'disbursements', jsonb_build_object(
      'tranches', (
        select count(*) from public.disbursements d where d.deleted_at is null
      ),
      'amount_total', coalesce((
        select sum(d.amount) from public.disbursements d
        where d.deleted_at is null and d.status <> 'cancelled'
      ), 0),
      'schedules_due', (
        select count(*) from public.disbursement_schedules s
        where s.deleted_at is null and s.status = 'due'
      ),
      'schedules_late', (
        select count(*) from public.disbursement_schedules s
        where s.deleted_at is null and s.status = 'late'
      ),
      'reconciliation_mismatches', coalesce((
        select sum(r.records_mismatch) from public.reconciliation_runs r
        where r.deleted_at is null and r.status = 'completed'
      ), 0)
    )
  );
$function$;

revoke all on function public.get_cfc_analytics_rollup() from public, anon;
grant execute on function public.get_cfc_analytics_rollup() to authenticated;
