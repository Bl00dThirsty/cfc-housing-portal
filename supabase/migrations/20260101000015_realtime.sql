-- 015 — Temps réel.
--
-- `postgres_changes` sur `public.dossiers` et `public.dossier_events` est la
-- colonne vertébrale du back-office : apparition d'un dossier, changement de
-- phase, événement d'audit.
--
-- Deux réserves connues de la plateforme :
-- - le canal DELETE est peu fiable sur les tables filtrées : la source de
--   vérité reste la suppression logique (`deleted_at`) et le journal
--   `dossier_events` ;
-- - RLS s'applique aux abonnés : un agent ne reçoit que les changements de
--   ses dossiers.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dossiers'
  ) then
    alter publication supabase_realtime add table public.dossiers;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dossier_events'
  ) then
    alter publication supabase_realtime add table public.dossier_events;
  end if;
end $$;
