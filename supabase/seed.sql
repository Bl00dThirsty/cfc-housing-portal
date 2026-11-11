-- ===========================================================================
-- CFC Housing Portal — référentiel de départ (`supabase/seed.sql`)
--
-- Ce fichier alimente le référentiel DÉCLARABLE : natures et types de
-- documents, chemises DUC, services, produits, barèmes, exigences
-- documentaires, politique de capacité d'endettement, seuils d'approbation,
-- politique de conservation — ainsi que les pôles, les rôles et la matrice
-- des habilitations.
--
-- Règles :
-- - le contenu est réinscriptible (`on conflict do update`) : le seed est
--   idempotent ;
-- - une exigence ou un barème déjà « expédié » n'est jamais réécrit en base ;
--   on ferme (`effective_to`) et on ouvre une nouvelle ligne. Ici, le seed
--   pose la première version (effective_from = current_date).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Pôles organisationnels
-- ---------------------------------------------------------------------------

insert into ref.pole (code, label, description, sort_order) values
  ('G1',       'Production des Crédits',            'Guichet Unique & Accueil : enrôlement, réception des pièces, ouverture du DUC.', 1),
  ('G2',       'Exploitation & Portefeuille Crédit', 'Instruction des dossiers, suivi de l''épargne préalable, coordination DUC.', 2),
  ('G3',       'Direction des Risques & Ingénierie', 'Contre-expertise BET, solvabilité, visites de chantier, scoring géotechnique.', 3),
  ('G4',       'Clôture, Mainlevée & Conservation',  'Décompte d''extinction, actes de mainlevée, radiation d''hypothèque, archivage.', 4),
  ('G6',       'Direction Générale & Arbitrage',     'Comités CGR/CRC, arbitrages, offres de prêt, déblocages, recouvrement.', 6),
  ('G7',       'Finances, Budget & Comptabilité',    'Décaissements échelonnés, SYSTAC, échéanciers, subventions, Subventions bonifiées.', 7),
  ('G8',       'Notariat & Affaires Juridiques',     'Conventions, hypothèque 1er rang, réquisition MINDCAF, oppositions, assurances.', 8),
  ('DIASPORA', 'Cellule Diaspora & Partenariats',    'Non-résidents, procurations, mandat limité, rapatriement SWIFT.', 9),
  ('ADMIN',    'Direction des Systèmes d''Information', 'Supervision transverse, habilitations, paramétrage du catalogue, audit.', 10)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      sort_order = excluded.sort_order,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Rôles métier, périmètre et page d'atterrissage
-- ---------------------------------------------------------------------------

insert into ref.role (code, label, description, pole_code, scope, landing_path, sort_order) values
  ('GUICHET',      'Guichetier & Accueil',              'Enrôlement, réception des pièces, vérification préliminaire et ouverture du DUC.',                 'G1',       'OWN_AGENCY',    '/admin/clients', 1),
  ('GESTIONNAIRE', 'Conseiller Clientèle',              'Instruction, suivi de l''épargne préalable et coordination du DUC.',                            'G2',       'OWN_PORTFOLIO', '/admin/clients', 2),
  ('RISQUES_BET',  'Analyste Risques & BET',            'Contre-expertise des devis DQE, études de sols et visites contradictoires BET.',             'G3',       'ALL',           '/admin/actors/risk-engineering', 3),
  ('NOTAIRE',      'Notaire Conventionné',              'Rédaction des conventions, réquisition MINDCAF et publication des hypothèques.',                'G8',       'OWN_FILES',     '/admin/actors/notary-cadastre', 4),
  ('COMITE',       'Comité de Crédit',                  'Délibérations collégiales, accords de prêts et résolutions de crédit.',                        'G6',       'ALL',           '/admin/actors/credit-committees', 5),
  ('DIASPORA',     'Chargé Diaspora & Non-Résidents',   'Dossiers des Camerounais de l''étranger, virements SWIFT et procurations.',                    'DIASPORA', 'DIASPORA_FILES','/admin/actors/agency/diaspora', 6),
  ('ADMIN',        'Administrateur Système',            'Supervision globale, gestion des habilitations, audit et paramétrage DUC.',                     'ADMIN',    'ALL',           '/admin/analytics', 7)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      pole_code = excluded.pole_code,
      scope = excluded.scope,
      landing_path = excluded.landing_path,
      sort_order = excluded.sort_order,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Matrice des habilitations
--
-- Miroir de `src/domain/policies/permissions.ts`. La base fait autorité pour
-- le RLS ; le TypeScript fait autorité pour l'interface. Les deux doivent
-- dire la même chose.
-- ---------------------------------------------------------------------------

insert into ref.role_capability (role_code, capability) values
  -- GUICHET : accueil, enrôlement, vérification préliminaire, épargne.
  ('GUICHET', 'dossier:read'),
  ('GUICHET', 'dossier:create'),
  ('GUICHET', 'dossier:update'),
  ('GUICHET', 'kyc:read'),
  ('GUICHET', 'kyc:verify'),
  ('GUICHET', 'document:read'),
  ('GUICHET', 'document:upload'),
  ('GUICHET', 'document:validate'),
  ('GUICHET', 'document:reject'),
  ('GUICHET', 'savings:read'),
  ('GUICHET', 'savings:credit'),
  ('GUICHET', 'savings:validate'),
  ('GUICHET', 'catalogue:read'),
  ('GUICHET', 'analytics:read'),

  -- GESTIONNAIRE : instruction, décision opérationnelle, épargne.
  ('GESTIONNAIRE', 'dossier:read'),
  ('GESTIONNAIRE', 'dossier:update'),
  ('GESTIONNAIRE', 'dossier:decide'),
  ('GESTIONNAIRE', 'dossier:export'),
  ('GESTIONNAIRE', 'kyc:read'),
  ('GESTIONNAIRE', 'kyc:verify'),
  ('GESTIONNAIRE', 'kyc:decide'),
  ('GESTIONNAIRE', 'document:read'),
  ('GESTIONNAIRE', 'document:upload'),
  ('GESTIONNAIRE', 'document:validate'),
  ('GESTIONNAIRE', 'document:reject'),
  ('GESTIONNAIRE', 'savings:read'),
  ('GESTIONNAIRE', 'savings:credit'),
  ('GESTIONNAIRE', 'savings:debit'),
  ('GESTIONNAIRE', 'savings:validate'),
  ('GESTIONNAIRE', 'committee:read'),
  ('GESTIONNAIRE', 'analytics:read'),

  -- RISQUES_BET : contre-expertise, lecture transverse, écriture technique.
  ('RISQUES_BET', 'dossier:read'),
  ('RISQUES_BET', 'dossier:update'),
  ('RISQUES_BET', 'kyc:read'),
  ('RISQUES_BET', 'document:read'),
  ('RISQUES_BET', 'document:upload'),
  ('RISQUES_BET', 'document:validate'),
  ('RISQUES_BET', 'savings:read'),
  ('RISQUES_BET', 'committee:read'),
  ('RISQUES_BET', 'analytics:read'),

  -- NOTAIRE : affaires juridiques, hypothèque, assurances.
  ('NOTAIRE', 'dossier:read'),
  ('NOTAIRE', 'dossier:update'),
  ('NOTAIRE', 'document:read'),
  ('NOTAIRE', 'document:upload'),
  ('NOTAIRE', 'document:validate'),
  ('NOTAIRE', 'document:reject'),
  ('NOTAIRE', 'notary:read'),
  ('NOTAIRE', 'notary:draft'),
  ('NOTAIRE', 'notary:record'),
  ('NOTAIRE', 'notary:release'),
  ('NOTAIRE', 'committee:read'),
  ('NOTAIRE', 'catalogue:read'),

  -- COMITE : arbitrage et décision collégiale.
  ('COMITE', 'dossier:read'),
  ('COMITE', 'dossier:decide'),
  ('COMITE', 'dossier:approve'),
  ('COMITE', 'dossier:export'),
  ('COMITE', 'document:read'),
  ('COMITE', 'committee:read'),
  ('COMITE', 'committee:deliberate'),
  ('COMITE', 'committee:sign'),
  ('COMITE', 'loan_offer:read'),
  ('COMITE', 'loan_offer:create'),
  ('COMITE', 'loan_offer:issue'),
  ('COMITE', 'disbursement:read'),
  ('COMITE', 'disbursement:release'),
  ('COMITE', 'recovery:read'),
  ('COMITE', 'recovery:manage'),
  ('COMITE', 'analytics:read'),
  ('COMITE', 'analytics:export'),

  -- DIASPORA : non-résidents, procurations, mandat limité.
  ('DIASPORA', 'dossier:read'),
  ('DIASPORA', 'dossier:create'),
  ('DIASPORA', 'dossier:update'),
  ('DIASPORA', 'kyc:read'),
  ('DIASPORA', 'kyc:verify'),
  ('DIASPORA', 'kyc:decide'),
  ('DIASPORA', 'document:read'),
  ('DIASPORA', 'document:upload'),
  ('DIASPORA', 'document:validate'),
  ('DIASPORA', 'document:reject'),
  ('DIASPORA', 'savings:read'),
  ('DIASPORA', 'savings:credit'),
  ('DIASPORA', 'savings:validate'),
  ('DIASPORA', 'catalogue:read'),

  -- ADMIN : supervision transverse, paramétrage du catalogue, audit.
  ('ADMIN', 'dossier:read'),
  ('ADMIN', 'dossier:create'),
  ('ADMIN', 'dossier:update'),
  ('ADMIN', 'dossier:delete'),
  ('ADMIN', 'dossier:decide'),
  ('ADMIN', 'dossier:approve'),
  ('ADMIN', 'dossier:export'),
  ('ADMIN', 'dossier:assign'),
  ('ADMIN', 'kyc:read'),
  ('ADMIN', 'kyc:verify'),
  ('ADMIN', 'kyc:decide'),
  ('ADMIN', 'kyc:escalate'),
  ('ADMIN', 'document:read'),
  ('ADMIN', 'document:upload'),
  ('ADMIN', 'document:validate'),
  ('ADMIN', 'document:reject'),
  ('ADMIN', 'savings:read'),
  ('ADMIN', 'savings:credit'),
  ('ADMIN', 'savings:debit'),
  ('ADMIN', 'savings:validate'),
  ('ADMIN', 'committee:read'),
  ('ADMIN', 'committee:deliberate'),
  ('ADMIN', 'committee:sign'),
  ('ADMIN', 'notary:read'),
  ('ADMIN', 'notary:draft'),
  ('ADMIN', 'notary:record'),
  ('ADMIN', 'notary:release'),
  ('ADMIN', 'loan_offer:read'),
  ('ADMIN', 'loan_offer:create'),
  ('ADMIN', 'loan_offer:issue'),
  ('ADMIN', 'disbursement:read'),
  ('ADMIN', 'disbursement:release'),
  ('ADMIN', 'disbursement:reconcile'),
  ('ADMIN', 'recovery:read'),
  ('ADMIN', 'recovery:manage'),
  ('ADMIN', 'catalogue:read'),
  ('ADMIN', 'catalogue:write'),
  ('ADMIN', 'analytics:read'),
  ('ADMIN', 'analytics:export'),
  ('ADMIN', 'admin:users'),
  ('ADMIN', 'admin:roles'),
  ('ADMIN', 'admin:audit')
on conflict (role_code, capability) do update
  set deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Chemises DUC
-- ---------------------------------------------------------------------------

insert into ref.chemise (code, label, description, owning_pole, sort_order) values
  ('C1', 'Identification', 'Pièces d''identification : CNI ou passeport, justificatif de domicile, état civil, revenus, plan et carnet d''épargne.', 'G1', 1),
  ('C2', 'Instruction',      'Dossier d''instruction technique : devis quantitatif estimatif, étude de sols, rapports de visite, solvabilité et scoring.', 'G3', 2),
  ('C3', 'Garanties',        'Pièces de garantie : titre foncier et son rang, conventions notariées, hypothèque de premier rang, assurances et oppositions.', 'G8', 3)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      owning_pole = excluded.owning_pole,
      sort_order = excluded.sort_order,
      deleted_at = null,
      deleted_by = null;

-- Qui lit quelle chemise. C'est une frontière d'accès, pas un onglet d'interface.
insert into ref.chemise_readable_by (chemise_code, role_code) values
  ('C1', 'GUICHET'),
  ('C1', 'GESTIONNAIRE'),
  ('C1', 'COMITE'),
  ('C1', 'DIASPORA'),
  ('C1', 'ADMIN'),
  ('C2', 'GUICHET'),
  ('C2', 'RISQUES_BET'),
  ('C2', 'COMITE'),
  ('C2', 'ADMIN'),
  ('C3', 'RISQUES_BET'),
  ('C3', 'COMITE'),
  ('C3', 'NOTAIRE'),
  ('C3', 'ADMIN')
on conflict (chemise_code, role_code) do update
  set deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Natures de documents
-- ---------------------------------------------------------------------------

insert into ref.document_nature (code, label, description, requires_issuer_check, requires_validity_check, requires_human_review, sort_order) values
  ('IDENTITE',   'Identité',            'Pièce d''état civil ou titre de voyage identifiant le candidat.',            true,  true,  true,  1),
  ('RESIDENCE',  'Résidence',           'Justificatif de domicile ou de résidence effective.',                       true,  false, true,  2),
  ('REVENU',     'Revenus',             'Justificatifs de revenus : bulletins de salaire, attestations, relevés.',     true,  true,  false, 3),
  ('PATRIMOINE', 'Patrimoine',          'Déclaration de patrimoine, titres et biens détenus.',                      false, false, true,  4),
  ('FONCIER',    'Foncier',             'Titre foncier, certificat de propriété, documents cadastraux.',           true,  true,  true,  5),
  ('TECHNIQUE',  'Technique',           'Études et devis d''œuvre : BET, plans, permis de bâtir.',                 true,  false, true,  6),
  ('GARANTIE',   'Garantie',            'Conventions notariées, hypothèques, polices d''assurance.',                true,  true,  true,  7),
  ('MANDAT',     'Mandat',              'Procurations, mandats limités et attestations de conformité.',             true,  true,  true,  8),
  ('CONFORMITE', 'Conformité',          'Attestations de conformité banker et documents d''état pour non-résidents.',  true,  true,  true,  9)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      requires_issuer_check = excluded.requires_issuer_check,
      requires_validity_check = excluded.requires_validity_check,
      requires_human_review = excluded.requires_human_review,
      sort_order = excluded.sort_order,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Catalogue documentaire
-- ---------------------------------------------------------------------------

insert into ref.document_type (
  code, nature_code, label, issuing_authority, issuing_country, validity_months,
  renewal_reminder_days, accepted_mime, max_size_bytes, min_count, max_count,
  standalone_ok, requires_signature, requires_photograph, valid_from
) values
  ('CNI_BIOMETRIQUE',        'IDENTITE',   'Carte Nationale d''Identité biométrique',  'DGSN',                              'CM', 120, 30, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  false, true,  current_date),
  ('PASSPORT',               'IDENTITE',   'Passeport',                              'Ministère des Affaires Étrangères', 'CM', 60,  30, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  false, true,  current_date),
  ('BIRTH_CERTIFICATE',      'IDENTITE',   'Certificat de naissance (état civil)',   'Mairie / Tribunal',                  'CM', null, null, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  false, current_date),
  ('PROOF_OF_RESIDENCE',     'RESIDENCE',  'Justificatif de domicile',               'CFC, bailleur, unité administrative','CM', 6,   15, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  false, false, current_date),
  ('PAYSLIP',                'REVENU',     'Bulletin de salaire',                   'Employeur',                         'CM', 3,   15, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 3, false, false, false, current_date),
  ('INCOME_ATTESTATION',     'REVENU',     'Attestation de revenu',                 'Employeur, CFP, tyres entrepreneurs','CM', 3,  15, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  false, current_date),
  ('BANK_STATEMENT',         'REVENU',     'Relevé bancaire d''activité',           'Banque',                            'CM', 3,   15, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 3, false, false, false, current_date),
  ('WEALTH_DECLARATION',     'PATRIMOINE', 'Déclaration de patrimoine',              'Candidat',                          'CM', 6,   30, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  false, current_date),
  ('LAND_TITLE',             'FONCIER',    'Titre foncier',                         'Conservation Foncière / MINDCAF',    'CM', null, null, array['application/pdf','image/jpeg','image/png']::text[], 20971520, 1, 1, true,  true,  false, current_date),
  ('PROPERTY_CERTIFICATE',   'FONCIER',    'Certificat de propriété foncière',      'Service domanial',                  'CM', 3,   30, array['application/pdf','image/jpeg','image/png']::text[], 20971520, 1, 1, true,  true,  false, current_date),
  ('BET_DQE',                'TECHNIQUE',  'Devis Quantitatif Estimatif (BET)',      'Bureau d''études agréé',            'CM', 6,   30, array['application/pdf','image/jpeg','image/png']::text[], 20971520, 1, 1, true,  true,  false, current_date),
  ('SITE_REPORT',            'TECHNIQUE',  'Rapport de visite de chantier',          'Bureau d''études agréé',            'CM', 6,   30, array['application/pdf','image/jpeg','image/png']::text[], 20971520, 1, 1, true,  true,  false, current_date),
  ('BUILD_PERMIT',           'TECHNIQUE',  'Permis de bâtir / certificat d''urbanisme','Mairie, Communauté urbaine',     'CM', 12,  60, array['application/pdf','image/jpeg','image/png']::text[], 20971520, 1, 1, true,  true,  false, current_date),
  ('MORTGAGE_CONVENTION',    'GARANTIE',   'Convention hypothécaire',               'Notaire',                           'CM', null, null, array['application/pdf']::text[], 20971520, 1, 1, true,  true,  false, current_date),
  ('LIFE_DISABILITY_INSURANCE','GARANTIE', 'Attestation d''assurance vie-invalidité','Compagnie d''assurance agréée',      'CM', 12,  60, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  false, current_date),
  ('FIRE_INSURANCE',         'GARANTIE',   'Attestation d''assurance incendie',     'Compagnie d''assurance agréée',      'CM', 12,  60, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  false, current_date),
  ('COMPLIANCE_CERTIFICATE', 'CONFORMITE', 'Attestation de conformité (non-résident)','Banque du pays de résidence',       'CM', 3,   15, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  false, current_date),
  ('LIMITED_MANDATE',        'MANDAT',     'Mandat limité / procuration',           'Candidat ou mandataire',             'CM', 12,  30, array['application/pdf','image/jpeg','image/png']::text[], 10485760, 1, 1, true,  true,  true,  current_date)
on conflict (code) do update
  set nature_code = excluded.nature_code,
      label = excluded.label,
      issuing_authority = excluded.issuing_authority,
      issuing_country = excluded.issuing_country,
      validity_months = excluded.validity_months,
      renewal_reminder_days = excluded.renewal_reminder_days,
      accepted_mime = excluded.accepted_mime,
      max_size_bytes = excluded.max_size_bytes,
      min_count = excluded.min_count,
      max_count = excluded.max_count,
      standalone_ok = excluded.standalone_ok,
      requires_signature = excluded.requires_signature,
      requires_photograph = excluded.requires_photograph,
      deleted_at = null,
      deleted_by = null;

-- Équivalences : un passeport remplace une CNI, un relevé remplace un bulletin.
insert into ref.document_type_equivalent (from_code, to_code) values
  ('PASSPORT', 'CNI_BIOMETRIQUE'),
  ('BIRTH_CERTIFICATE', 'CNI_BIOMETRIQUE'),
  ('INCOME_ATTESTATION', 'PAYSLIP'),
  ('BANK_STATEMENT', 'PAYSLIP')
on conflict (from_code, to_code) do update
  set deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Catalogue de services
-- ---------------------------------------------------------------------------

insert into ref.service (code, label, description, is_active, sort_order) values
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE',      'Prêt Foncier Classique — Particulier',      'Construction ou acquisition d''un logement en propre, parcours standard.', true, 1),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL',   'Prêt Foncier Classique — Professionnel',    'Prêt pour un investisseur ou un promoteur, avec ratio d''apport renforcé.', true, 2),
  ('PRET_LOTISSEMENT',                      'Prêt Lotissement',                           'Achat de terrain nu puis construction par phases, avec déblocage par tranche.', true, 3),
  ('CREDIT_SOLIDAIRE',                      'Crédit Solidaire',                           'Prêt à taux bonifié destiné aux ménages modestes et aux zones prioritaires.', true, 4)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Produits et barèmes
-- ---------------------------------------------------------------------------

insert into ref.product (code, label, description, service_code, loan_ceiling, min_apport_percent, max_duration_years, is_active, sort_order) values
  ('PFC_ORD_15',      'Prêt Foncier Classique Ordinaire — 15 ans', 'Barème standard, taux bonifié selon l''apport.',            'PRET_FONCIER_CLASSIQUE_ORDINAIRE',    35000000, 20.00, 15, true, 1),
  ('PFC_ORD_20',      'Prêt Foncier Classique Ordinaire — 20 ans', 'Barème standard, durée allongée.',                          'PRET_FONCIER_CLASSIQUE_ORDINAIRE',    25000000, 25.00, 20, true, 2),
  ('PFC_PROMO_15',    'Prêt Foncier Classique Professionnel',       'Investissement locatif ou revente, contrôle renforcé.',      'PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 60000000, 30.00, 15, true, 3),
  ('PFC_LOT_10',      'Prêt Lotissement',                           'Terrain nu puis construction, déblocage par tranche.',        'PRET_LOTISSEMENT',                    20000000, 20.00, 10, true, 4),
  ('PFC_SOLIDAIRE',   'Crédit Solidaire',                           'Taux bonifié, zones prioritaires, pièces allégées.',        'CREDIT_SOLIDAIRE',                    10000000, 10.00, 15, true, 5)
on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      service_code = excluded.service_code,
      loan_ceiling = excluded.loan_ceiling,
      min_apport_percent = excluded.min_apport_percent,
      max_duration_years = excluded.max_duration_years,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order,
      deleted_at = null,
      deleted_by = null;

insert into ref.product_rate (product_code, rate_code, label, annual_rate, duration_years, savings_rate, valid_from) values
  ('PFC_ORD_15',    'TAUX_BONIFIE',  'Taux bonifié',  5.25, 15, 3.50, current_date),
  ('PFC_ORD_15',    'TAUX_STANDARD', 'Taux standard', 5.75, 15, 3.50, current_date),
  ('PFC_ORD_20',    'TAUX_BONIFIE',  'Taux bonifié',  5.50, 20, 3.50, current_date),
  ('PFC_ORD_20',    'TAUX_STANDARD', 'Taux standard', 6.00, 20, 3.50, current_date),
  ('PFC_PROMO_15',  'TAUX_STANDARD', 'Taux standard', 6.25, 15, 3.00, current_date),
  ('PFC_LOT_10',    'TAUX_STANDARD', 'Taux standard', 6.00, 10, 3.50, current_date),
  ('PFC_SOLIDAIRE', 'TAUX_SOLIDAIRE','Taux solidaire',5.00, 15, 4.00, current_date)
on conflict (product_code, rate_code, duration_years, valid_from) where deleted_at is null do update
  set label = excluded.label,
      annual_rate = excluded.annual_rate,
      savings_rate = excluded.savings_rate,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Exigences documentaires par service et par étape
-- ---------------------------------------------------------------------------

insert into ref.service_document_requirement (
  service_code, stage, doc_type_code, required, min_count, max_count,
  alternative_group, condition_expr, depends_on_doc, effective_from
) values
  -- Prêt foncier classique ordinaire
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'ONBOARDING', 'CNI_BIOMETRIQUE',        true,  1, 1, 'IDENTITY', 'citizen.affiliation_status <> ''non_resident''', null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'ONBOARDING', 'PASSPORT',               false, 1, 1, 'IDENTITY', 'citizen.affiliation_status = ''non_resident''', null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'ONBOARDING', 'PROOF_OF_RESIDENCE',     true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'SAVINGS',    'PAYSLIP',                true,  1, 3, 'REVENUS', null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'CREDIT_FILE','INCOME_ATTESTATION',     true,  1, 1, 'REVENUS', null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'CREDIT_FILE','WEALTH_DECLARATION',     true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'CREDIT_FILE','LAND_TITLE',             true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'CREDIT_FILE','BET_DQE',                true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'CREDIT_FILE','SITE_REPORT',            false, 1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'CREDIT_FILE','BUILD_PERMIT',           false, 1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'NOTARY',      'MORTGAGE_CONVENTION',    true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'MORTGAGE',    'FIRE_INSURANCE',         true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'MORTGAGE',    'LIFE_DISABILITY_INSURANCE', true, 1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'DISBURSEMENT','BUILD_PERMIT',           true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE', 'PAYOFF',      'MORTGAGE_CONVENTION',    true,  1, 1, null, null, null, current_date),

  -- Prêt foncier classique professionnel
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'ONBOARDING', 'CNI_BIOMETRIQUE',       true,  1, 1, 'IDENTITY', null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'ONBOARDING', 'PROOF_OF_RESIDENCE',    true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'ONBOARDING', 'WEALTH_DECLARATION',    true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'CREDIT_FILE','INCOME_ATTESTATION',    true,  1, 1, 'REVENUS', null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'CREDIT_FILE','BANK_STATEMENT',        true,  1, 3, 'REVENUS', null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'CREDIT_FILE','LAND_TITLE',            true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'CREDIT_FILE','BET_DQE',               true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'CREDIT_FILE','SITE_REPORT',           true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'NOTARY',      'MORTGAGE_CONVENTION',   true,  1, 1, null, null, null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'MORTGAGE',    'FIRE_INSURANCE',        true,  1, 1, null, null, null, current_date),

  -- Prêt lotissement
  ('PRET_LOTISSEMENT', 'ONBOARDING', 'CNI_BIOMETRIQUE',           true, 1, 1, 'IDENTITY', null, null, current_date),
  ('PRET_LOTISSEMENT', 'ONBOARDING', 'PROOF_OF_RESIDENCE',        true, 1, 1, null, null, null, current_date),
  ('PRET_LOTISSEMENT', 'CREDIT_FILE','INCOME_ATTESTATION',        true, 1, 1, 'REVENUS', null, null, current_date),
  ('PRET_LOTISSEMENT', 'CREDIT_FILE','LAND_TITLE',                true, 1, 1, null, null, null, current_date),
  ('PRET_LOTISSEMENT', 'CREDIT_FILE','BET_DQE',                   true, 1, 1, null, null, null, current_date),
  ('PRET_LOTISSEMENT', 'DISBURSEMENT','BUILD_PERMIT',              true, 1, 1, null, null, null, current_date),
  ('PRET_LOTISSEMENT', 'MORTGAGE',    'FIRE_INSURANCE',            true, 1, 1, null, null, null, current_date),
  ('PRET_LOTISSEMENT', 'MORTGAGE',    'LIFE_DISABILITY_INSURANCE', true, 1, 1, null, null, null, current_date),

  -- Crédit solidaire
  ('CREDIT_SOLIDAIRE', 'ONBOARDING', 'CNI_BIOMETRIQUE',        true, 1, 1, 'IDENTITY', null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'ONBOARDING', 'PROOF_OF_RESIDENCE',     true, 1, 1, null, null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'SAVINGS',    'PAYSLIP',                true, 1, 3, 'REVENUS', null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'CREDIT_FILE','INCOME_ATTESTATION',     true, 1, 1, 'REVENUS', null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'CREDIT_FILE','WEALTH_DECLARATION',     false, 1, 1, null, null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'CREDIT_FILE','LAND_TITLE',             true, 1, 1, null, null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'CREDIT_FILE','BET_DQE',                true, 1, 1, null, null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'NOTARY',      'MORTGAGE_CONVENTION',   true, 1, 1, null, null, null, current_date),
  ('CREDIT_SOLIDAIRE', 'MORTGAGE',    'FIRE_INSURANCE',        true, 1, 1, null, null, null, current_date),

  -- Non-résidents : dossier renforcé (EDD) — commun à tous les services
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE',    'ONBOARDING', 'COMPLIANCE_CERTIFICATE', true, 1, 1, null, 'citizen.affiliation_status = ''non_resident''', null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'ONBOARDING', 'COMPLIANCE_CERTIFICATE', true, 1, 1, null, 'citizen.affiliation_status = ''non_resident''', null, current_date),
  ('PRET_LOTISSEMENT',                    'ONBOARDING', 'COMPLIANCE_CERTIFICATE', true, 1, 1, null, 'citizen.affiliation_status = ''non_resident''', null, current_date),
  ('CREDIT_SOLIDAIRE',                    'ONBOARDING', 'COMPLIANCE_CERTIFICATE', true, 1, 1, null, 'citizen.affiliation_status = ''non_resident''', null, current_date),

  -- Mandat limité : obligatoire dès qu'un mandataire agit pour le client
  ('PRET_FONCIER_CLASSIQUE_ORDINAIRE',    'ONBOARDING', 'LIMITED_MANDATE', false, 1, 1, null, 'citizen.affiliation_status = ''non_resident''', null, current_date),
  ('PRET_FONCIER_CLASSIQUE_PROMOTIONNEL', 'ONBOARDING', 'LIMITED_MANDATE', false, 1, 1, null, 'citizen.affiliation_status = ''non_resident''', null, current_date)
on conflict (service_code, stage, doc_type_code, effective_from) do update
  set required = excluded.required,
      min_count = excluded.min_count,
      max_count = excluded.max_count,
      alternative_group = excluded.alternative_group,
      condition_expr = excluded.condition_expr,
      depends_on_doc = excluded.depends_on_doc,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Politique de capacité d'endettement (versionnée)
--
-- Aucun seuil réglementaire COBAC n'existe : le « 33 % » est une politique
-- institutionnelle CFC, déclinée en deux paliers (33 % et 40 %) selon le
-- Guide Pratique du Prêt Foncier Classique.
-- ---------------------------------------------------------------------------

insert into ref.debt_capacity_policy (code, label, description, max_debt_ratio, applies_to, effective_from) values
  ('DTI_33', 'Capacité d''endettement — palier 33 %', 'Ratio dette / revenu mensuel maximal retenu par CFC. Politique institutionnelle, non réglementaire.', 33.00, 'ALL', current_date),
  ('DTI_40', 'Capacité d''endettement — palier 40 %', 'Palier majoré applicable aux promoteurs et programmes encadrés.', 40.00, 'PROMOTIONNEL', current_date)
on conflict (code, effective_from) do update
  set label = excluded.label,
      description = excluded.description,
      max_debt_ratio = excluded.max_debt_ratio,
      applies_to = excluded.applies_to,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Seuils d'approbation
-- ---------------------------------------------------------------------------

insert into ref.approval_threshold (code, label, committee_code, min_amount, max_amount, required_signatures, effective_from) values
  ('CGR_DELEGATION',  'Délégation CGR — jusqu''à 10 M',   'CGR',       0,        10000000, 1, current_date),
  ('CRC_ARBITRAGE',  'Arbitrage CRC — de 10 à 25 M',    'CRC',       10000000, 25000000, 2, current_date),
  ('PCA_INSTITUTIONNEL','Dossiers institutionnels — PCA', 'PCA',      25000000, null,      3, current_date)
on conflict (code, effective_from) do update
  set label = excluded.label,
      committee_code = excluded.committee_code,
      min_amount = excluded.min_amount,
      max_amount = excluded.max_amount,
      required_signatures = excluded.required_signatures,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Politique de conservation
-- ---------------------------------------------------------------------------

insert into ref.retention_policy (code, label, document_type_code, stage, retention_years, archive_after_years, legal_basis, effective_from) values
  ('RET_DOSSIER_DEFAULT', 'Conservation de dossier — 10 ans', null, null, 10, 5, 'Code civil : prescription des actions personnelles et mobilières', current_date),
  ('RET_KYC',             'Conservation des pièces KYC — 10 ans', 'CNI_BIOMETRIQUE', 'ONBOARDING', 10, 5, 'R-2023/01 — lutte contre le blanchiment', current_date),
  ('RET_NOTARIAL',        'Conservation des actes et hypothèques — 30 ans', null, 'NOTARY', 30, 10, 'Code civil : archives notariales', current_date),
  ('RET_CREDIT',          'Conservation des pièces de crédit — 10 ans', null, 'CREDIT_FILE', 10, 5, 'COBAC R-2001/07 — documentation des crédits', current_date)
on conflict (code, effective_from) do update
  set label = excluded.label,
      document_type_code = excluded.document_type_code,
      stage = excluded.stage,
      retention_years = excluded.retention_years,
      archive_after_years = excluded.archive_after_years,
      legal_basis = excluded.legal_basis,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Agences (référentiel minimal ; l'import des agences réelles est un
-- traitement de fond)
-- ---------------------------------------------------------------------------

insert into public.agencies (code, label, city, region, country, is_diaspora_desk) values
  ('CFC-YDE-CENTRE',  'Agence Yaoundé Centre',   'Yaoundé', 'Centre (Yaoundé)',  'CM', false),
  ('CFC-YDE-MENDONG', 'Agence Yaoundé Mendong',  'Yaoundé', 'Centre (Yaoundé)',  'CM', false),
  ('CFC-YDE-OLEMBE',  'Agence Yaoundé Olembé',   'Yaoundé', 'Centre (Yaoundé)',  'CM', false),
  ('CFC-DLA-BONANJO', 'Agence Douala Bonanjo',  'Douala',   'Littoral (Douala)', 'CM', false),
  ('CFC-BAF-OUSSAM',  'Agence Bafoussam',        'Bafoussam','Ouest (Bafoussam)', 'CM', false),
  ('CFC-SIEGE-DIASPORA', 'Pôle International Siège', 'Yaoundé', 'Centre (Yaoundé)', 'CM', true)
on conflict (code) where deleted_at is null do update
  set label = excluded.label,
      city = excluded.city,
      region = excluded.region,
      country = excluded.country,
      is_diaspora_desk = excluded.is_diaspora_desk,
      deleted_at = null,
      deleted_by = null;

-- ---------------------------------------------------------------------------
-- Catalogue des modèles d'e-mail (version 1)
-- ---------------------------------------------------------------------------
--
-- Chaque code correspond à un événement métier du produit. Les modèles sont
-- rédigés en français, avec l'identité CFC, des styles **en ligne** (les
-- clients e-mail ignorent les blocs `<style>`) et un appel à l'action.
--
-- Versionnement : le seed pose la **première version** (version 1,
-- `effective_from = current_date`). Il ne réécrit **jamais** une version
-- existante (`on conflict do nothing`) : passé la première publication, le
-- catalogue appartient à l'administrateur, qui édite en ouvrant une version
-- nouvelle. La version 1 reste dans l'historique.

with email_shell as (
  select
    $shell$<div style="margin:0;padding:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #d8e0e8;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#0f5132;padding:22px 28px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:bold;color:#ffffff;letter-spacing:0.4px;">Crédit Foncier du Cameroun</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#cfe3d8;padding-top:3px;">CFC Habitat — Épargne, Crédit Foncier et Garanties</div>
        </td></tr>
        <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#1f2937;">$shell$ as header,
    $shell$</td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#64748b;">
          <strong style="color:#334155;">Crédit Foncier du Cameroun</strong> — Direction Générale · Yaoundé, Cameroun<br />
          Ce message est généré automatiquement : merci de ne pas y répondre directement.<br />
          Pour toute question, rapprochez-vous de votre agence CFC ou de votre conseiller au Guichet Unique.
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>$shell$ as footer
),
email_templates (code, label, subject_template, event_type, audience, variables, html_body, text_body) as (
  values
  (
    'WELCOME',
    'Bienvenue — création de compte',
    $s$Bienvenue chez CFC Habitat, {{prenom}}$s$,
    'PROFILE_CREATED',
    'citizen',
    array['prenom', 'nom', 'email', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Bienvenue chez CFC Habitat</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Votre compte citoyen a bien été créé auprès du Crédit Foncier du Cameroun. Il vous permet de déposer votre dossier de crédit, de constituer votre épargne habitat et de suivre l'avancement de votre instruction.</p>
<p style="margin:0 0 14px 0;">Un conseiller CFC vous contactera pour finaliser l'ouverture de votre Dossier Unique Client (DUC). Vous pouvez d'ores et déjà déposer vos pièces justificatives depuis votre portail.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Accéder à mon portail</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>
<p style="margin:18px 0 0 0;font-size:12px;color:#64748b;">Si vous n'êtes pas à l'origine de cette création de compte, merci de contacter sans délai votre agence CFC.</p>$html$,
    $txt$Bienvenue chez CFC Habitat

Bonjour {{prenom}} {{nom}},

Votre compte citoyen a bien été créé auprès du Crédit Foncier du Cameroun. Il vous permet de déposer votre dossier de crédit, de constituer votre épargne habitat et de suivre l'avancement de votre instruction.

Un conseiller CFC vous contactera pour finaliser l'ouverture de votre Dossier Unique Client (DUC). Vous pouvez d'ores et déjà déposer vos pièces justificatives depuis votre portail.

Accéder à mon portail : {{lien}}

Si vous n'êtes pas à l'origine de cette création de compte, merci de contacter sans délai votre agence CFC.

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'MAGIC_LINK',
    'Lien de connexion au portail',
    $s$Votre lien de connexion au portail CFC Habitat$s$,
    'MAGIC_LINK_REQUESTED',
    'citizen',
    array['prenom', 'nom', 'lien', 'date', 'duree'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre lien de connexion</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Vous avez demandé un lien de connexion au portail CFC Habitat, sans mot de passe. Ce lien est à usage unique et n'est valable que {{duree}}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Me connecter</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>
<p style="margin:18px 0 0 0;font-size:12px;color:#64748b;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre compte n'a pas été modifié.</p>$html$,
    $txt$Votre lien de connexion au portail CFC Habitat

Bonjour {{prenom}} {{nom}},

Vous avez demandé un lien de connexion au portail CFC Habitat, sans mot de passe. Ce lien est à usage unique et n'est valable que {{duree}}.

Me connecter : {{lien}}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre compte n'a pas été modifié.

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'RESET_PASSWORD',
    'Réinitialisation du mot de passe',
    $s$Réinitialisation de votre mot de passe CFC Habitat$s$,
    'PASSWORD_RESET_REQUESTED',
    'citizen',
    array['prenom', 'nom', 'lien', 'date', 'duree'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Réinitialisation de votre mot de passe</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Une réinitialisation de mot de passe a été demandée le {{date}} pour votre compte CFC Habitat. Le lien ci-dessous est à usage unique et n'est valable que {{duree}}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Choisir un nouveau mot de passe</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>
<p style="margin:18px 0 0 0;font-size:12px;color:#64748b;">Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise : votre mot de passe actuel reste valable.</p>$html$,
    $txt$Réinitialisation de votre mot de passe

Bonjour {{prenom}} {{nom}},

Une réinitialisation de mot de passe a été demandée le {{date}} pour votre compte CFC Habitat. Le lien ci-dessous est à usage unique et n'est valable que {{duree}}.

Choisir un nouveau mot de passe : {{lien}}

Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise : votre mot de passe actuel reste valable.

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'KYC_SUBMITTED',
    'Dépôt du dossier KYC',
    $s$Votre dossier KYC a bien été reçu — {{reference}}$s$,
    'KYC_SUBMITTED',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre dossier KYC a bien été reçu</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Nous avons bien enregistré votre dossier d'identité le {{date}} :</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#334155;">
<strong>Référence :</strong> {{reference}}<br />
<strong>Dossier unique client :</strong> {{duc}}
</td></tr></table>
<p style="margin:0 0 14px 0;">Un conseiller du Guichet Unique va maintenant vérifier vos pièces et vous adressera, le cas échéant, les demandes de complément.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Suivre mon dossier</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Votre dossier KYC a bien été reçu

Bonjour {{prenom}} {{nom}},

Nous avons bien enregistré votre dossier d'identité le {{date}}.

Référence : {{reference}}
Dossier unique client : {{duc}}

Un conseiller du Guichet Unique va maintenant vérifier vos pièces et vous adressera, le cas échéant, les demandes de complément.

Suivre mon dossier : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'KYC_APPROVED',
    'KYC approuvé',
    $s$Votre dossier KYC est approuvé — {{reference}}$s$,
    'KYC_APPROVED',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre dossier KYC est approuvé</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">La vérification de vos pièces d'identité est terminée : votre dossier a été approuvé le {{date}}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#334155;">
<strong>Référence :</strong> {{reference}}<br />
<strong>Dossier unique client :</strong> {{duc}}
</td></tr></table>
<p style="margin:0 0 14px 0;">Vous pouvez désormais poursuivre votre demande de crédit. Notre équipe vous contactera pour la suite de l'instruction.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Continuer ma demande</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Votre dossier KYC est approuvé

Bonjour {{prenom}} {{nom}},

La vérification de vos pièces d'identité est terminée : votre dossier a été approuvé le {{date}}.

Référence : {{reference}}
Dossier unique client : {{duc}}

Vous pouvez désormais poursuivre votre demande de crédit. Notre équipe vous contactera pour la suite de l'instruction.

Continuer ma demande : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'KYC_REJECTED',
    'KYC refusé — corrections demandées',
    $s$Votre dossier KYC doit être corrigé — {{reference}}$s$,
    'KYC_REJECTED',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'date', 'motif', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre dossier KYC doit être corrigé</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">La vérification de votre dossier d'identité, le {{date}}, n'a pas pu aboutir. Il vous manque des éléments pour poursuivre l'instruction.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#fff7ed;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#7c2d12;">
<strong>Motif :</strong> {{motif}}<br />
<strong>Référence :</strong> {{reference}} — DUC {{duc}}
</td></tr></table>
<p style="margin:0 0 14px 0;">Merci de déposer les pièces complémentaires depuis votre portail : votre dossier sera réexaminé dès réception.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Corriger mon dossier</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Votre dossier KYC doit être corrigé

Bonjour {{prenom}} {{nom}},

La vérification de votre dossier d'identité, le {{date}}, n'a pas pu aboutir. Il vous manque des éléments pour poursuivre l'instruction.

Motif : {{motif}}
Référence : {{reference}} — DUC {{duc}}

Merci de déposer les pièces complémentaires depuis votre portail : votre dossier sera réexaminé dès réception.

Corriger mon dossier : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'DOCUMENT_REQUESTED',
    'Pièce justificative demandée',
    $s$Une pièce justificative vous est demandée — {{document}}$s$,
    'DOCUMENT_REQUESTED',
    'citizen',
    array['prenom', 'nom', 'duc', 'document', 'reference', 'date', 'echeance', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Une pièce justificative vous est demandée</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Le service instructeur de la CFC a besoin d'un complément au dossier {{duc}} (référence {{reference}}) pour poursuivre l'instruction.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#334155;">
<strong>Pièce demandée :</strong> {{document}}<br />
<strong>Date limite de dépôt :</strong> {{echeance}}
</td></tr></table>
<p style="margin:0 0 14px 0;">Le dépôt se fait directement depuis votre portail, au format PDF, JPEG ou PNG (20 Mo maximum par pièce).</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Déposer la pièce</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Une pièce justificative vous est demandée

Bonjour {{prenom}} {{nom}},

Le service instructeur de la CFC a besoin d'un complément au dossier {{duc}} (référence {{reference}}) pour poursuivre l'instruction.

Pièce demandée : {{document}}
Date limite de dépôt : {{echeance}}

Le dépôt se fait directement depuis votre portail, au format PDF, JPEG ou PNG (20 Mo maximum par pièce).

Déposer la pièce : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'COMMITTEE_DECISION',
    'Décision de comité de crédit',
    $s$Décision du comité de crédit — {{decision}}$s$,
    'COMMITTEE_DECISION',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'decision', 'montant', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Décision du comité de crédit</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Le comité de crédit s'est prononcé le {{date}} sur votre dossier {{duc}} (référence {{reference}}).</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#334155;">
<strong>Décision :</strong> {{decision}}<br />
<strong>Montant retenu :</strong> {{montant}}
</td></tr></table>
<p style="margin:0 0 14px 0;">Le détail de la décision et les prochaines étapes sont disponibles dans votre dossier.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Consulter mon dossier</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Décision du comité de crédit

Bonjour {{prenom}} {{nom}},

Le comité de crédit s'est prononcé le {{date}} sur votre dossier {{duc}} (référence {{reference}}).

Décision : {{decision}}
Montant retenu : {{montant}}

Le détail de la décision et les prochaines étapes sont disponibles dans votre dossier.

Consulter mon dossier : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'LOAN_OFFER_ISSUED',
    'Offre de prêt émise',
    $s$Votre offre de prêt est disponible — {{montant}}$s$,
    'LOAN_OFFER_ISSUED',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'montant', 'taux', 'echeance', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre offre de prêt est disponible</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Une offre de prêt a été émise le {{date}} sur votre dossier {{duc}} (référence {{reference}}).</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#334155;">
<strong>Montant :</strong> {{montant}}<br />
<strong>Taux d'intérêt :</strong> {{taux}}<br />
<strong>Échéance mensuelle :</strong> {{echeance}}
</td></tr></table>
<p style="margin:0 0 14px 0;">L'offre est valable sous réserve de la production des pièces définitives et de la signature de la convention de crédit. Elle est consultable et téléchargeable depuis votre portail.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Consulter mon offre de prêt</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Votre offre de prêt est disponible

Bonjour {{prenom}} {{nom}},

Une offre de prêt a été émise le {{date}} sur votre dossier {{duc}} (référence {{reference}}).

Montant : {{montant}}
Taux d'intérêt : {{taux}}
Échéance mensuelle : {{echeance}}

L'offre est valable sous réserve de la production des pièces définitives et de la signature de la convention de crédit. Elle est consultable et téléchargeable depuis votre portail.

Consulter mon offre de prêt : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'DISBURSEMENT_RELEASED',
    'Décaissement effectué',
    $s$Décaissement effectué — {{montant}}$s$,
    'DISBURSEMENT_RELEASED',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'montant', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Décaissement effectué</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Le décaissement de {{montant}} a été effectué le {{date}} sur votre dossier {{duc}} (référence {{reference}}).</p>
<p style="margin:0 0 14px 0;">Le montant a été viré sur le compte bancaire que vous avez communiqué à votre conseiller. Les justificatifs de versement sont consultables dans votre dossier.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Consulter mes décaissements</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Décaissement effectué

Bonjour {{prenom}} {{nom}},

Le décaissement de {{montant}} a été effectué le {{date}} sur votre dossier {{duc}} (référence {{reference}}).

Le montant a été viré sur le compte bancaire que vous avez communiqué à votre conseiller. Les justificatifs de versement sont consultables dans votre dossier.

Consulter mes décaissements : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'PAYOFF_STATEMENT',
    'Décompte d''extinction',
    $s$Votre décompte d'extinction est disponible — {{montant}}$s$,
    'PAYOFF_STATEMENT',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'montant', 'echeance', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre décompte d'extinction</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Le décompte d'extinction de votre prêt (dossier {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
<tr><td style="padding:12px 16px;font-size:13px;line-height:1.7;color:#334155;">
<strong>Montant à solder :</strong> {{montant}}<br />
<strong>Échéance limite :</strong> {{echeance}}
</td></tr></table>
<p style="margin:0 0 14px 0;">Le solde reste dû jusqu'à extinction du capital et des intérêts. Passé cette date, des pénalités de retard peuvent être appliquées.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Télécharger mon décompte</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Votre décompte d'extinction

Bonjour {{prenom}} {{nom}},

Le décompte d'extinction de votre prêt (dossier {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.

Montant à solder : {{montant}}
Échéance limite : {{echeance}}

Le solde reste dû jusqu'à extinction du capital et des intérêts. Passé cette date, des pénalités de retard peuvent être appliquées.

Télécharger mon décompte : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'MAINLEVEE_READY',
    'Mainlevée hypothécaire disponible',
    $s$Votre mainlevée hypothécaire est disponible — {{reference}}$s$,
    'MAINLEVEE_READY',
    'citizen',
    array['prenom', 'nom', 'duc', 'reference', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Votre mainlevée hypothécaire est disponible</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">L'acte de mainlevée de l'hypothèque de votre dossier {{duc}} (référence {{reference}}) est disponible depuis le {{date}}.</p>
<p style="margin:0 0 14px 0;">La radiation de l'inscription au registre du Conservation foncier suit l'enregistrement de l'acte. Le titre foncier original vous sera restitué par votre conseiller.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Consulter mon dossier</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Votre mainlevée hypothécaire est disponible

Bonjour {{prenom}} {{nom}},

L'acte de mainlevée de l'hypothèque de votre dossier {{duc}} (référence {{reference}}) est disponible depuis le {{date}}.

La radiation de l'inscription au registre du Conservation foncier suit l'enregistrement de l'acte. Le titre foncier original vous sera restitué par votre conseiller.

Consulter mon dossier : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  ),
  (
    'SAVE_CONTACT',
    'Prise de contact — épargne habitat',
    $s$Nous vous recontactons au sujet de votre épargne habitat$s$,
    'SAVE_CONTACT',
    'citizen',
    array['prenom', 'nom', 'email', 'telephone', 'date', 'lien'],
    $html$<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:#0f5132;">Prise de contact — épargne habitat</p>
<p style="margin:0 0 14px 0;">Bonjour {{prenom}} {{nom}},</p>
<p style="margin:0 0 14px 0;">Un conseiller CFC vous contacte le {{date}} au sujet de votre épargne habitat et de votre projet d'accessibilité à la propriété.</p>
<p style="margin:0 0 14px 0;">Vous pouvez le rappeler au {{telephone}}. Pour votre confort, le CFC organise également des rendez-vous en agence, du lundi au vendredi de 08h00 à 16h00.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px 0;"><tr><td style="background:#0f5132;border-radius:6px;"><a href="{{lien}}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Ouvrir mon portail</a></td></tr></table>
<p style="margin:0 0 14px 0;font-size:12px;color:#64748b;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />{{lien}}</p>$html$,
    $txt$Prise de contact — épargne habitat

Bonjour {{prenom}} {{nom}},

Un conseiller CFC vous contacte le {{date}} au sujet de votre épargne habitat et de votre projet d'accessibilité à la propriété.

Vous pouvez le rappeler au {{telephone}}. Pour votre confort, le CFC organise également des rendez-vous en agence, du lundi au vendredi de 08h00 à 16h00.

Ouvrir mon portail : {{lien}}

--
Crédit Foncier du Cameroun — Direction Générale$txt$
  )
)
insert into ref.email_template (
  code, version, label, subject_template, html_template, text_template,
  event_type, audience, is_active, variables, effective_from, effective_to
)
select
  t.code,
  1,
  t.label,
  t.subject_template,
  s.header || t.html_body || s.footer,
  t.text_body,
  t.event_type,
  t.audience,
  true,
  t.variables,
  current_date,
  null
from email_templates t
cross join email_shell s
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Relais base → application
-- ---------------------------------------------------------------------------
--
-- Ligne unique (id = 1). Désactivée par défaut : le relais ne part que si
-- l'URL du point d'entrée HTTP est renseignée et le relais activé. Le
-- paramétrage se fait depuis l'éditeur d'e-mail (habilitation
-- `catalogue:write`).

insert into ref.email_settings (id, dispatch_url, dispatch_token, is_enabled)
values (1, null, null, false)
on conflict (id) do nothing;
