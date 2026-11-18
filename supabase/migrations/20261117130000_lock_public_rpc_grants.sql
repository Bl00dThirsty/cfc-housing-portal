-- ===========================================================================
-- Verrouillage des privilèges d'exécution des fonctions publiques
--
-- Constat (Supabase Advisor, 2026-11-17) : toutes les fonctions `public.cfc_*`
-- étaient exécutables par le rôle `anon`. La plupart vérifient elles-mêmes la
-- capacité de l'appelant — un visiteur anonyme n'a donc pas de rôle et reçoit
-- un refus — mais deux défauts restaient :
--
--   1. `cfc_dashboard_stats()` n'avait **aucun** contrôle : elle exposait au
--      public le portefeuille, l'épargne et la répartition des dossiers.
--   2. Le privilège accordé à `anon` sur les fonctions d'administration
--      (`cfc_create_staff_user`, `cfc_set_user_role`, ...) faisait reposer la
--      sécurité sur le seul contrôle interne. Un oubli dans une future
--      fonction ouvrirait immédiatement la surface.
--
-- Cette migration applique le principe du moindre privilège : `anon` ne garde
-- que les fonctions réellement appelées avant l'ouverture de session. Tout le
-- reste est réservé à `authenticated` (et à `service_role`, qui contourne les
-- privilèges).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Fonctions d'administration : plus d'accès anonyme.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  locked text[] := array[
    'cfc_advance_dossier',
    'cfc_audit_feed',
    'cfc_cancel_email',
    'cfc_create_dossier',
    'cfc_create_staff_user',
    'cfc_dashboard_stats',
    'cfc_delete_process_step',
    'cfc_delete_role',
    'cfc_list_users',
    'cfc_mark_email_sent',
    'cfc_mark_notifications_read',
    'cfc_my_context',
    'cfc_notify',
    'cfc_post_message',
    'cfc_queue_email',
    'cfc_requeue_email',
    'cfc_save_process',
    'cfc_save_process_step',
    'cfc_save_role',
    'cfc_set_role_capabilities',
    'cfc_set_user_active',
    'cfc_set_user_role',
    'cfc_update_staff_user',
    'decide_dossier_document',
    'decide_duc_eligibility',
    'kpi_committee_approval_rate',
    'kpi_savings_collected',
    'publish_email_template',
    'request_dossier_document'
  ];
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (locked)
  loop
    execute format('revoke execute on function %s from anon, public', r.signature);
    execute format('grant execute on function %s to authenticated, service_role', r.signature);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Fonction de déclencheur : elle n'a jamais à être appelée par un client.
--    Un trigger s'exécute avec les droits de son propriétaire, pas de grants.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  loop
    execute format(
      'revoke execute on function %s from anon, authenticated, public',
      r.signature
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. `cfc_dashboard_stats()` : contrôle de capacité explicite.
--
--    Le verrou de privilège ne suffirait pas : n'importe quel emprunteur
--    authentifié pourrait lire les agrégats du portefeuille. La lecture exige
--    désormais `analytics:read`, comme le reste de la supervision.
-- ---------------------------------------------------------------------------

create or replace function public.cfc_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_stats jsonb;
begin
  if not (select private.has_capability(
      (select private."current_role"()), 'analytics:read')) then
    raise exception 'analytics_forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', count(*),
    'open', count(*) filter (where status = 'open'),
    'on_hold', count(*) filter (where status = 'on_hold'),
    'closed', count(*) filter (where status = 'closed'),
    'overdue', count(*) filter (where sla_deadline < now() and status <> 'closed'),
    'diaspora', count(*) filter (where is_diaspora),
    'portfolio', coalesce(sum(loan_amount), 0),
    'savings', coalesce(sum(savings_current), 0),
    'avg_progress', coalesce(round(avg(progress)), 0),
    'by_phase', coalesce((select jsonb_object_agg(current_phase, n) from (
        select current_phase, count(*)::int n from public.dossiers
        where deleted_at is null group by current_phase) x), '{}'::jsonb),
    'by_risk', coalesce((select jsonb_object_agg(risk_level, n) from (
        select risk_level, count(*)::int n from public.dossiers
        where deleted_at is null group by risk_level) y), '{}'::jsonb)
  )
  into v_stats
  from public.dossiers
  where deleted_at is null;

  return v_stats;
end
$function$;

revoke execute on function public.cfc_dashboard_stats() from anon, public;
grant execute on function public.cfc_dashboard_stats() to authenticated, service_role;
