-- 002 — Contexte de session et audit.
--
-- Toutes les fonctions sont `security definer` avec `search_path = ''` :
-- aucune résolution de nom ne peut être détournée par un objet créé par un
-- utilisateur, et aucune fonction de `private` n'est appelable depuis un
-- schéma exposé.
--
-- Les fonctions qui dépendent d'une table métier sont créées dans la
-- migration qui introduit cette table (003 identité, 004 référentiel,
-- 006 dossiers, 012 événements) : aucune fonction ne référence un objet
-- inexistant.

-- ---------------------------------------------------------------------------
-- Contexte de session
-- ---------------------------------------------------------------------------

-- Identifiant de l'acteur. Le contexte de session (`app.current_user_id`)
-- prime ; à défaut, on retombe sur le `sub` du JWT validé par Supabase Auth.
-- Cette valeur ne provient jamais d'une saisie client.
create or replace function private.current_user_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select coalesce(
           nullif(current_setting('app.current_user_id', true), '')::uuid,
           (select auth.uid())
         );
$$;

-- Rôle effectif de l'acteur, lu dans `public.staff_assignments`
-- (registre de référence — `app_metadata` n'est qu'un cache).
-- Défini en migration 003, avec les tables dont il dépend.

-- Agence de rattachement de l'acteur.
-- Défini en migration 003, avec les tables dont il dépend.

-- Pôle organisationnel de l'acteur. Le contexte de session prime ; à défaut,
-- on lit le pôle dans `public.staff_profiles`.
-- Défini en migration 003, avec les tables dont il dépend.

-- Pose le contexte de session. `set_config(..., true)` est transaction-local :
-- le contexte ne peut pas fuir sur une connexion mutualisée.
create or replace function private.set_session_context(p_pole text, p_user_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.current_pole', coalesce(p_pole, ''), true);
  perform set_config('app.current_user_id', coalesce(p_user_id::text, ''), true);
end $$;

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

-- Colonnes d'audit : le trigger est le SEUL moyen de renseigner
-- `updated_by` / `deleted_by`. L'application ne peut pas les forger.
create or replace function private.audit_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, private.current_user_id());
  end if;
  new.updated_at := now();
  new.updated_by := private.current_user_id();
  if tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then
    new.deleted_by := private.current_user_id();
  end if;
  return new;
end $$;

-- Attache le trigger d'audit à une table (idempotent).
create or replace function private.attach_audit_trigger(p_table text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_schema text;
  v_name text;
  v_trigger text;
begin
  v_schema := split_part(p_table, '.', 1);
  v_name := split_part(p_table, '.', 2);
  v_trigger := 'trg_audit_' || v_name;

  execute format('drop trigger if exists %I on %I.%I', v_trigger, v_schema, v_name);
  execute format(
    'create trigger %I before insert or update on %I.%I
       for each row execute function private.audit_columns()',
    v_trigger, v_schema, v_name
  );
end $$;

grant execute on all functions in schema private to authenticated, service_role;
