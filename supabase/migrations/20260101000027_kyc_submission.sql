-- 027 — L'état du KYC appartient à la plateforme, et la soumission est atomique.
--
-- Deux défauts, un seul remedy : la base.
--
-- 1. `citizen_profiles` s'update par la RLS sans restriction de colonne :
--    un citoyen pouvait écrire **son propre** `kyc_state`, et se passer
--    lui-même l'approbation. L'état du KYC a un propriétaire — la machine à
--    états — et un garde-fou le lui rend.
--
-- 2. La soumission du KYC faisait deux écritures distinctes (l'horodatage
--    puis l'état) : une coupure entre les deux laissait un dossier marqué
--    « soumis » sans l'être. La soumission devient **une fonction** : elle est
--    atomique, et elle applique la transition que la machine autorise.
--
-- ⚠️ La soumission mène à `document_verification`, pas à
--    `approval_pending` : le contrôle de filtrage est une grille, et aucun
--    dossier ne sort de `screening_pending` sans décision de contrôle
--    écrite. Le conseiller reste le maître de la suite.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le garde-fou : le citoyen n'écrit pas l'état
-- ---------------------------------------------------------------------------

create or replace function private.guard_citizen_profile_update()
returns trigger
language plpgsql
security definer
set search_path TO ''
as $function$
begin
  -- Un **agent** peut décider : son habilitation le dit, et la RLS le
  -- vérifie déjà. Un citoyen, non : l'état du KYC n'est pas sa déclaration.
  if (select private.current_role()) is null
     and (select auth.uid()) = old.id
     and new.kyc_state is distinct from old.kyc_state then
    raise exception 'citizen_profile_field_forbidden' using errcode = '42501';
  end if;

  return new;
end $function$;

drop trigger if exists trg_guard_citizen_profile_update on public.citizen_profiles;

create trigger trg_guard_citizen_profile_update
before update on public.citizen_profiles
for each row execute function private.guard_citizen_profile_update();

comment on function private.guard_citizen_profile_update() is
  'Le citoyen declare qui il est ; il ne decide pas de son etat KYC.';

-- ---------------------------------------------------------------------------
-- La soumission : une fonction, une transition
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

  update public.citizen_profiles
  set kyc_state = 'document_verification', updated_at = now()
  where id = (select auth.uid());

  return 'document_verification';
end $function$;

comment on function public.submit_kyc_profile() is
  'Soumet le profil KYC du citoyen connecte : horodatage et transition vers la verification des pieces, en une seule operation.';

revoke all on function public.submit_kyc_profile() from public;
grant execute on function public.submit_kyc_profile() to authenticated, service_role;
