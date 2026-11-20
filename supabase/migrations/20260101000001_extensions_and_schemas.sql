-- 001 — Extensions et schémas.
--
-- Trois schémas, trois destinations :
--   public  → le domaine métier (dossiers, documents, événements).
--   ref     → le référentiel déclarable par l'administration (catalogue
--             documentaire, services, produits, taux, seuils, habilitations).
--   private → les fonctions utilitaires. JAMAIS exposé via l'API : le schéma
--             n'est pas listé dans `api.schemas` de `config.toml`.

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists ref;
create schema if not exists private;
-- `private` est verrouillé : aucun droit public, usage réservé aux rôles
-- applicatifs via des fonctions `security definer`.
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
grant usage on schema public, ref to anon, authenticated, service_role;
comment on schema public is 'Domaine métier CFC (dossiers, documents, événements).';
comment on schema ref is 'Référentiel déclarable par l administration (catalogue, seuils, habilitations).';
comment on schema private is 'Fonctions utilitaires. Jamais exposées via l API.';
