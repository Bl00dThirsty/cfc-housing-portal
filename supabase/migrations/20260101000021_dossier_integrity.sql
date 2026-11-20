--- 021 — Intégrité du dossier : avancement et vocabulaire.
---
--- Deux colonnes du dossier sont **dérivées** de l'état réel des pièces :
--- `completion_percent` (part du référentiel déclarable satisfaite) et
--- `savings_percent` (part de l'apport constitué). Aucune action applicative
--- ne les maintenait : elles restaient à leur valeur par défaut et
--- contredisaient les graphiques affichés sur le même écran.
---
--- Elles sont désormais **tenues par la base**, au lieu d'être recalculées
--- par chaque écran : un indicateur ne peut pas diverger de ce qu'il mesure.

set search_path = public, extensions;
-- ---------------------------------------------------------------------------
-- Vocabulaire de l'état du dossier
-- ---------------------------------------------------------------------------

-- L'état du dossier est un vocabulaire fermé : une valeur hors liste ne peut
-- plus s'y glisser. La contrainte est d'abord posée **sans validation** —
-- les lignes existantes ne sont pas bloquantes — puis validée : si une
-- donnée historique sortait du vocabulaire, la migration s'arrêterait ici
-- plutôt que de laisser passer un état indéfini.
alter table public.dossiers
  drop constraint if exists dossiers_status_check;
alter table public.dossiers
  add constraint dossiers_status_check
  check (status in ('open', 'on_hold', 'closed')) not valid;
alter table public.dossiers
  validate constraint dossiers_status_check;
comment on column public.dossiers.status is
  'État du dossier : open (en cours), on_hold (en attente), closed (clos).';
-- ---------------------------------------------------------------------------
-- Garde-fou de champs : les valeurs dérivées restent écrites par la base
-- ---------------------------------------------------------------------------

-- Le garde-fou protège l'emprunteur : il ne peut pas modifier l'avancement,
-- le taux ou l'état de son dossier. Il doit toutefois laisser passer les
-- **mises à jour système** : une valeur dérivée n'est pas une écriture du
-- citoyen, c'est le résultat de l'état réel des pièces.
--
-- La transaction est marquée par le drapeau `app.system_update`, posé
-- localement par la fonction qui tient les valeurs dérivées.
CREATE OR REPLACE FUNCTION private.guard_citizen_dossier_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Une mise à jour **système** (valeur dérivée tenue par la plateforme)
  -- n'est pas une écriture du citoyen : elle ne doit pas être refusée.
  if coalesce(current_setting('app.system_update', true), '0') = '1' then
    return new;
  end if;

  if (select private.current_role()) is null
     and (select auth.uid()) = old.citizen_id
     and (
       new.loan_amount is distinct from old.loan_amount
       or new.rate is distinct from old.rate
       or new.duration is distinct from old.duration
       or new.duration_years is distinct from old.duration_years
       or new.monthly_payment is distinct from old.monthly_payment
       or new.monthly_income is distinct from old.monthly_income
       or new.project_cost is distinct from old.project_cost
       or new.savings_target is distinct from old.savings_target
       or new.savings_current is distinct from old.savings_current
       or new.savings_percent is distinct from old.savings_percent
       or new.current_balance is distinct from old.current_balance
       or new.debt_ratio is distinct from old.debt_ratio
       or new.status is distinct from old.status
       or new.current_phase is distinct from old.current_phase
       or new.current_step is distinct from old.current_step
       or new.risk_level is distinct from old.risk_level
       or new.rating is distinct from old.rating
       or new.progress is distinct from old.progress
       or new.completion_percent is distinct from old.completion_percent
       or new.owner_user_id is distinct from old.owner_user_id
       or new.agency_id is distinct from old.agency_id
     ) then
    raise exception 'dossier_field_forbidden' using errcode = '42501';
  end if;

  return new;
end $function$;
drop trigger if exists trg_guard_citizen_dossier_update on public.dossiers;
create trigger trg_guard_citizen_dossier_update
  before update on public.dossiers
  for each row execute function private.guard_citizen_dossier_update();
-- ---------------------------------------------------------------------------
-- Tenue des valeurs dérivées
-- ---------------------------------------------------------------------------


/**
 * Recalcule l'avancement et la part d'épargne d'un dossier.
 *
 * L'avancement est la part du **référentiel déclarable obligatoire** déjà
 * satisfaite : ce sont les pièces que le dossier exige, pas celles qu'il
 * propose. Une pièce vaut dès qu'elle est déposée — le contrôle de conformité
 * par l'agent ne change pas l'avancement de l'emprunteur.
 *
 * La fonction est `security definer` : elle écrit sur une table à RLS forcé,
 * ce qu'aucune action applicative ne peut faire.
 */
create or replace function private.refresh_dossier_progress(p_dossier_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_service_code text;
  v_required int;
  v_satisfied int;
  v_percent smallint;
  v_savings_target numeric;
  v_savings_current numeric;
  v_savings_percent numeric;
begin
  select d.service_code, d.savings_target, d.savings_current
    into v_service_code, v_savings_target, v_savings_current
    from public.dossiers d
   where d.id = p_dossier_id;

  if v_service_code is null then
    return;
  end if;

  select count(*)::int
    into v_required
    from ref.service_document_requirement r
   where r.service_code = v_service_code
     and r.deleted_at is null
     and r.effective_to is null
     and r.required
     and r.stage in ('ONBOARDING', 'SAVINGS', 'CREDIT_FILE');

  select count(*)::int
    into v_satisfied
    from ref.service_document_requirement r
   where r.service_code = v_service_code
     and r.deleted_at is null
     and r.effective_to is null
     and r.required
     and r.stage in ('ONBOARDING', 'SAVINGS', 'CREDIT_FILE')
     and (
       select count(*)::int
         from public.dossier_documents d
        where d.dossier_id = p_dossier_id
          and d.doc_type_code = r.doc_type_code
          and d.deleted_at is null
          and d.status in ('uploaded', 'in_review', 'verified')
     ) >= greatest(r.min_count, 1);

  if v_required = 0 then
    v_percent := 0;
  else
    v_percent := round((v_satisfied::numeric / v_required) * 100)::smallint;
  end if;

  if v_savings_target is null or v_savings_target <= 0 then
    v_savings_percent := null;
  else
    v_savings_percent := least(100, round((coalesce(v_savings_current, 0) / v_savings_target) * 100));
  end if;

  -- L'écriture est **système** : elle n'est pas soumise au garde-fou des
  -- champs de l'emprunteur. Le drapeau est local à la transaction.
  perform set_config('app.system_update', '1', true);

  update public.dossiers
     set completion_percent = v_percent,
         savings_percent = v_savings_percent
   where id = p_dossier_id
     and (completion_percent is distinct from v_percent
       or savings_percent is distinct from v_savings_percent);

  perform set_config('app.system_update', '0', true);
end;
$$;
revoke all on function private.refresh_dossier_progress(uuid) from public, anon, authenticated;
grant execute on function private.refresh_dossier_progress(uuid) to service_role;
-- Chaque dépôt, validation ou retrait de pièce met l'avancement à jour.
create or replace function private.dossier_documents_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_dossier_progress(coalesce(new.dossier_id, old.dossier_id));
  return null;
end;
$$;
drop trigger if exists trg_dossier_documents_progress on public.dossier_documents;
create trigger trg_dossier_documents_progress
  after insert or update or delete on public.dossier_documents
  for each row execute function private.dossier_documents_progress_trigger();
-- Un versement d'épargne met la part constituée à jour — et l'ouverture du
-- dossier aussi, puisque ses entrées sont écrites à la création.
--
-- Le déclencheur est volontairement large : la fonction ne met à jour que si
-- les valeurs changent, et son écriture ne relance donc pas indéfiniment.
create or replace function private.dossier_savings_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_dossier_progress(new.id);
  return null;
end;
$$;
drop trigger if exists trg_dossier_savings_progress on public.dossiers;
create trigger trg_dossier_savings_progress
  after insert or update on public.dossiers
  for each row execute function private.dossier_savings_progress_trigger();
