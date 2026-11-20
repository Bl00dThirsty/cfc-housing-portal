-- 034 — Le catalogue de référence, exposé là où l'application le lit.
--
-- Le portail lit le référentiel dans le schéma `ref`. C'est le bon endroit
-- pour l'écrire — versionné, auditable, administrable — mais **pas** un
-- endroit où le lire depuis l'application :
--
-- - la plateforme hébergée n'expose à PostgREST que `public` et
--   `graphql_public` ; le schéma `ref` y répond `406 PGRST106` ;
-- - la base locale, elle, expose `ref` : l'application y lisait donc un
--   catalogue que la production ne voyait jamais. Un écart d'environnement
--   déguisé en defect de données.
--
-- La correction est structurelle : le référentiel reste dans `ref`, et il est
-- **exposé** par des vues en lecture dans `public` — le schéma que la
-- plateforme expose partout. Les vues sont `security invoker` : la lecture
-- passe par les droits et la RLS de l'appelant, exactement comme une lecture
-- directe le ferait.
--
-- L'application pointe désormais sur ces vues : le même code lit le même
-- catalogue en local et en production, sans réglage d'environnement.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Les vues
-- ---------------------------------------------------------------------------

create or replace view public.cfc_service
with (security_invoker = true) as
  select code, label, description, audience, is_active, sort_order,
         created_at, updated_at, deleted_at
  from ref.service;

create or replace view public.cfc_product
with (security_invoker = true) as
  select code, label, description, service_code, loan_ceiling,
         min_apport_percent, max_duration_years, is_active, sort_order,
         created_at, updated_at, deleted_at
  from ref.product;

create or replace view public.cfc_product_rate
with (security_invoker = true) as
  select id, product_code, rate_code, label, annual_rate, duration_years,
         savings_rate, valid_from, valid_to, created_at, updated_at, deleted_at
  from ref.product_rate;

create or replace view public.cfc_document_type
with (security_invoker = true) as
  select code, nature_code, label, category, issuing_authority, issuing_country,
         validity_months, renewal_reminder_days, accepted_mime, max_size_bytes,
         min_count, max_count, standalone_ok, requires_signature,
         requires_photograph, valid_from, valid_to, created_at, updated_at,
         deleted_at
  from ref.document_type;

create or replace view public.cfc_document_nature
with (security_invoker = true) as
  select code, label, description, requires_issuer_check, requires_validity_check,
         requires_human_review, sort_order, created_at, updated_at, deleted_at
  from ref.document_nature;

create or replace view public.cfc_service_document_requirement
with (security_invoker = true) as
  select id, service_code, stage, doc_type_code, required, min_count, max_count,
         alternative_group, condition_expr, depends_on_doc, effective_from,
         effective_to, created_at, updated_at, deleted_at
  from ref.service_document_requirement;

-- Le catalogue de messages : l'éditeur de modèles le lit et l'écrit.
create or replace view public.cfc_email_template
with (security_invoker = true) as
  select code, version, label, subject_template, html_template, text_template,
         event_type, audience, is_active, variables, effective_from, effective_to,
         created_at, updated_at, deleted_at
  from ref.email_template;

-- La configuration du relais d'événements : une seule ligne.
create or replace view public.cfc_email_settings
with (security_invoker = true) as
  select id, dispatch_url, is_enabled, created_at, updated_at, deleted_at
  from ref.email_settings;

-- ---------------------------------------------------------------------------
-- Le jeton du relais : il ne sort **jamais** de la base
-- ---------------------------------------------------------------------------
--
-- Le relais d'événements s'authentifie par un jeton partagé. L'exposer par
-- une vue le donnerait à quiconque lit la table ; on compare donc **dans**
-- la base, et la fonction ne renvoie qu'un oui ou non.

create or replace function public.cfc_dispatch_token_valid(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from ref.email_settings s
    where s.id = 1
      and s.deleted_at is null
      and s.is_enabled
      and s.dispatch_token is not null
      and s.dispatch_token = p_token
  );
$function$;

comment on function public.cfc_dispatch_token_valid(text) is
  'Le jeton du relais est compare dans la base : il ne sort jamais.';

revoke all on function public.cfc_dispatch_token_valid(text) from public;
grant execute on function public.cfc_dispatch_token_valid(text) to service_role;

-- ---------------------------------------------------------------------------
-- Les droits
-- ---------------------------------------------------------------------------

grant select on
  public.cfc_service,
  public.cfc_product,
  public.cfc_product_rate,
  public.cfc_document_type,
  public.cfc_document_nature,
  public.cfc_service_document_requirement,
  public.cfc_email_template,
  public.cfc_email_settings
  to authenticated, anon;

grant all on
  public.cfc_service,
  public.cfc_product,
  public.cfc_product_rate,
  public.cfc_document_type,
  public.cfc_document_nature,
  public.cfc_service_document_requirement,
  public.cfc_email_template,
  public.cfc_email_settings
  to service_role;

comment on view public.cfc_service is
  'Catalogue des services CFC, expose dans public : la plateforme hebergee ne publie pas le schema ref a PostgREST.';
comment on view public.cfc_email_settings is
  'Configuration du relais d''evenements (une seule ligne). Le jeton de dispatch reste dans ref : il ne sort pas de la base.';
