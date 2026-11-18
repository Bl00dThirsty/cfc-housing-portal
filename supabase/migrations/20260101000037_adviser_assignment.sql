-- ---------------------------------------------------------------------------
-- 037 — Le conseiller affecté est un agent, et il le sait
-- ---------------------------------------------------------------------------
--
-- Un dossier n'était affecté qu'à un **nom** : `dossiers.advisor`. Le nom
-- est ce que le demandeur voit, mais il ne dit rien à la plateforme. Le
-- dossier n'appartenait donc à personne — l'agent qui doit l'instruire ne
-- pouvait pas le voir dans son portefeuille, et rien ne le prévenait.
--
-- Trois corrections, dans la même idée : **l'affectation est un compte**.
--
-- 1. Les deux fonctions d'affectation prennent le compte du conseiller, et
--    l'inscrivent dans `dossiers.owner_user_id`. Le titre du dossier et son
--    périmètre suivent : `OWN_PORTFOLIO` ne laisse voir à un gestionnaire
--    que les dossiers dont il est le titulaire.
--
-- 2. Le type de notification `dossier.assigned` existe : un dossier
--    attribué est un signal in-app pour le conseiller. `document.rejected`
--    manquait aussi — le catalogue du code knew le type, la base le
--    refusait : la notification d'une pièce rejetée ne partait jamais.
--
-- 3. Les fonctions gardent leur nom et leur grammaire : seule l'affectation
--    gagne un paramètre. Les anciennes versions sont retirées pour qu'aucun
--    appel ne puisse affecter un dossier à un nom seul.

-- ---------------------------------------------------------------------------
-- 1. Le type de notification
-- ---------------------------------------------------------------------------

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'kyc.decision', 'document.requested', 'document.validated',
    'document.rejected', 'document.uploaded', 'committee.decision',
    'loan.offer', 'disbursement.released', 'payoff.statement',
    'mainlevee.ready', 'support.message', 'dossier.updated',
    'dossier.assigned'
  ));

-- ---------------------------------------------------------------------------
-- 2. La transmission du dossier au conseiller
-- ---------------------------------------------------------------------------

drop function if exists public.submit_service_application(text);

create or replace function public.submit_service_application(
  p_advisor text,
  p_advisor_id uuid default null
)
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
      -- Le titulaire est le **compte** du conseiller : c'est lui qui porte
      -- le dossier dans son portefeuille.
      owner_user_id = coalesce(p_advisor_id, owner_user_id),
      updated_at = now()
  where id = dossier_row.id;

  perform set_config('app.system_update', '0', true);

  -- La transmission est **journalisée** : elle est un fait métier, et le
  -- journal est la chronologie du dossier. Le type reprend le vocabulaire du
  -- catalogue des notifications, sans quoi le fait ne produirait aucun
  -- signal.
  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  )
  values (
    dossier_row.id,
    'APPLICATION_SUBMITTED',
    (select auth.uid()),
    'CITIZEN',
    jsonb_build_object(
      'advisor', advisor_name,
      'advisor_id', p_advisor_id,
      'duc_code', dossier_row.duc_code
    ),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return advisor_name;
end $function$;

comment on function public.submit_service_application(text, uuid) is
  'Transmet le dossier du demandeur au conseiller : le dossier passe en examen, le conseiller est affecte comme titulaire, et la transmission est journalisee en APPLICATION_SUBMITTED.';

revoke all on function public.submit_service_application(text, uuid) from public;
grant execute on function public.submit_service_application(text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. La situation du demandeur face au service choisi
-- ---------------------------------------------------------------------------

drop function if exists public.set_prior_client_case(text, text);

create or replace function public.set_prior_client_case(
  p_case text,
  p_advisor text,
  p_advisor_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  next_state text;
  advisor_name text;
  event_type text;
begin
  if p_case is null or p_case not in ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc') then
    raise exception 'unknown_prior_client_case' using errcode = '42501';
  end if;

  advisor_name := trim(coalesce(p_advisor, ''));

  select * into dossier_row
  from public.dossiers
  where citizen_id = (select auth.uid())
    and deleted_at is null
  order by created_at desc, id desc
  limit 1;

  if dossier_row.id is null then
    raise exception 'no_dossier' using errcode = '42501';
  end if;

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
      -- Un dossier en attente est lui aussi instruit par quelqu'un : son
      -- titulaire est le conseiller affecté.
      owner_user_id = case
        when advisor_name = '' then owner_user_id
        else coalesce(p_advisor_id, owner_user_id)
      end,
      updated_at = now()
  where id = dossier_row.id;

  perform set_config('app.system_update', '0', true);

  if dossier_row.onboarding_state is distinct from next_state
     or dossier_row.prior_client_case is distinct from p_case then
    event_type := case
      when next_state = 'documents' then 'DOCUMENTS_READY'
      else 'APPLICATION_SUSPENDED'
    end;

    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
    )
    values (
      dossier_row.id,
      event_type,
      (select auth.uid()),
      'CITIZEN',
      jsonb_build_object(
        'prior_client_case', p_case,
        'advisor', nullif(advisor_name, ''),
        'advisor_id', p_advisor_id,
        'duc_code', dossier_row.duc_code
      ),
      'COBAC R-2023/01 — lignes directrices LC-COB/01',
      now()
    );
  end if;

  return next_state;
end $function$;

comment on function public.set_prior_client_case(text, text, uuid) is
  'Enregistre la situation du demandeur et journalise chaque changement vers le depot des pieces (DOCUMENTS_READY) ou la suspension (APPLICATION_SUSPENDED). Le conseiller affecte devient le titulaire du dossier.';

revoke all on function public.set_prior_client_case(text, text, uuid) from public;
grant execute on function public.set_prior_client_case(text, text, uuid) to authenticated, service_role;
