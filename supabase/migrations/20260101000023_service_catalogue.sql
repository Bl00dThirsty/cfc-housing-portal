-- 023 — Le catalogue des services du cahier des charges.
--
-- Le catalogue est une **donnée**, jamais une constante de code : les tables
-- de référence existent déjà (migrations 004 et 005), on les **étend**.
--
-- Trois apports :
--
-- 1. `ref.service.audience` — une carte de service doit dire à qui il
--    s'adresse. La colonne n'existait pas.
-- 2. `ref.document_type.category` — la page des pièces du service groupe les
--    pièces par catégorie (emprunteur, projet, programme, partenaires). Le
--    regroupement est **déclaratif** : il vit avec le type de document, pas
--    dans l'écran.
-- 3. Les six services du cahier des charges, leurs produits, leurs barèmes,
--    leurs types de documents et leurs exigences de pièces.
--
-- ⚠️ Le prêt aux collectivités (CTD) n'est **pas** ajouté : il n'est pas
--    destiné aux particuliers.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- L'audience d'un service, et la catégorie d'un type de document
-- ---------------------------------------------------------------------------

alter table ref.service
  add column if not exists audience text;

comment on column ref.service.audience is
  'À qui le service s''adresse — affiché sur la carte de service.';

alter table ref.document_type
  add column if not exists category text
    check (category is null or category in ('emprunteur', 'projet', 'programme', 'partenaires'));

comment on column ref.document_type.category is
  'Catégorie d''exigence de pièces : emprunteur, projet, programme ou partenaires.';

-- ---------------------------------------------------------------------------
-- Les six services du cahier des charges
-- ---------------------------------------------------------------------------

insert into ref.service (code, label, description, audience, sort_order)
values
  (
    'PRET_FONCIER_CLASSIQUE_JEUNE',
    'Prêt Foncier Classique — Jeune',
    'Prêt foncier classique destiné aux jeunes de moins de 35 ans, à revenu stable, quiConstituent leur première épargne logement.',
    'Jeunes de moins de 35 ans',
    10
  ),
  (
    'PRET_FONCIER_CLASSIQUE_ACQUEREUR',
    'Prêt Foncier Classique — Acquéreur',
    'Prêt foncier classique destiné à l''acquéreur d''un logement qu''il occupe, qui épargne pour constituer son apport.',
    'Acquéreurs d''un logement',
    20
  ),
  (
    'PRET_FONCIER_CLASSIQUE_SOCIAL',
    'Prêt Foncier Classique — Social',
    'Prêt foncier classique à conditions aménagées, destiné aux ménages à revenu modeste rattachés à un circuit d''épargne logement.',
    'Ménages à revenu modeste',
    30
  ),
  (
    'PRET_FONCIER_LOCATIF_ORDINAIRE',
    'Prêt Foncier Locatif — Ordinaire',
    'Prêt foncier locatif destiné à l''investisseur qui loue le logement construit, pour un rendement locatif libre.',
    'Investisseurs locatifs',
    40
  ),
  (
    'PRET_FONCIER_LOCATIF_SOCIAL',
    'Prêt Foncier Locatif — Social',
    'Prêt foncier locatif destiné à l''investisseur d''un logement à usage social, sous conditions d''encadrement des loyers.',
    'Investisseurs locatifs sociaux',
    50
  ),
  (
    'PROMO_FONCIER',
    'Prévente Foncière',
    'Prêt foncier destiné à l''acquéreur d''un logement mis en vente par un opérateur de programme immobilier.',
    'Acquéreurs d''un programme immobilier',
    60
  )
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      audience = excluded.audience,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Les produits : apport minimal et durée maximale
-- ---------------------------------------------------------------------------

insert into ref.product (code, label, description, service_code, min_apport_percent, max_duration_years)
values
  ('PFC_JEUNE_15', 'Prêt Foncier Classique Jeune — 15 ans', 'Prêt foncier classique jeune, durée maximale de 15 ans.', 'PRET_FONCIER_CLASSIQUE_JEUNE', 10.00, 15),
  ('PFC_ACQ_15', 'Prêt Foncier Classique Acquéreur — 15 ans', 'Prêt foncier classique acquéreur, durée maximale de 15 ans.', 'PRET_FONCIER_CLASSIQUE_ACQUEREUR', 20.00, 15),
  ('PFC_SOCIAL_15', 'Prêt Foncier Classique Social — 15 ans', 'Prêt foncier classique social, durée maximale de 15 ans.', 'PRET_FONCIER_CLASSIQUE_SOCIAL', 10.00, 15),
  ('PFL_ORD_15', 'Prêt Foncier Locatif Ordinaire — 15 ans', 'Prêt foncier locatif ordinaire, durée maximale de 15 ans.', 'PRET_FONCIER_LOCATIF_ORDINAIRE', 30.00, 15),
  ('PFL_SOCIAL_15', 'Prêt Foncier Locatif Social — 15 ans', 'Prêt foncier locatif social, durée maximale de 15 ans.', 'PRET_FONCIER_LOCATIF_SOCIAL', 20.00, 15),
  ('PROMO_15', 'Prévente Foncière — 15 ans', 'Prêt de prévente foncière, durée maximale de 15 ans.', 'PROMO_FONCIER', 30.00, 15)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      service_code = excluded.service_code,
      min_apport_percent = excluded.min_apport_percent,
      max_duration_years = excluded.max_duration_years;

-- ---------------------------------------------------------------------------
-- Les barèmes — le taux indicatif affiché sur la carte
-- ---------------------------------------------------------------------------

insert into ref.product_rate (product_code, rate_code, label, annual_rate, duration_years, savings_rate, valid_from)
values
  ('PFC_JEUNE_15', 'TAUX_BONIFIE', 'Taux jeune', 5.000, 15, 3.500, current_date),
  ('PFC_JEUNE_15', 'TAUX_STANDARD', 'Taux standard', 5.500, 15, 3.500, current_date),
  ('PFC_ACQ_15', 'TAUX_BONIFIE', 'Taux bonifié', 5.250, 15, 3.500, current_date),
  ('PFC_ACQ_15', 'TAUX_STANDARD', 'Taux standard', 5.750, 15, 3.500, current_date),
  ('PFC_SOCIAL_15', 'TAUX_SOLIDAIRE', 'Taux social', 5.000, 15, 4.000, current_date),
  ('PFL_ORD_15', 'TAUX_STANDARD', 'Taux standard', 6.250, 15, 3.000, current_date),
  ('PFL_SOCIAL_15', 'TAUX_SOLIDAIRE', 'Taux social', 5.500, 15, 4.000, current_date),
  ('PROMO_15', 'TAUX_STANDARD', 'Taux standard', 6.250, 15, 3.000, current_date)
on conflict (product_code, rate_code, duration_years, valid_from) where deleted_at is null
do update
  set label = excluded.label,
      annual_rate = excluded.annual_rate,
      savings_rate = excluded.savings_rate;

-- ---------------------------------------------------------------------------
-- Les types de documents du cahier des charges
-- ---------------------------------------------------------------------------

insert into ref.document_type (code, nature_code, label, issuing_authority, category, validity_months)
values
  ('NIU_ATTESTATION', 'IDENTITE', 'Attestation d''immatriculation (NIU)', 'Direction générale des impôts', 'emprunteur', 12),
  ('MARRIAGE_CERTIFICATE', 'IDENTITE', 'Acte de mariage ou certificat de célibat', 'Délégation départementale', 'emprunteur', 6),
  ('EMPLOYMENT_CERTIFICATE', 'REVENU', 'Attestation d''emploi ou de présence effective', 'Employeur', 'emprunteur', 3),
  ('PRESENCE_ATTESTATION', 'REVENU', 'Attestation de présence effective', 'Employeur', 'emprunteur', 3),
  ('CDI_CONTRACT', 'REVENU', 'Contrat de travail à durée indéterminée', 'Employeur', 'emprunteur', null),
  ('BANK_RIB', 'REVENU', 'RIB et relevés des six derniers mois', 'Banque', 'emprunteur', 6),
  ('CRIMINAL_RECORD', 'CONFORMITE', 'Bulletin n°3 du casier judiciaire', 'Tribunal de grande instance', 'emprunteur', 3),
  ('CV', 'REVENU', 'Curriculum vitae', 'Demandeur', 'emprunteur', null),
  ('SIGNED_FORM', 'CONFORMITE', 'Demande manuscrite ou formulaire signé', 'Demandeur', 'emprunteur', null),
  ('SALE_PROMISE', 'FONCIER', 'Promesse de vente notariée', 'Notaire', 'projet', 6),
  ('NOTARY_FEES_STATEMENT', 'FONCIER', 'État des frais du notaire', 'Notaire', 'projet', 3),
  ('URBANISM_CERTIFICATE', 'FONCIER', 'Certificat d''urbanisme et d''accessibilité', 'Service domanial et de l''urbanisme', 'projet', 6),
  ('ACCESSIBILITY_CERTIFICATE', 'TECHNIQUE', 'Certificat d''accessibilité', 'Service domanial et de l''urbanisme', 'projet', 6),
  ('TECHNICAL_STUDY', 'TECHNIQUE', 'Études architecturales et techniques', 'Bureau d''études', 'projet', 12),
  ('BUILD_PERMIT_RECEIPT', 'TECHNIQUE', 'Attestation de dépôt du permis de construire', 'Service domanial et de l''urbanisme', 'projet', 6),
  ('PROJECT_PLANNING', 'TECHNIQUE', 'Planning de travaux et échéancier de dépenses', 'Maîtrise d''ouvrage', 'projet', 12),
  ('FINANCIAL_PLAN', 'REVENU', 'Plan de financement', 'Demandeur', 'projet', 6),
  ('PROFITABILITY_STUDY', 'REVENU', 'Étude de rentabilité', 'Conseil', 'projet', 12),
  ('FINANCIAL_STATEMENT', 'REVENU', 'Bilan financier', 'Expert-comptable', 'projet', 12),
  ('PROMOTION_CONTRACT', 'FONCIER', 'Contrat de promotion immobilière', 'Opérateur de programme', 'programme', 12),
  ('LOTISSEMENT_ORDER', 'FONCIER', 'Arrêté préfectoral de lotissement', 'Préfet', 'programme', null),
  ('LOTISSEMENT_SPECIFICATIONS', 'FONCIER', 'Cahier des charges du lotissement', 'Service domanial et de l''urbanisme', 'programme', null),
  ('MARKET_STUDY', 'REVENU', 'Étude de marché', 'Conseil', 'programme', 12),
  ('PRECOMMERCIALIZATION_STATUS', 'REVENU', 'État de pré-commercialisation', 'Opérateur de programme', 'programme', 3),
  ('PARTNER_CV', 'REVENU', 'Curriculum vitae des partenaires', 'Partenaire', 'partenaires', 12),
  ('PARTNER_REFERENCES', 'REVENU', 'Références des partenaires', 'Partenaire', 'partenaires', 12),
  ('TAX_FILE', 'CONFORMITE', 'Dossier fiscal', 'Conseil', 'partenaires', 12),
  ('PARTNERSHIP_CONTRACT', 'FONCIER', 'Contrats de partenariat', 'Partenaire', 'partenaires', 12)
on conflict (code) do update
  set label = excluded.label,
      issuing_authority = excluded.issuing_authority,
      category = excluded.category,
      validity_months = excluded.validity_months;

-- ---------------------------------------------------------------------------
-- Les exigences de pièces, au stade ONBOARDING
--
-- Trois ensembles, du plus simple au plus exigeant :
--
-- - le **classique** : pièce d'identité, NIU, mariage, emploi, salaire, RIB,
--   et le dossier foncier du projet ;
-- - le **locatif**   : le classique, plus casier judiciaire, CV, justificatifs
--   de revenus, et les pièces des partenaires ;
-- - la **promo**     : le locatif, plus les pièces du programme.
-- ---------------------------------------------------------------------------

-- Le classique : demandeur et projet.
-- Le locatif   : ce que le classique exige, et de plus.
-- La promo     : ce que le locatif exige, et les pièces du programme.
--
-- ⚠️ Les ensembles sont écrits en `values` et non dans des tables
--    temporaires : la migration est rejouable, et elle ne laisse rien
--    derrière elle — même en cas d'échec au milieu.
with classic (doc_code, min_count) as (
  select * from (values
    ('SIGNED_FORM', 1),
    ('CNI_BIOMETRIQUE', 1),
    ('NIU_ATTESTATION', 1),
    ('MARRIAGE_CERTIFICATE', 1),
    ('EMPLOYMENT_CERTIFICATE', 1),
    ('PRESENCE_ATTESTATION', 1),
    ('CDI_CONTRACT', 1),
    ('PAYSLIP', 3),
    ('BANK_RIB', 1),
    ('LAND_TITLE', 1),
    ('PROPERTY_CERTIFICATE', 1),
    ('SALE_PROMISE', 1),
    ('NOTARY_FEES_STATEMENT', 1),
    ('TECHNICAL_STUDY', 1),
    ('URBANISM_CERTIFICATE', 1),
    ('ACCESSIBILITY_CERTIFICATE', 1),
    ('BUILD_PERMIT', 1),
    ('BUILD_PERMIT_RECEIPT', 1)
  ) as v(doc_code, min_count)
),
locatif (doc_code, min_count) as (
  select * from (values
    ('CRIMINAL_RECORD', 1),
    ('CV', 1),
    ('INCOME_ATTESTATION', 1),
    ('PARTNER_CV', 1),
    ('PARTNER_REFERENCES', 1),
    ('TAX_FILE', 1),
    ('PARTNERSHIP_CONTRACT', 1)
  ) as v(doc_code, min_count)
),
promo (doc_code, min_count) as (
  select * from (values
    ('PROMOTION_CONTRACT', 1),
    ('LOTISSEMENT_ORDER', 1),
    ('LOTISSEMENT_SPECIFICATIONS', 1),
    ('PROJECT_PLANNING', 1),
    ('FINANCIAL_PLAN', 1),
    ('MARKET_STUDY', 1),
    ('PRECOMMERCIALIZATION_STATUS', 1)
  ) as v(doc_code, min_count)
),
services (code) as (
  select * from (values
    ('PRET_FONCIER_CLASSIQUE_JEUNE'),
    ('PRET_FONCIER_CLASSIQUE_ACQUEREUR'),
    ('PRET_FONCIER_CLASSIQUE_SOCIAL'),
    ('PRET_FONCIER_LOCATIF_ORDINAIRE'),
    ('PRET_FONCIER_LOCATIF_SOCIAL'),
    ('PROMO_FONCIER')
  ) as v(code)
),
pieces (service_code, doc_code, min_count) as (
  -- Le classique pour les six services du cahier des charges.
  select services.code, classic.doc_code, classic.min_count
  from services cross join classic
  union all
  -- Le lot locatif, pour les trois services locatifs et la promo.
  select services.code, locatif.doc_code, locatif.min_count
  from services cross join locatif
  where services.code in ('PRET_FONCIER_LOCATIF_ORDINAIRE', 'PRET_FONCIER_LOCATIF_SOCIAL', 'PROMO_FONCIER')
  union all
  -- Le lot promo, pour la seule promo.
  select services.code, promo.doc_code, promo.min_count
  from services cross join promo
  where services.code = 'PROMO_FONCIER'
  union all
  -- Le service classique **existant** reçoit le même ensemble — moins la
  -- pièce d'identité, qu'il exige déjà à ce stade depuis une autre date
  -- d'effet : l'exigence resterait sinon en double.
  select 'PRET_FONCIER_CLASSIQUE_ORDINAIRE', classic.doc_code, classic.min_count
  from classic
  where classic.doc_code <> 'CNI_BIOMETRIQUE'
  union all
  -- …et le lot locatif : le cahier des charges fait du locatif une
  -- extension du classique, et l'existant est le service de référence.
  select 'PRET_FONCIER_CLASSIQUE_ORDINAIRE', locatif.doc_code, locatif.min_count
  from locatif
)
insert into ref.service_document_requirement (service_code, stage, doc_type_code, required, min_count, effective_from)
select
  pieces.service_code,
  'ONBOARDING',
  pieces.doc_code,
  true,
  pieces.min_count,
  current_date
from pieces
on conflict (service_code, stage, doc_type_code, effective_from)
do update set required = excluded.required, min_count = excluded.min_count;
