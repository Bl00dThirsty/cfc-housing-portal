-- 032 — La mesure des indicateurs, dans le périmètre de l'agent.
--
-- Un indicateur se **mesure** : il ne s'écrit pas à la main. Les sommes
-- ci-dessous s'exécutent avec les droits de l'agent (`security invoker`), la
-- RLS filtre donc les lignes, et un indicateur ne montre jamais à un agent
-- plus que son périmètre.
--
-- Les comptements, eux, se font par la couche serveur avec le client
-- authentifié : la RLS y joue le même rôle. Seules les **sommes** exigent
-- l'agrégation en base — ramener des milliers de lignes pour les additionner
-- dans l'application serait un défaut, pas une économie.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- L'épargne mobilisée
-- ---------------------------------------------------------------------------

create or replace function public.kpi_savings_collected()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $function$
  select coalesce(sum(sa.balance), 0)
  from public.savings_accounts sa
  where sa.deleted_at is null;
$function$;

comment on function public.kpi_savings_collected() is
  'Epargne mobilisée : somme des soldes des carnets, dans le perimetre de l''agent qui interroge.';

revoke all on function public.kpi_savings_collected() from public;
grant execute on function public.kpi_savings_collected() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Le taux d'accord des comités
-- ---------------------------------------------------------------------------

create or replace function public.kpi_committee_approval_rate()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $function$
  select case
    when count(*) filter (where dl.vote <> 'abstain') = 0 then 0
    else round(
      (count(*) filter (where dl.vote = 'approve')::numeric
       / count(*) filter (where dl.vote <> 'abstain')) * 100,
      1
    )
  end
  from public.deliberation_lines dl
  where dl.deleted_at is null;
$function$;

comment on function public.kpi_committee_approval_rate() is
  'Taux d''accord des comites : votes favorables rapportes aux votes exprimes. Une abstention n''est pas un vote contre.';

revoke all on function public.kpi_committee_approval_rate() from public;
grant execute on function public.kpi_committee_approval_rate() to authenticated, service_role;
