
create table if not exists ref.capability (
  code text primary key,
  label text not null,
  group_label text not null,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null
);
alter table ref.capability enable row level security;
drop policy if exists capability_read on ref.capability;
create policy capability_read on ref.capability for select to authenticated using (true);
drop policy if exists capability_write on ref.capability;
create policy capability_write on ref.capability for all to authenticated
  using ((select private."current_role"()) = 'ADMIN')
  with check ((select private."current_role"()) = 'ADMIN');
select private.attach_audit_trigger('ref.capability');

insert into ref.capability (code, label, group_label, description, sort_order) values
  ('dossier:read', 'Consulter les dossiers', 'Dossiers', 'Voir la liste et le detail des dossiers.', 10),
  ('dossier:create', 'Creer un dossier', 'Dossiers', 'Enregistrer une nouvelle demande.', 20),
  ('dossier:update', 'Modifier un dossier', 'Dossiers', 'Mettre a jour l instruction dun dossier.', 30),
  ('kyc:read', 'Consulter le KYC', 'Conformite', 'Voir l identite et le profil de risque.', 40),
  ('kyc:verify', 'Verifier le KYC', 'Conformite', 'Valider l identite et l affiliation.', 50),
  ('document:read', 'Consulter les pieces', 'Documents', 'Telecharger les pieces justificatives.', 60),
  ('document:upload', 'Deposer une piece', 'Documents', 'Ajouter une piece a un dossier.', 70),
  ('document:validate', 'Valider une piece', 'Documents', 'Accepter une piece apres controle.', 80),
  ('document:reject', 'Rejeter une piece', 'Documents', 'Refuser une piece non conforme.', 90),
  ('savings:read', 'Consulter l epargne', 'Epargne', 'Voir les comptes epargne-logement.', 100),
  ('savings:validate', 'Valider une operation', 'Epargne', 'Controler versements et retraits.', 110),
  ('savings:credit', 'Crediter un compte', 'Epargne', 'Enregistrer une operation d epargne.', 120),
  ('loan_offer:read', 'Consulter les offres', 'Credit', 'Voir les offres de pret emises.', 130),
  ('loan_offer:create', 'Preparer une offre', 'Credit', 'Calculer et enregistrer une offre.', 140),
  ('loan_offer:issue', 'Emettre une offre', 'Credit', 'Rendre une offre opposable au client.', 150),
  ('committee:read', 'Consulter le comite', 'Comite', 'Voir les deliberations.', 160),
  ('committee:deliberate', 'Deliberer', 'Comite', 'Prendre part au vote du comite.', 170),
  ('committee:sign', 'Signer une deliberation', 'Comite', 'Apposer la signature du comite.', 180),
  ('notary:read', 'Consulter les actes', 'Notaire', 'Voir les actes notaries.', 190),
  ('notary:record', 'Enregistrer un acte', 'Notaire', 'Consigner un acte notarie.', 200),
  ('disbursement:read', 'Consulter les decaissements', 'Decaissement', 'Voir l echeancier de deblocage.', 210),
  ('disbursement:release', 'Debloquer des fonds', 'Decaissement', 'Ordonner un deblocage apres inspection.', 220),
  ('disbursement:reconcile', 'Rapprocher les decaissements', 'Decaissement', 'Controler la comptabilisation.', 230),
  ('workflow:read', 'Consulter les workflows', 'Workflows', 'Voir les circuits et leur etat.', 240),
  ('workflow:manage', 'Concevoir les workflows', 'Workflows', 'Creer des circuits et ordonner les etapes.', 250),
  ('workflow:execute', 'Executer un workflow', 'Workflows', 'Faire avancer un dossier detape en etape.', 260),
  ('message:read', 'Lire les messages', 'Messagerie', 'Acceder aux conversations.', 270),
  ('message:send', 'Envoyer des messages', 'Messagerie', 'Repondre et demarrer une conversation.', 280),
  ('email:read', 'Consulter les emails', 'Emails', 'Voir la file denvoi et les modeles.', 290),
  ('email:send', 'Envoyer un email', 'Emails', 'Mettre un email en file denvoi.', 300),
  ('email:manage', 'Gerer les modeles demail', 'Emails', 'Creer et modifier les modeles.', 310),
  ('admin:users', 'Gerer les utilisateurs', 'Administration', 'Creer des comptes et changer de role.', 320),
  ('admin:roles', 'Gerer les roles', 'Administration', 'Creer des roles et modifier leurs droits.', 330),
  ('admin:audit', 'Consulter laudit', 'Administration', 'Lire la piste daudit et les evenements.', 340),
  ('catalogue:write', 'Gerer le catalogue', 'Administration', 'Services, produits, pieces et modeles.', 350)
on conflict (code) do update set label = excluded.label, group_label = excluded.group_label,
  description = excluded.description, sort_order = excluded.sort_order;

insert into ref.pole (code, label, sort_order) values
  ('DG','Direction Generale',10),('DCM','Direction Commerciale et Marketing',20),
  ('DCM-DIAS','Diaspora Desk',30),('DCR','Direction du Credit',40),
  ('DRAC','Direction du Recouvrement et des Affaires Contentieuses',50),
  ('SDA','Services d Appui',60),('SDA-AUDIT','Audit Interne',70),
  ('COMITE','Comite de Credit',80),('PART-BET','Bureau d Etudes Techniques',90),
  ('PART-NOTAIRE','Notaires Partenaires',100),('CITIZEN','Espace Client',110)
on conflict (code) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into ref.service (code, label, description, is_active, sort_order) values
  ('CLT','Relation client','Accueil, information et entree en relation.',true,10),
  ('CPT','Epargne-logement','Ouverture et vie du compte epargne-logement.',true,20),
  ('CRD','Credit habitat','Instruction et mise en place du credit habitat.',true,30),
  ('GAR','Garanties','Constitution, suivi et mainlevee des suretes.',true,40),
  ('REC','Recouvrement','Relances, restructuration et contentieux.',true,50)
on conflict (code) do update set label = excluded.label, description = excluded.description;

insert into ref.product (code, label, description, service_code, loan_ceiling, min_apport_percent, max_duration_years, is_active, sort_order) values
  ('CRD-STD','Credit habitat ordinaire','Pret habitat classique adosse a un titre foncier.','CRD',75000000,20,20,true,10),
  ('CRD-SOC','Credit social','Pret a conditions bonifiees pour les revenus modestes.','CRD',25000000,10,25,true,20),
  ('CPT-A','Carnet A','Epargne-logement Carnet A.','CPT',null,null,null,true,30),
  ('CPT-B','Carnet B','Epargne-logement Carnet B.','CPT',null,null,null,true,40)
on conflict (code) do update set label = excluded.label, service_code = excluded.service_code;

insert into ref.document_nature (code, label) values
  ('IDENTITE','Piece d identite'),('REVENUS','Justificatifs de revenus'),('FONCIER','Documents fonciers'),
  ('TRAVAUX','Documents techniques'),('BANCAIRE','Documents bancaires'),('NOTARIE','Actes notaries')
on conflict (code) do update set label = excluded.label;

insert into ref.document_type
  (code, nature_code, label, issuing_authority, issuing_country, accepted_mime, max_size_bytes,
   min_count, max_count, standalone_ok, requires_signature, requires_photograph, valid_from)
values
  ('CNI','IDENTITE','Carte nationale d identite','DGSN','CM',array['application/pdf','image/jpeg','image/png'],10485760,1,1,true,false,true,date '2020-01-01'),
  ('PASSPORT','IDENTITE','Passeport','DGSN','CM',array['application/pdf','image/jpeg','image/png'],10485760,1,1,true,false,true,date '2020-01-01'),
  ('BULLETIN_SALAIRE','REVENUS','Bulletin de salaire','Employeur','CM',array['application/pdf'],10485760,3,3,true,false,false,date '2020-01-01'),
  ('ATTESTATION_TRAVAIL','REVENUS','Attestation de travail','Employeur','CM',array['application/pdf'],10485760,1,1,true,true,false,date '2020-01-01'),
  ('RELEVE_BANCAIRE','BANCAIRE','Releve bancaire','Banque','CM',array['application/pdf'],10485760,3,6,true,false,false,date '2020-01-01'),
  ('TITRE_FONCIER','FONCIER','Titre foncier','MINDCAF','CM',array['application/pdf'],20971520,1,1,true,true,false,date '2020-01-01'),
  ('PLAN_MASSE','FONCIER','Plan de masse','Geometre','CM',array['application/pdf'],20971520,1,1,false,true,false,date '2020-01-01'),
  ('DEVIS_TRAVAUX','TRAVAUX','Devis descriptif et estimatif','Entreprise','CM',array['application/pdf'],20971520,1,3,true,true,false,date '2020-01-01'),
  ('ACTE_NOTARIE','NOTARIE','Acte notarie','Notaire','CM',array['application/pdf'],20971520,1,1,false,true,false,date '2020-01-01')
on conflict (code) do update set label = excluded.label, nature_code = excluded.nature_code;

insert into ref.chemise (code, label, description, owning_pole, sort_order) values
  ('C1','Pieces administratives','Identite, KYC, justificatifs d emploi et de revenus.','DCM',10),
  ('C2','Pieces foncieres et techniques','Titres fonciers, plans et devis de travaux.','DCR',20),
  ('C3','Garanties et actes','Actes notaries, suretes et assurances.','DRAC',30)
on conflict (code) do update set label = excluded.label, description = excluded.description;

insert into ref.service_document_requirement (service_code, stage, doc_type_code, required, min_count, effective_from) values
  ('CRD','ONBOARDING','CNI',true,1,date '2020-01-01'),
  ('CRD','ONBOARDING','ATTESTATION_TRAVAIL',true,1,date '2020-01-01'),
  ('CRD','SAVINGS','RELEVE_BANCAIRE',true,3,date '2020-01-01'),
  ('CRD','CREDIT_FILE','BULLETIN_SALAIRE',true,3,date '2020-01-01'),
  ('CRD','CREDIT_FILE','TITRE_FONCIER',true,1,date '2020-01-01'),
  ('CRD','CREDIT_FILE','DEVIS_TRAVAUX',true,1,date '2020-01-01'),
  ('CPT','ONBOARDING','CNI',true,1,date '2020-01-01')
on conflict do nothing;
;
