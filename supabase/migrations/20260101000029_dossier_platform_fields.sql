-- 029 — Le parcours du dossier appartient à la plateforme, pas au citoyen.
--
-- Le garde-fou de la migration 021 protège les champs **dérivés** du dossier
-- (montant, taux, avancement…). Il en oublie quatre, qui sont du même genre :
-- l'**activation** du DUC, l'**avancement** du parcours, le **conseiller**
-- affecté et la **situation** déclarée face au service.
--
-- Sans cette extension, un citoyen pouvait écrire `duc_status = 'active'` sur
-- son propre dossier — et s'ouvrir, seul, les droits d'un dossier activé.
--
-- La correction est structurelle : ces transitions passent désormais par des
-- **fonctions** de la base, atomiques, et non par des écritures du client.
-- C'est la même idée que la soumission du KYC (migrations 027 et 028).

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le garde-fou étendu
-- ---------------------------------------------------------------------------

create or replace function private.guard_citizen_dossier_update()
returns trigger
language plpgsql
security definer
set search_path TO ''
as $function$
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
       -- L'activation du DUC, l'avancement du parcours, le conseiller et la
       -- situation face au service : quatre décisions de la plateforme, que le
       -- citoyen s'attribuait.
       or new.duc_status is distinct from old.duc_status
       or new.duc_activated_at is distinct from old.duc_activated_at
       or new.onboarding_state is distinct from old.onboarding_state
       or new.advisor is distinct from old.advisor
       or new.prior_client_case is distinct from old.prior_client_case
     ) then
    raise exception 'dossier_field_forbidden' using errcode = '42501';
  end if;

  return new;
end $function$;

-- ---------------------------------------------------------------------------
-- La situation face au service
-- ---------------------------------------------------------------------------

create or replace function public.set_prior_client_case(p_case text, p_advisor text)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  next_state text;
  advisor_name text;
begin
  if p_case not in ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc') then
    raise exception 'unknown_prior_client_case' using errcode = '42501';
  end if;

  advisor_name := trim(coalesce(p_advisor, ''));

  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid())
    and deleted_at is null
  order by created_at desc
  limit 1;

  if dossier_row.id is null then
    raise exception 'no_dossier' using errcode = '42501';
  end if;

  -- Seule la troisième situation est éligible : les deux autres demandent
  -- d'être client du CFC depuis six mois. Le conseiller n'est affecté que
  -- dans ce cas — un dossier en attente n'a personne pour l'examiner encore.
  if p_case = 'deja_au_cfc' then
    next_state := 'documents';
  else
    next_state := 'suspension';
    if advisor_name = '' then
      raise exception 'advisor_required' using errcode = '42501';
    end if;
  end if;

  perform set_config('app.system_update', '1', true);

  update public.dossiers
  set prior_client_case = p_case,
      onboarding_state = next_state,
      advisor = case when advisor_name = '' then advisor else advisor_name end,
      updated_at = now()
  where id = dossier_row.id;

  perform set_config('app.system_update', '0', true);

  return next_state;
end $function$;

comment on function public.set_prior_client_case(text, text) is
  'Enregistre la situation du demandeur face au service choisi et fait avancer le parcours : ''documents'' s''il a deja beneficie du service au CFC, ''suspension'' sinon, avec un conseiller affecte.';

revoke all on function public.set_prior_client_case(text, text) from public;
grant execute on function public.set_prior_client_case(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- La transmission du dossier au conseiller
-- ---------------------------------------------------------------------------

create or replace function public.submit_service_application(p_advisor text)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  advisor_name text;
begin
  if p_advisor is null or length(trim(p_advisor)) = 0 then
    raise exception 'advisor_required' using errcode = '42501';
  end if;

  advisor_name := trim(p_advisor);

  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid())
    and deleted_at is null
  order by created_at desc
  limit 1;

  if dossier_row.id is null then
    raise exception 'no_dossier' using errcode = '42501';
  end if;

  -- Un dossier en pause ne se transmet pas : il attend qu'un conseiller
  -- oriente le demandeur vers l'épargne.
  if dossier_row.onboarding_state = 'suspension' then
    raise exception 'onboarding_suspended' using errcode = '42501';
  end if;

  perform set_config('app.system_update', '1', true);

  update public.dossiers
  set onboarding_state = 'en_examen',
      advisor = advisor_name,
      updated_at = now()
  where id = dossier_row.id;

  perform set_config('app.system_update', '0', true);

  -- La transmission est **journalisée** : elle est un fait métier, et le
  -- journal est la chronologie du dossier.
  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  )
  values (
    dossier_row.id,
    'application.submitted',
    (select auth.uid()),
    'CITIZEN',
    jsonb_build_object(
      'service_code', dossier_row.service_code,
      'advisor', advisor_name,
      'duc_code', dossier_row.duc_code
    ),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return advisor_name;
end $function$;

comment on function public.submit_service_application(text) is
  'Transmet le dossier du demandeur au conseiller : le dossier passe en examen, le conseiller est affecte, et la transmission est journalisee.';

revoke all on function public.submit_service_application(text) from public;
grant execute on function public.submit_service_application(text) to authenticated, service_role;
