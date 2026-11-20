-- 016 — Service d'e-mail : catalogue versionné, journal des livraisons et
-- relais des événements métier.
--
-- Trois objets, trois destinations :
--
-- - `ref.email_template` — le catalogue **déclarable** des modèles. Une
--   ligne = une version. Un modèle expédié n'est jamais réécrit : l'édition
--   ferme la version courante (`effective_to`) et ouvre une version nouvelle.
-- - `public.email_deliveries` — le journal des envois. Il répond à la
--   question « le client dit ne pas avoir reçu le lien » : sans trace, la
--   réclamation est indéfendable.
-- - `ref.email_settings` — le relais : l'URL et le jeton du point d'entrée
--   HTTP qui transforme un fait métier en e-mail.
--
-- Décision de modélisation — **clé primaire `(code, version)`** :
-- le code est la clé métier du catalogue (il est utilisé partout : chaîne
-- d'envoi, actions, éditeur), mais il ne peut pas être la clé physique
-- unique : le versionnement exige de pouvoir opener plusieurs lignes pour
-- un même code. La contrainte « une seule version ouverte par code » est
-- portée par un index unique partiel.
--
-- Règles appliquées (cf. migration 013) :
-- - `USING` pour les lectures, `WITH CHECK` pour les écritures ;
-- - la capacité est vérifiée par `private.has_capability`, jamais recopiée ;
-- - le journal des livraisons n'est **pas** insérable par un agent : seule
--   la chaîne d'envoi (rôle de service) écrit.

-- ---------------------------------------------------------------------------
-- Extension de relais HTTP (base → application)
-- ---------------------------------------------------------------------------
--
-- `pg_net` permet à la base de notifier l'application lors d'un fait
-- métier. L'extension n'est utilisée que par le déclencheur de relais ; son
-- absence ne bloque jamais l'opération métier (le déclencheur avale ses
-- propres erreurs).

create extension if not exists pg_net with schema extensions;
-- ---------------------------------------------------------------------------
-- Catalogue des modèles
-- ---------------------------------------------------------------------------

create table if not exists ref.email_template (
  code             text not null,
  version          integer not null default 1 check (version > 0),
  label            text not null,
  subject_template text not null,
  html_template    text not null default '',
  text_template    text not null default '',
  event_type       text not null,
  audience         text not null default 'citizen'
                   check (audience in ('citizen', 'staff', 'both')),
  is_active        boolean not null default true,
  variables        text[] not null default '{}',
  effective_from   timestamptz not null default now(),
  effective_to     timestamptz,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  deleted_at       timestamptz,
  deleted_by       uuid references auth.users (id) on delete set null,
  primary key (code, version),
  constraint email_template_window_ck
    check (effective_to is null or effective_to > effective_from)
);
comment on table ref.email_template is
  'Catalogue versionné des modèles d''e-mail CFC. Une ligne = une version ; un modèle expédié n''est jamais réécrit.';
-- Une seule version ouverte par code : la version courante.
create unique index if not exists email_template_current_key
  on ref.email_template (code)
  where effective_to is null and deleted_at is null;
-- Recherche de la version courante d'un code.
create index if not exists email_template_code_idx
  on ref.email_template (code, version desc)
  where deleted_at is null;
-- ---------------------------------------------------------------------------
-- Journal des livraisons
-- ---------------------------------------------------------------------------

create table if not exists public.email_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  template_code       text not null,
  recipient_email     text not null,
  recipient_user_id   uuid references auth.users (id) on delete set null,
  subject             text,
  status              text not null default 'queued'
                      check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider            text,
  provider_message_id text,
  error_message       text,
  payload             jsonb not null default '{}'::jsonb,
  idempotency_key     text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid references auth.users (id) on delete set null
);
comment on table public.email_deliveries is
  'Journal des envois d''e-mail : chaque tentative, avec son état, son fournisseur et les variables utilisées.';
create index if not exists email_deliveries_recipient_idx
  on public.email_deliveries (recipient_email, created_at desc);
create index if not exists email_deliveries_status_idx
  on public.email_deliveries (status);
-- Un envoi ne passe pas deux fois sous la même clé d'idempotence.
create unique index if not exists email_deliveries_idempotency_key_uidx
  on public.email_deliveries (idempotency_key)
  where idempotency_key is not null;
-- ---------------------------------------------------------------------------
-- Paramétrage du relais base → application
-- ---------------------------------------------------------------------------

create table if not exists ref.email_settings (
  id             smallint primary key default 1 check (id = 1),
  dispatch_url   text,
  dispatch_token text,
  is_enabled     boolean not null default false,
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users (id) on delete set null
);
comment on table ref.email_settings is
  'Point d''entrée HTTP du relais d''e-mail. Ligne unique (id = 1). Désactivé par défaut.';
-- ---------------------------------------------------------------------------
-- Déclencheurs d'audit
-- ---------------------------------------------------------------------------

select private.attach_audit_trigger('ref.email_template');
select private.attach_audit_trigger('public.email_deliveries');
select private.attach_audit_trigger('ref.email_settings');
-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table ref.email_template enable row level security;
alter table ref.email_template force row level security;
alter table ref.email_settings enable row level security;
alter table ref.email_settings force row level security;
alter table public.email_deliveries enable row level security;
alter table public.email_deliveries force row level security;
-- Catalogue : lecture pour les agents, écriture réservée à l'administrateur
-- du catalogue (`catalogue:write`).
create policy email_template_read on ref.email_template for select to authenticated
  using (true);
create policy email_template_write on ref.email_template for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'catalogue:write')))
  with check ((select private.has_capability((select private.current_role()), 'catalogue:write')));
-- Paramétrage du relais : même habilitation que le catalogue.
create policy email_settings_read on ref.email_settings for select to authenticated
  using ((select private.has_capability((select private.current_role()), 'catalogue:write')));
create policy email_settings_write on ref.email_settings for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'catalogue:write')))
  with check ((select private.has_capability((select private.current_role()), 'catalogue:write')));
-- Journal des livraisons : lecture réservée au personnel habilité à
-- l'audit ou à la gestion du catalogue. Le journal contient des données
-- personnelles (destinataire, variables), il n'est pas ouvert au public du
-- référentiel.
create policy email_deliveries_read on public.email_deliveries for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'catalogue:write'))
    or (select private.has_capability((select private.current_role()), 'admin:audit'))
  );
-- Aucune politique d'insertion : le journal est écrit par la chaîne d'envoi
-- (rôle de service), jamais par un agent.

-- ---------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------

grant select on ref.email_template to authenticated;
grant insert, update, delete on ref.email_template to authenticated;
grant select on ref.email_settings to authenticated;
grant insert, update, delete on ref.email_settings to authenticated;
grant select on public.email_deliveries to authenticated;
grant all on ref.email_template to service_role;
grant all on ref.email_settings to service_role;
grant all on public.email_deliveries to service_role;
-- ---------------------------------------------------------------------------
-- Publication d'une version de modèle
-- ---------------------------------------------------------------------------
--
-- La fonction vit dans `public` — et non dans `private` — parce qu'elle
-- doit être appelable par l'application via PostgREST : c'est le seul moyen
-- de garantir que la fermeture et l'insertion se font **dans la même
-- transaction** (une fermeture suivie d'une insertion séparées
-- laisseraient la fenêtre ouverte, voire deux versions courantes).
--
-- Le contrôle d'accès est refait à l'intérieur : `catalogue:write`, rôle
-- effectif lu dans `public.staff_assignments`.

create or replace function public.publish_email_template(
  p_code            text,
  p_label           text,
  p_subject_template text,
  p_html_template   text,
  p_text_template   text,
  p_event_type      text,
  p_audience        text,
  p_is_active       boolean,
  p_variables       text[],
  p_version         integer
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_now   timestamptz := now();
  v_max   integer;
  v_row   ref.email_template;
begin
  if not (select private.has_capability((select private.current_role()), 'catalogue:write')) then
    raise exception 'email_template_write_forbidden' using errcode = '42501';
  end if;

  if p_code is null or btrim(p_code) = '' then
    raise exception 'email_template_code_required' using errcode = '22023';
  end if;

  select coalesce(max(t.version), 0) into v_max
  from ref.email_template t
  where t.code = p_code;

  if p_version is distinct from v_max + 1 then
    raise exception 'email_template_version_conflict' using errcode = '40001';
  end if;

  -- Ferme les versions ouvertes : un modèle expédié n'est jamais réécrit.
  update ref.email_template
  set effective_to = v_now
  where code = p_code
    and deleted_at is null
    and effective_to is null;

  insert into ref.email_template (
    code, version, label, subject_template, html_template, text_template,
    event_type, audience, is_active, variables, effective_from, effective_to
  )
  values (
    p_code, p_version, coalesce(nullif(btrim(p_label), ''), p_code),
    p_subject_template, coalesce(p_html_template, ''), coalesce(p_text_template, ''),
    coalesce(nullif(btrim(p_event_type), ''), p_code),
    coalesce(p_audience, 'citizen'),
    coalesce(p_is_active, true),
    coalesce(p_variables, '{}'::text[]),
    v_now, null
  )
  returning * into v_row;

  return to_jsonb(v_row);
end $$;
grant execute on function public.publish_email_template(
  text, text, text, text, text, text, text, boolean, text[], integer
) to authenticated, service_role;
-- ---------------------------------------------------------------------------
-- Relais des événements métier vers l'application
-- ---------------------------------------------------------------------------
--
-- La base ne connaît pas les modèles : elle constate un fait et le
-- signale. L'application décide alors du modèle, des variables et du
-- destinataire. Cette séparation évite de dupliquer la logique de rendu
-- dans le SQL.

create or replace function private.email_dispatch_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_url   text;
  v_token text;
  v_row   jsonb;
begin
  select s.dispatch_url, s.dispatch_token into v_url, v_token
  from ref.email_settings s
  where s.id = 1
    and s.is_enabled
    and s.deleted_at is null;

  -- Aucun relais configuré : le métier n'est jamais bloqué.
  if v_url is null then
    return new;
  end if;

  v_row := to_jsonb(new);

  begin
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object(
        'source', tg_table_name,
        'event_type', coalesce(v_row ->> 'event_type', 'PROFILE_CREATED'),
        'row', v_row
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(v_token, '')
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    -- La messagerie ne doit jamais faire échouer l'opération métier.
    null;
  end;

  return new;
end $$;
grant execute on function private.email_dispatch_event() to service_role;
-- Un fait métier daté (dossier_events) ou la création d'un profil citoyen.
create trigger trg_email_dispatch_dossier_event
  after insert on public.dossier_events
  for each row execute function private.email_dispatch_event();
create trigger trg_email_dispatch_citizen_profile
  after insert on public.citizen_profiles
  for each row execute function private.email_dispatch_event();
