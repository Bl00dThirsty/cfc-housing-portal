--- 019 — Notifications in-app et fil de support (messagerie).
---
--- Deux besoins liés : **prévenir** l'acteur concerné après un événement
--- important, et lui permettre d'échanger avec son interlocuteur.
---
--- Les notifications sont la contrepartie *in-app* du service d'e-mail : le
--- même événement produit une ligne dans `public.notifications` et un envoi
--- par courriel. Le journal d'événements (`public.dossier_events`) reste la
--- preuve ; la notification n'est qu'un signal d'attention.
---
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  type              text not null check (type in (
                    'kyc.decision', 'document.requested', 'document.validated',
                    'document.uploaded', 'committee.decision', 'loan.offer',
                    'disbursement.released', 'payoff.statement', 'mainlevee.ready',
                    'support.message', 'dossier.updated'
                  )),
  title             text not null,
  body              text,
  dossier_id        uuid references public.dossiers (id) on delete cascade,
  action_url        text,
  read_at           timestamptz,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users (id) on delete set null
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, created_at desc)
  where deleted_at is null;

create index if not exists notifications_unread_idx
  on public.notifications (recipient_user_id)
  where read_at is null and deleted_at is null;

comment on table public.notifications is
  'Notifications in-app. Chaque événement important produit une ligne ici et un envoi par courriel.';

-- ---------------------------------------------------------------------------
-- Fil de support (une conversation par dossier)
-- ---------------------------------------------------------------------------

create table if not exists public.support_messages (
  id              uuid primary key default gen_random_uuid(),
  room_name       text not null,
  dossier_id      uuid references public.dossiers (id) on delete cascade,
  author_user_id  uuid not null references auth.users (id) on delete cascade,
  author_name     text not null,
  author_role     text not null,
  content         text not null check (length(content) between 1 and 4000),
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid references auth.users (id) on delete set null
);

create index if not exists support_messages_room_idx
  on public.support_messages (room_name, created_at);

comment on table public.support_messages is
  'Fil de support : une conversation persistée par dossier. La diffusion temps réel passe par le broadcast Supabase.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.notifications force row level security;
alter table public.support_messages enable row level security;
alter table public.support_messages force row level security;

-- Une notification n'est lisible que par son destinataire.
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated
  using (recipient_user_id = (select auth.uid()));

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_user_id = (select auth.uid()))
  with check (recipient_user_id = (select auth.uid()));

-- Une notification est écrite par le service (rôle de service) via les
-- actions serveur. La politique ci-dessous n'est qu'un **filet** pour un
-- accès direct par l'API : un utilisateur ne peut notifier que lui-même.
drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications for insert to authenticated
  with check (recipient_user_id = (select auth.uid()));

-- Le fil : l'emprunteur voit les messages de son dossier, l'agent ceux des
-- dossiers de son périmètre.
drop policy if exists support_messages_read on public.support_messages;
create policy support_messages_read on public.support_messages for select to authenticated
  using (
    author_user_id = (select auth.uid())
    or exists (
      select 1
      from public.dossiers d
      where d.id = support_messages.dossier_id
        and d.citizen_id = (select auth.uid())
    )
    or (select private.has_capability((select private.current_role()), 'dossier:read'))
  );

drop policy if exists support_messages_write on public.support_messages;
create policy support_messages_write on public.support_messages for insert to authenticated
  with check (author_user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------

grant select, update on public.notifications to authenticated;
grant insert on public.notifications to authenticated;
grant delete on public.notifications to authenticated;
grant select, insert on public.support_messages to authenticated;
grant update, delete on public.support_messages to authenticated;
grant all on public.notifications, public.support_messages to service_role;

-- ---------------------------------------------------------------------------
-- Temps réel
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.support_messages;
