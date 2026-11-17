-- Quatrième passe des capacités : décision DUC et demande de pièce.
--
-- `decide_duc_eligibility` vérifie `dossier:decide`, mais la capacité n'était
-- accordée à aucun rôle : l'activation du DUC était donc impossible.
-- `document:request` était accordée, mais absente du catalogue.
--
-- On inscrit les deux capacités au catalogue et on attribue la décision aux
-- rôles qui instruisent les dossiers.

set search_path = public, extensions;

insert into ref.capability (code, label, group_label, description, sort_order)
values
  ('dossier:decide', 'Décider de l''éligibilité', 'Dossiers', 'Activer ou refuser le DUC d''un dossier.', 35),
  ('document:request', 'Demander une pièce', 'Documents', 'Demander une pièce complémentaire à l''emprunteur.', 85)
on conflict (code) do nothing;

insert into ref.role_capability (role_code, capability)
values
  ('GUICHET', 'dossier:decide'),
  ('GESTIONNAIRE', 'dossier:decide'),
  ('DIASPORA', 'dossier:decide'),
  ('ADMIN', 'dossier:decide'),
  ('GUICHET', 'document:request'),
  ('GESTIONNAIRE', 'document:request'),
  ('DIASPORA', 'document:request'),
  ('ADMIN', 'document:request')
on conflict (role_code, capability) do nothing;
