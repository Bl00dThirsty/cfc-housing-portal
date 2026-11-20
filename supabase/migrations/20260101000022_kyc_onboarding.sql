-- 022 — Parcours du demandeur : DUC activable, état du parcours, pièces KYC.
--
-- Trois décisions structurantes :
--
-- 1. L'activation du DUC (« non activé » / « activé ») est un concept
--    **distinct** de `dossiers.status`, qui porte l'avancement du traitement
--    (open | on_hold | closed). Les mélanger rendrait impossible de dire
--    « en instruction mais pas encore activé ».
--
-- 2. L'**état** du KYC reste dans `citizen_profiles.kyc_state` : il a déjà un
--    propriétaire et une machine à états. On ne crée pas de second
--    vocabulaire ; `kyc_profiles` ne porte que le **contenu** du parcours.
--
-- 3. La numérotation des DUC passe par une **séquence**, pas par un compteur
--    lu puis incrémenté : deux inscriptions simultanées ne peuvent pas
--    obtenir le même numéro.
--
-- ⚠️ `public.kyc_profiles` **existe déjà** (migration 025, avec sa RLS et ses
--    grants). Cette migration s'y appuie sans la recréer : elle ne porte que
--    ce qui manque — les colonnes du dossier, la séquence et les pièces.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le dossier : activation, avancement du parcours, situation antérieure
-- ---------------------------------------------------------------------------

alter table public.dossiers
  add column if not exists duc_status text not null default 'non_active'
    check (duc_status in ('non_active', 'active')),
  add column if not exists duc_activated_at timestamptz,
  add column if not exists onboarding_state text not null default 'kyc'
    check (onboarding_state in (
      'kyc',          -- en cours de KYC
      'service',      -- au choix du service
      'documents',    -- au dépôt des pièces du service
      'en_examen',    -- transmis, en attente du conseiller
      'suspension',   -- pas encore client CFC : onboarding en pause
      'active'        -- DUC activé
    )),
  add column if not exists prior_client_case text
    check (prior_client_case is null or prior_client_case in
      ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc'));

comment on column public.dossiers.duc_status is
  'Activation commerciale du DUC — distinct de status, qui porte l''avancement du traitement.';
comment on column public.dossiers.onboarding_state is
  'Avancement du parcours du demandeur : KYC, choix du service, dépôt des pièces, examen, pause, actif.';

create index if not exists dossiers_duc_status_idx
  on public.dossiers (duc_status) where deleted_at is null;
create index if not exists dossiers_onboarding_state_idx
  on public.dossiers (onboarding_state) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- La numérotation des DUC
-- ---------------------------------------------------------------------------

create sequence if not exists public.duc_code_seq as bigint start 1;

comment on sequence public.duc_code_seq is
  'Numérotation des DUC : DUC-AAAA-NNNNN.';

-- ---------------------------------------------------------------------------
-- Les pièces déclarées par le demandeur
-- ---------------------------------------------------------------------------

create table if not exists public.kyc_documents (
  id          uuid primary key default gen_random_uuid(),
  citizen_id  uuid not null references public.actors (id) on delete cascade,
  dossier_id  uuid references public.dossiers (id) on delete cascade,
  doc_code    text not null,
  label       text not null,
  category    text not null default 'kyc'
              check (category in ('kyc', 'emprunteur', 'projet', 'programme', 'partenaires')),
  file_name   text not null,
  file_type   text not null,
  file_size   bigint not null default 0,
  sent_at     timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null,
  unique (citizen_id, doc_code)
);

create index if not exists kyc_documents_citizen_idx
  on public.kyc_documents (citizen_id) where deleted_at is null;

comment on table public.kyc_documents is
  'Pièces déclarées par le demandeur. Seuls le nom, le type, la taille et la date sont conservés : le dépôt lui-même passe par le coffre de documents du dossier.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.kyc_documents enable row level security;
alter table public.kyc_documents force row level security;

drop policy if exists kyc_documents_read on public.kyc_documents;
create policy kyc_documents_read on public.kyc_documents for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) is not null
      and (select private.current_role()) <> 'CITIZEN'
      and (select private.has_capability((select private.current_role()), 'kyc:read'))
    )
  );

drop policy if exists kyc_documents_write on public.kyc_documents;
create policy kyc_documents_write on public.kyc_documents for all to authenticated
  using (citizen_id = (select auth.uid()))
  with check (citizen_id = (select auth.uid()));

grant select, insert, update, delete on public.kyc_documents to authenticated;
grant all on public.kyc_documents to service_role;
