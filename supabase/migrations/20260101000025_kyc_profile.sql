-- ---------------------------------------------------------------------------
-- Le profil du demandeur
-- ---------------------------------------------------------------------------
-- Le parcours d'inscription demande au citoyen des faits que le **dossier**
-- ne peut pas porter : le revenu déclaré, le nombre de personnes à charge, les
-- crédits en cours. Et le revenu *assessé* par la plateforme (`dossiers
-- .monthly_income`) est protégé : un client ne peut pas l'écrire
-- (`guard_citizen_dossier_update`).
--
-- Les déclarations du citoyen ont donc leur propre table, celle du parcours
-- d'inscription et de KYC : `kyc_profiles`. Le dossier en reste la copie de
-- travail de la plateforme ; les déclarations n'y sont pas recopiées.
--
-- La forme de la table est celle du plan d'inscription et de KYC : la
-- migration du plan s'appuiera dessus sans la recréer.

create table if not exists public.kyc_profiles (
  citizen_id   uuid primary key references public.actors (id) on delete cascade,
  identity     jsonb not null default '{}'::jsonb,
  residence    jsonb not null default '{}'::jsonb,
  employment   jsonb not null default '{}'::jsonb,
  compliance   jsonb not null default '{}'::jsonb,
  -- Le consentement, daté **par le serveur** : la date du navigateur n'est
  -- pas une preuve.
  consent_at   timestamptz,
  consent_text text,
  -- Le motif du rejet, écrit par le conseiller.
  rejection_reason text,
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  deleted_at   timestamptz,
  deleted_by   uuid references auth.users (id) on delete set null
);

-- La table a pu être créée par une version antérieure de ce fichier : les
-- colonnes manquantes sont ajoutées, jamais recréées.
alter table public.kyc_profiles add column if not exists consent_text text;
alter table public.kyc_profiles add column if not exists rejection_reason text;
alter table public.kyc_profiles add column if not exists submitted_at timestamptz;
alter table public.kyc_profiles add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.kyc_profiles add column if not exists updated_by uuid references auth.users (id) on delete set null;
alter table public.kyc_profiles add column if not exists deleted_at timestamptz;
alter table public.kyc_profiles add column if not exists deleted_by uuid references auth.users (id) on delete set null;

create index if not exists kyc_profiles_updated_idx
  on public.kyc_profiles (updated_at desc) where deleted_at is null;

comment on table public.kyc_profiles is
  'Contenu du parcours KYC du demandeur. L''état du KYC reste dans citizen_profiles.kyc_state : cette table ne porte pas de statut.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Un citoyen lit et écrit **son** profil de parcours ; un agent habilité lit
-- l'ensemble (pour instruire le dossier).

alter table public.kyc_profiles enable row level security;
alter table public.kyc_profiles force row level security;

drop policy if exists kyc_profiles_read on public.kyc_profiles;
create policy kyc_profiles_read on public.kyc_profiles for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) is not null
      and (select private.current_role()) <> 'CITIZEN'
      and (select private.has_capability((select private.current_role()), 'kyc:read'))
    )
  );

drop policy if exists kyc_profiles_write on public.kyc_profiles;
create policy kyc_profiles_write on public.kyc_profiles for all to authenticated
  using (citizen_id = (select auth.uid()))
  with check (citizen_id = (select auth.uid()));

drop policy if exists kyc_profiles_agent_update on public.kyc_profiles;
create policy kyc_profiles_agent_update on public.kyc_profiles for update to authenticated
  using (
    (select private.current_role()) is not null
    and (select private.current_role()) <> 'CITIZEN'
    and (select private.has_capability((select private.current_role()), 'kyc:decide'))
  )
  with check (
    (select private.current_role()) is not null
    and (select private.current_role()) <> 'CITIZEN'
    and (select private.has_capability((select private.current_role()), 'kyc:decide'))
  );

grant select, insert, update, delete on public.kyc_profiles to authenticated;
grant all on public.kyc_profiles to service_role;
