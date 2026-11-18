-- 028 — La soumission du KYC est une écriture **système**.
--
-- Le garde-fou de la migration 027 bloque toute écriture de `kyc_state` par
-- le citoyen — y compris celle de la fonction de soumission, qui passe par
-- le même chemin.
--
-- La correction est celle que le garde-fou du dossier utilise déjà : une
-- écriture **système** — une valeur tenue par la plateforme, pas une
-- déclaration du citoyen — porte le drapeau `app.system_update`. Le drapeau
-- est posé **autour** de l'écriture, puis remis à zéro : il n'ouvre pas la
-- porte au reste de la transaction.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le garde-fou, corrigé
-- ---------------------------------------------------------------------------

create or replace function private.guard_citizen_profile_update()
returns trigger
language plpgsql
security definer
set search_path TO ''
as $function$
begin
  -- Une écriture **système** (une valeur tenue par la plateforme) n'est pas
  -- une écriture du citoyen : elle ne doit pas être refusée.
  if coalesce(current_setting('app.system_update', true), '0') = '1' then
    return new;
  end if;

  -- Un **agent** peut décider : son habilitation le dit, et la RLS le
  -- vérifie déjà. Un citoyen, non : l'état du KYC n'est pas sa déclaration.
  if (select private.current_role()) is null
     and (select auth.uid()) = old.id
     and new.kyc_state is distinct from old.kyc_state then
    raise exception 'citizen_profile_field_forbidden' using errcode = '42501';
  end if;

  return new;
end $function$;

-- ---------------------------------------------------------------------------
-- La soumission, corrigée
-- ---------------------------------------------------------------------------

create or replace function public.submit_kyc_profile()
returns text
language plpgsql
security definer
set search_path TO ''
as $function$
declare
  current_state text;
begin
  select kyc_state into current_state
  from public.citizen_profiles
  where id = (select auth.uid());

  if current_state is null then
    raise exception 'not_a_citizen' using errcode = '42501';
  end if;

  -- On ne soumet qu'un dossier en cours d'identification : un dossier deja
  -- examine ne se resoumet pas, et un dossier rejete ne se relance pas seul.
  if current_state not in ('pre_boarding', 'identity_capture', 'document_verification') then
    raise exception 'kyc_not_submittable' using errcode = '42501';
  end if;

  update public.kyc_profiles
  set submitted_at = now(), updated_at = now()
  where citizen_id = (select auth.uid());

  -- L'ecriture de l'etat est **systeme** : c'est la plateforme qui fait
  -- avancer la machine a etats, pas le citoyen qui s'auto-approuve.
  perform set_config('app.system_update', '1', true);

  update public.citizen_profiles
  set kyc_state = 'document_verification', updated_at = now()
  where id = (select auth.uid());

  perform set_config('app.system_update', '0', true);

  return 'document_verification';
end $function$;
