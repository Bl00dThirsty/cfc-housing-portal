-- 030 — Les décisions de l'agent, et un seul vocabulaire pour les faits.
--
-- Quatre corrections et apports, tous dans la même idée : **un fait métier est
-- écrit une fois, avec le vocabulaire que le catalogue connaît, et il produit
-- les deux signaux — in-app et courriel**.
--
-- 1. **Le vocabulaire.** `submit_service_application` journalisait
--    `application.submitted` : une orthographe que le catalogue des
--    notifications ne connaît pas. Le fait était écrit, jamais notifié — ni
--    signal, ni courriel. Le journal parle désormais le même vocabulaire que
--    le catalogue.
--
-- 2. **La suspension.** `set_prior_client_case` mettait le dossier en pause
--    sans rien écrire. Une pause sans trace n'est pas un fait : elle est
--    désormais journalisée, et elle est notifiée.
--
-- 3. **Les décisions de l'agent.** L'activation du DUC, son refus et la
--    demande d'une pièce sont des faits **de la plateforme** : ils passent par
--    des fonctions atomiques, comme la soumission du KYC (migrations 027 et
--    028). Un agent ne peut pas écrire `duc_status` : le garde-fou de la
--    migration 029 le refuse, et c'est bien ainsi.
--
-- 4. **L'idempotence.** Un même fait peut être signalé deux fois : par
--    l'action serveur qui connaît le destinataire, et par le relais de la
--    base qui constate le fait sans connaître le destinataire. La
--    notification porte désormais une **clé de fait** : le second passage
--    ne crée pas de doublon.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- 1. La transmission se dit APPLICATION_SUBMITTED
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
  'Transmet le dossier du demandeur au conseiller : le dossier passe en examen, le conseiller est affecte, et la transmission est journalisee en APPLICATION_SUBMITTED.';

revoke all on function public.submit_service_application(text) from public;
grant execute on function public.submit_service_application(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. La suspension est journalisée
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

  -- Seule la **pause** est un fait à notifier : elle dit au demandeur que
  -- son dossier attend un conseiller. Le dépôt des pièces, lui, est la
  -- suite normale du parcours — il ne dérange personne.
  if next_state = 'suspension' then
    insert into public.dossier_events (
      dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
    )
    values (
      dossier_row.id,
      'APPLICATION_SUSPENDED',
      (select auth.uid()),
      'CITIZEN',
      jsonb_build_object(
        'prior_client_case', p_case,
        'advisor', advisor_name,
        'duc_code', dossier_row.duc_code
      ),
      'COBAC R-2023/01 — lignes directrices LC-COB/01',
      now()
    );
  end if;

  return next_state;
end $function$;

comment on function public.set_prior_client_case(text, text) is
  'Enregistre la situation du demandeur face au service choisi et fait avancer le parcours : ''documents'' s''il a deja beneficie du service au CFC, ''suspension'' sinon, avec un conseiller affecte. La suspension est journalisee en APPLICATION_SUSPENDED.';

revoke all on function public.set_prior_client_case(text, text) from public;
grant execute on function public.set_prior_client_case(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. La capacité « demander une pièce »
-- ---------------------------------------------------------------------------
--
-- Elle n'existait pas : rien ne pouvait être demandé à l'emprunteur, alors
-- que le catalogue des notifications et le modèle d'e-mail knew la demande
-- de pièce. Les rôles qui enrôlent l'emprunteur la portent.

insert into ref.role_capability (role_code, capability)
values
  ('GUICHET', 'document:request'),
  ('GESTIONNAIRE', 'document:request'),
  ('DIASPORA', 'document:request'),
  ('ADMIN', 'document:request')
on conflict (role_code, capability) do nothing;

-- ---------------------------------------------------------------------------
-- 4. L'activation du DUC — la décision de l'agent
-- ---------------------------------------------------------------------------
--
-- Le garde-fou de la migration 029 interdit d'écrire `duc_status`,
-- `duc_activated_at` et `onboarding_state` depuis le client : ces colonnes
-- appartiennent à la plateforme. La décision de l'agent passe donc par ici,
-- et par nulle part ailleurs.
--
-- La fonction est **atomique** : la décision, son effet et sa trace dans le
-- journal forment un seul fait. Si l'écriture échoue, rien ne change et rien
-- n'est écrit.

create or replace function public.decide_duc_eligibility(
  p_dossier_id uuid,
  p_eligible boolean,
  p_motif text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  motif text;
  event_type text;
begin
  if p_dossier_id is null then
    raise exception 'dossier_required' using errcode = '42501';
  end if;

  -- **Décider** n'est pas **mettre à jour** : la capacité est vérifiée
  -- avant tout, et elle est distincte de `dossier:update`.
  if not (select private.has_capability((select private.current_role()), 'dossier:decide')) then
    raise exception 'dossier_decide_forbidden' using errcode = '42501';
  end if;

  select * into dossier_row
  from public.dossiers
  where id = p_dossier_id
    and deleted_at is null;

  if dossier_row.id is null then
    raise exception 'dossier_not_found' using errcode = '42501';
  end if;

  -- Le périmètre : un agent ne décide que sur les dossiers qu'il instruit.
  if not (select private.can_act_on_dossier(
    (select private.current_pole()),
    dossier_row.owner_user_id,
    dossier_row.agency_id,
    dossier_row.is_diaspora,
    dossier_row.id
  )) then
    raise exception 'dossier_event_forbidden' using errcode = '42501';
  end if;

  motif := trim(coalesce(p_motif, ''));

  -- Un refus se motive : sans motif, le demandeur ne sait pas quoi
  -- régulariser.
  if not p_eligible and motif = '' then
    raise exception 'motif_required' using errcode = '42501';
  end if;

  event_type := case when p_eligible then 'DUC_ACTIVATED' else 'DUC_REFUSED' end;

  perform set_config('app.system_update', '1', true);

  update public.dossiers
  set duc_status = case when p_eligible then 'active' else 'non_active' end,
      duc_activated_at = case when p_eligible then now() else null end,
      onboarding_state = case when p_eligible then 'active' else 'suspension' end,
      updated_at = now()
  where id = dossier_row.id;

  perform set_config('app.system_update', '0', true);

  -- La décision est **journalisée** : le journal fait foi, et c'est lui qui
  -- déclenche la notification et le courriel.
  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  )
  values (
    dossier_row.id,
    event_type,
    (select auth.uid()),
    (select private.current_role()),
    jsonb_build_object(
      'duc_code', dossier_row.duc_code,
      'eligible', p_eligible,
      'motif', nullif(motif, '')
    ),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return event_type;
end $function$;

comment on function public.decide_duc_eligibility(uuid, boolean, text) is
  'Decide de l''eligibilite d''un dossier : le DUC est active, ou refuse avec un motif. La decision, son effet et sa trace sont atomiques.';

revoke all on function public.decide_duc_eligibility(uuid, boolean, text) from public;
grant execute on function public.decide_duc_eligibility(uuid, boolean, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. La demande d'une pièce
-- ---------------------------------------------------------------------------
--
-- La demande est un **fait** : elle est journalisée, et elle est notifiée.
-- Elle ne crée pas de pièce : une pièce qui n'existe pas encore n'a ni
-- empreinte, ni taille, ni nom de fichier — et le modèle de la table
-- `dossier_documents` l'interdit. L'emprunteur voit la demande dans sa
-- chronologie et dans sa notification ; la pièce, elle, naîtra de son dépôt.

create or replace function public.request_dossier_document(
  p_dossier_id uuid,
  p_doc_type_code text,
  p_motif text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  dossier_row public.dossiers%rowtype;
  doc_type text;
  motif text;
begin
  if p_dossier_id is null then
    raise exception 'dossier_required' using errcode = '42501';
  end if;

  doc_type := trim(coalesce(p_doc_type_code, ''));
  if doc_type = '' then
    raise exception 'doc_type_required' using errcode = '42501';
  end if;

  if not (select private.has_capability((select private.current_role()), 'document:request')) then
    raise exception 'document_request_forbidden' using errcode = '42501';
  end if;

  -- La pièce demandée doit exister au catalogue : on ne demande pas une
  -- pièce que personne ne sait produire.
  if not exists (
    select 1 from ref.document_type dt
    where dt.code = doc_type and dt.deleted_at is null
  ) then
    raise exception 'unknown_document_type' using errcode = '42501';
  end if;

  select * into dossier_row
  from public.dossiers
  where id = p_dossier_id
    and deleted_at is null;

  if dossier_row.id is null then
    raise exception 'dossier_not_found' using errcode = '42501';
  end if;

  if not (select private.can_act_on_dossier(
    (select private.current_pole()),
    dossier_row.owner_user_id,
    dossier_row.agency_id,
    dossier_row.is_diaspora,
    dossier_row.id
  )) then
    raise exception 'dossier_event_forbidden' using errcode = '42501';
  end if;

  motif := trim(coalesce(p_motif, ''));

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  )
  values (
    dossier_row.id,
    'DOCUMENT_REQUESTED',
    (select auth.uid()),
    (select private.current_role()),
    jsonb_build_object(
      'doc_type_code', doc_type,
      'motif', nullif(motif, ''),
      'duc_code', dossier_row.duc_code
    ),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return doc_type;
end $function$;

comment on function public.request_dossier_document(uuid, text, text) is
  'Demande une piece a l''emprunteur : la demande est journalisee en DOCUMENT_REQUESTED et notifiee.';

revoke all on function public.request_dossier_document(uuid, text, text) from public;
grant execute on function public.request_dossier_document(uuid, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. L'idempotence des notifications
-- ---------------------------------------------------------------------------
--
-- Le même fait peut être signalé deux fois : par l'action serveur, qui
-- connaît le destinataire, et par le relais de la base, qui constate le
-- fait sans le connaître. La notification porte une **clé de fait** — le
-- second passage ne crée pas de doublon.

alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_dedupe_key_idx
  on public.notifications (dedupe_key)
  where dedupe_key is not null and deleted_at is null;

comment on column public.notifications.dedupe_key is
  'Cle de fait : un evenement metier ne produit qu''une notification, quel que soit le chemin qui le signale.';

-- ---------------------------------------------------------------------------
-- 7. L'ecran d'atterrissage de chaque role
-- ---------------------------------------------------------------------------
--
-- La colonne existe, mais elle portait encore les chemins de l'ancienne
-- arborescence (`/admin/...`). La source de vérité de l'atterrissage est la
-- configuration de l'application (`src/config/rbac/sidebar-by-role.ts`) : le
-- middleware est au bord de la plateforme, il ne peut pas interroger la base
-- à chaque requête. Le référentiel, lui, ne doit pas mentir.

update ref.role set landing_path = '/portail-cfc/analytics' where code = 'ADMIN';
update ref.role set landing_path = '/portail-cfc/actors/credit-committees' where code = 'COMITE';
update ref.role set landing_path = '/portail-cfc/actors/agency/diaspora' where code = 'DIASPORA';
update ref.role set landing_path = '/portail-cfc/dossiers' where code = 'GESTIONNAIRE';
update ref.role set landing_path = '/portail-cfc/actors/agency' where code = 'GUICHET';
update ref.role set landing_path = '/portail-cfc/actors/notary-cadastre' where code = 'NOTAIRE';
update ref.role set landing_path = '/portail-cfc/actors/risk-engineering' where code = 'RISQUES_BET';
