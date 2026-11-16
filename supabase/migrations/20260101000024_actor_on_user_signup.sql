-- ---------------------------------------------------------------------------
-- Un compte est un acteur
-- ---------------------------------------------------------------------------
-- Le profil citoyen référence `public.actors` : sans acteur, pas de profil, et
-- pas de dossier. Or rien ne créait l'acteur : un compte créé par
-- l'inscription n'était **reconnu par personne**, et l'emprunteur lisait
-- « votre session a expiré » — un refus qui racontait autre chose.
--
-- Le trigger crée donc l'acteur **avec** le compte, et le rattrapage répare
-- les comptes créés avant lui.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.actors (id, actor_type)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'actor_type' in ('citizen', 'staff', 'service')
        then new.raw_user_meta_data ->> 'actor_type'
      else 'citizen'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage : les comptes créés avant ce trigger n'ont pas d'acteur. Un compte
-- qui porte un profil agent est un agent ; tous les autres sont des
-- emprunteurs.
insert into public.actors (id, actor_type)
select
  u.id,
  case
    when exists (select 1 from public.staff_profiles s where s.id = u.id) then 'staff'
    else 'citizen'
  end
from auth.users u
on conflict (id) do nothing;
