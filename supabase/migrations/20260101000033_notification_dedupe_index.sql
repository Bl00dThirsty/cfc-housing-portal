-- 033 — L'index de fait, entier.
--
-- L'index posé par la migration 030 était **partiel** (`deleted_at is null`).
-- PostgREST ne peut pas déduire un index partiel pour un `ON CONFLICT` : la
-- notification n'était donc jamais écrite — l'erreur était journalisée, puis
-- avalée.
--
-- L'index devient **entier**. Postgres autorise plusieurs valeurs nulles dans
-- un index unique (deux lignes nulles ne se confondent pas) : les
-- notifications sans clé de fait — les messages de support, par exemple —
-- restent donc acceptées.
--
-- Une notification n'est jamais supprimée dans le produit : elle est lue ou
-- lue. La clé de fait d'une notification supprimée ne peut donc pas faire
-- écran à une notification neuve.

set search_path = public, extensions;

drop index if exists public.notifications_dedupe_key_idx;

create unique index if not exists notifications_dedupe_key_idx
  on public.notifications (dedupe_key);
