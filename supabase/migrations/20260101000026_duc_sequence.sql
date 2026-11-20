-- 026 — La numérotation des DUC, par la séquence.
--
-- Le code du DUC est la **clé métier** du dossier : c'est par lui que l'emprunteur
-- et l'agent le désignent. Il doit donc être unique — et il doit l'être sans
-- course : deux inscriptions simultanées ne peuvent pas obtenir le même code.
--
-- L'application ne peut pas appeler `nextval` : elle passe par une fonction.
-- La fonction est `SECURITY DEFINER` parce que la séquence est propriété du
-- système : elle rend un code, elle n'écrit rien.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le code suivant
-- ---------------------------------------------------------------------------

-- La forme est celle que le portail affiche déjà : `CFC-<année>-DUC-<n>`.
-- Seul le suffixe change : il vient de la séquence, plus d'un tirage au sort.
create or replace function public.next_duc_code() returns text
language sql volatile security definer set search_path = '' as $$
  select 'CFC-' || extract(year from now())::text || '-DUC-' ||
         lpad(nextval('public.duc_code_seq')::text, 5, '0');
$$;

comment on function public.next_duc_code() is
  'Renvoie le prochain code de DUC : CFC-AAAA-DUC-NNNNN. La numérotation passe par une séquence — jamais par un compteur lu puis incrémenté.';

revoke all on function public.next_duc_code() from public;
grant execute on function public.next_duc_code() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- L'unicité du code
-- ---------------------------------------------------------------------------

create unique index if not exists dossiers_duc_code_unique
  on public.dossiers (duc_code) where deleted_at is null;

comment on index public.dossiers_duc_code_unique is
  'Le code du DUC est la clé métier du dossier : deux dossiers actifs ne peuvent pas le porter.';
