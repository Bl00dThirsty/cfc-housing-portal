--- 018 — Cartographie officielle des processus CFC.
---
--- Les codes de processus (`CRD-06`, `REC-03`, `GAR-01`…) sont ceux du
--- recueil des manuels de procédures du CFC, repris dans « Cartographie et
--- analyse des processus métiers clés » (chapitre 6). Ils sont la référence
--- partagée entre le back-office, le portail citoyen et le reporting.
---
--- Ce référentiel est **déclaratif** : un changement de libellé ou de pilote
--- se fait ici, pas dans le code.
---
set search_path = public, extensions;
-- ---------------------------------------------------------------------------
-- Catalogue des processus
-- ---------------------------------------------------------------------------

create table if not exists ref.process (
  code          text primary key,
  label         text not null,
  family        text not null check (family in ('pilotage', 'realisation', 'support', 'ecosysteme')),
  chain_order   smallint check (chain_order is null or chain_order > 0),
  pilote        text[] not null default '{}',
  priority      text not null default 'standard' check (priority in ('prioritaire', 'standard')),
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
comment on table ref.process is
  'Catalogue des processus CFC (cartographie officielle, chapitre 6).';
-- ---------------------------------------------------------------------------
-- Étapes de procédure, par phase du circuit de crédit
-- ---------------------------------------------------------------------------

create table if not exists ref.process_step (
  code          text primary key,
  process_code  text not null references ref.process (code) on delete cascade,
  label         text not null,
  phase         text check (phase in (
                  'kyc_savings', 'risk_bet', 'committees',
                  'notary_mortgage', 'disbursements', 'closing_release'
                )),
  lane          text not null check (lane in ('client', 'agence', 'siege', 'partenaires', 'support')),
  is_external   boolean not null default false,
  sla_days      smallint check (sla_days is null or sla_days > 0),
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
create index if not exists process_step_phase_idx on ref.process_step (phase);
create index if not exists process_step_process_idx on ref.process_step (process_code);
-- ---------------------------------------------------------------------------
-- Points de rupture documentés et levier d'amélioration associé
-- ---------------------------------------------------------------------------

create table if not exists ref.process_rupture (
  code          text primary key,
  process_code  text not null references ref.process (code) on delete cascade,
  label         text not null,
  lever         text not null,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
-- ---------------------------------------------------------------------------
-- Échelle de recouvrement (ancienneté de l'impayé)
-- ---------------------------------------------------------------------------

create table if not exists ref.arrears_phase (
  stage         text primary key,
  label         text not null,
  from_month    smallint check (from_month is null or from_month >= 0),
  to_month      smallint check (to_month is null or to_month >= 0),
  sla_days      smallint not null check (sla_days > 0),
  is_external   boolean not null default false,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
create table if not exists ref.arrears_obligation (
  stage         text not null references ref.arrears_phase (stage) on delete cascade,
  ordinal       smallint not null,
  label         text not null,
  procedures    text[] not null default '{}',
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null,
  primary key (stage, ordinal)
);
-- ---------------------------------------------------------------------------
-- Règles de l'épargne-logement
-- ---------------------------------------------------------------------------

create table if not exists ref.savings_rule (
  code          text primary key,
  label         text not null,
  value         numeric(12, 4),
  unit          text,
  legal_basis   text,
  effective_from date not null default current_date,
  effective_to  date,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users (id) on delete set null
);
-- ---------------------------------------------------------------------------
-- Données de référence
-- ---------------------------------------------------------------------------

insert into ref.process (code, label, family, chain_order, pilote, priority) values
  ('ACC', 'Marketing et développement commercial', 'realisation', 1, array['DCM'], 'standard'),
  ('CLT', 'Accueil et relation client',           'realisation', 2, array['DCM'], 'standard'),
  ('CPT', 'Collecte de l''épargne-logement',      'realisation', 3, array['DCM','DFBC'], 'prioritaire'),
  ('CRD', 'Octroi et mise en place du crédit habitat', 'realisation', 4, array['DCR'], 'prioritaire'),
  ('GAR', 'Gestion des garanties',                'realisation', 5, array['DCR','DRAC'], 'prioritaire'),
  ('REC', 'Remboursements, recouvrement et contentieux', 'realisation', 6, array['DRAC'], 'prioritaire'),
  ('OPE', 'Opérations d''épargne',                'realisation', null, array['DFBC'], 'standard'),
  ('CAI', 'Caisse et dépôt des versements',       'realisation', null, array['DFBC'], 'standard'),
  ('ARC', 'Archivage et gestion électronique des documents', 'support', null, array['SDPA','SDI'], 'prioritaire'),
  ('COU', 'Courrier',                             'support', null, array['DAG'], 'standard')
on conflict (code) do update
  set label = excluded.label,
      family = excluded.family,
      chain_order = excluded.chain_order,
      pilote = excluded.pilote,
      priority = excluded.priority,
      updated_at = now()
where ref.process.deleted_at is null;
insert into ref.process_step (code, process_code, label, phase, lane, is_external) values
  ('CRD-01', 'CRD', 'Entretien exploratoire et analyse sommaire',          'kyc_savings',     'agence',      false),
  ('CRD-02', 'CRD', 'Analyse sommaire du dossier',                        'kyc_savings',     'agence',      false),
  ('CRD-03', 'CRD', 'Frais d''instruction, contrat et numérotation',     'kyc_savings',     'agence',      false),
  ('CRD-04', 'CRD', 'Dossier technique et maîtrise d''œuvre (BET)',       'risk_bet',        'partenaires', true),
  ('CRD-06', 'CRD', 'Évaluation du dossier',                              'risk_bet',        'agence',      false),
  ('CRD-07', 'CRD', 'Décision du directeur d''agence',                    'committees',      'agence',      false),
  ('CRD-08', 'CRD', 'Contrôle, évaluation et présentation à la décision', 'committees',      'siege',       false),
  ('CRD-09', 'CRD', 'Notification au client (décision)',                  'committees',      'agence',      false),
  ('CRD-10', 'CRD', 'Notification au client (accord)',                    'committees',      'agence',      false),
  ('GAR-01', 'GAR', 'Constitution des garanties : notaire, conservation foncière, assurance', 'notary_mortgage', 'partenaires', true),
  ('CRD-11', 'CRD', 'Mise en place du prêt',                             'notary_mortgage', 'siege',       false),
  ('CRD-12', 'CRD', 'Déblocages sur inspection de chantier',              'disbursements',   'siege',       false),
  ('CRD-13', 'CRD', 'Décaissement et comptabilisation (CARTHAGO)',        'disbursements',   'support',     false),
  ('REC-01', 'REC', 'Tombée d''échéance',                                null,               'agence',      false),
  ('REC-12', 'REC', 'Prélèvement automatique et avis à tiers détenteur',   null,               'partenaires', true),
  ('REC-02', 'REC', 'Relances amiables (moins de 3 mois)',                null,               'agence',      false),
  ('REC-08', 'REC', 'Relances amiables (moins de 3 mois)',                null,               'agence',      false),
  ('REC-03', 'REC', 'Impayés de 3 à 6 mois, restructuration éventuelle',  null,               'agence',      false),
  ('CRD-05', 'CRD', 'Restructuration de la créance',                     null,               'siege',       false),
  ('REC-04', 'REC', 'Mise en contentieux',                               null,               'siege',       false),
  ('REC-05', 'REC', 'Déclaration à la Centrale des risques (BEAC)',      null,               'partenaires', true),
  ('GAR-06', 'GAR', 'Mise en jeu des garanties, saisie immobilière',      'closing_release', 'partenaires', true),
  ('REC-06', 'REC', 'Saisie immobilière',                                'closing_release', 'partenaires', true),
  ('REC-07', 'REC', 'Suivi du dossier contentieux',                      null,               'siege',       false),
  ('REC-09', 'REC', 'Échéance réglée',                                    'closing_release', 'client',      false),
  ('REC-10', 'REC', 'Remboursement anticipé',                            'closing_release', 'client',      false),
  ('GAR-05', 'GAR', 'Mainlevée en fin de prêt',                           'closing_release', 'partenaires', true),
  ('ACC-02', 'ACC', 'Information et prospection',                          null,               'siege',       false),
  ('ACC-03', 'ACC', 'Information et prospection',                          null,               'siege',       false),
  ('CLT-04', 'CLT', 'Entrée en relation et ouverture du compte épargne-logement (carnet A ou B)', null, 'agence', false),
  ('CPT-02', 'CPT', 'Ouverture du compte épargne-logement',              null,               'agence',      false),
  ('OPE-01', 'OPE', 'Versements initiaux',                                null,               'client',      false),
  ('CAI',   'CAI', 'Versements périodiques',                              null,               'client',      false),
  ('OPE-02', 'OPE', 'Rémunération et droits acquis (période ≥ 1 an)',      null,               'support',     false),
  ('CPT-09', 'CPT', 'Option de fin de période contractuelle',             null,               'siege',       false),
  ('CPT-08', 'CPT', 'Clôture ou prorogation du compte',                   null,               'agence',      false)
on conflict (code) do update
  set process_code = excluded.process_code,
      label = excluded.label,
      phase = excluded.phase,
      lane = excluded.lane,
      is_external = excluded.is_external,
      updated_at = now()
where ref.process_step.deleted_at is null;
insert into ref.process_rupture (code, process_code, label, lever) values
  ('CRD-R1', 'CRD', 'Support papier et ressaisies',                                   'Capture à la source, dossier client numérique de référence'),
  ('CRD-R2', 'CRD', 'Dépendance aux bureaux d''études',                               'Dossier technique numérisé et suivi outillé des inspections de chantier'),
  ('CRD-R3', 'CRD', 'Navettes agence–siège',                                          'Workflow unique et traçable'),
  ('CRD-R4', 'CRD', 'Niveaux de validation multiples',                                'Délégations clarifiées'),
  ('CRD-R5', 'CRD', 'Délais externes (titre foncier, hypothèque)',                     'Engagements de délai (SLA) internes et externes'),
  ('CRD-R6', 'CRD', 'Inspections de chantier non outillées',                           'Géolocalisation des biens, déblocages sur inspection outillée'),
  ('REC-R1', 'REC', 'Faible coopération des banques domiciliataires et absence de domiciliation des revenus', 'Domiciliation des revenus, alerte précoce'),
  ('REC-R2', 'REC', 'Restructurations tardives, faute d''alerte précoce',             'Segmentation des impayés, restructuration proactive'),
  ('REC-R3', 'REC', 'Litiges fonciers et procédures judiciaires longues',              'Pilotage des contentieux'),
  ('REC-R4', 'REC', 'Suivi des contentieux peu outillé, données historiques incomplètes', 'Tableau de bord du portefeuille'),
  ('CPT-R1', 'CPT', 'Produit peu connu (7,2 % des personnes interrogées)',              'Offre simple et segmentée'),
  ('CPT-R2', 'CPT', 'Distribution limitée aux agences des chefs-lieux de région',       'Souscription et versements à distance'),
  ('CPT-R3', 'CPT', 'Pas de collecte à distance (mobile money, diaspora)',            'Versements par mobile money et partenariats'),
  ('CPT-R4', 'CPT', 'Cadre réglementaire du PEL inchangé depuis 1987',                 'Révision du cadre réglementaire')
on conflict (code) do update
  set label = excluded.label,
      lever = excluded.lever,
      updated_at = now()
where ref.process_rupture.deleted_at is null;
insert into ref.arrears_phase (stage, label, from_month, to_month, sla_days, is_external) values
  ('current',                'Échéance',                            null, 0,   5,  true),
  ('relance_amiable',        'Relances amiables',                   1,    2,   15, false),
  ('restructuring',          'Restructuration éventuelle',          3,    6,   30, false),
  ('contentieux',            'Mise en contentieux',                 7,    null, 45, true),
  ('central_risks',          'Déclaration à la Centrale des risques', 7,  null, 15, true),
  ('mise_en_jeu_garanties',  'Mise en jeu des garanties',            7,    null, 90, true),
  ('closed',                 'Créance soldée',                       null, null, 30, true)
on conflict (stage) do update
  set label = excluded.label,
      from_month = excluded.from_month,
      to_month = excluded.to_month,
      sla_days = excluded.sla_days,
      is_external = excluded.is_external,
      updated_at = now()
where ref.arrears_phase.deleted_at is null;
insert into ref.arrears_obligation (stage, ordinal, label, procedures) values
  ('current', 1, 'Prélèvement automatique sur le compte domiciliataire', array['REC-01','REC-12']),
  ('current', 2, 'Avis à tiers détenteur auprès de l''employeur', array['REC-12']),
  ('relance_amiable', 1, 'Relance téléphonique', array['REC-02']),
  ('relance_amiable', 2, 'Relance écrite', array['REC-08']),
  ('relance_amiable', 3, 'Appel de l''emprunteur', array['REC-02']),
  ('restructuring', 1, 'Évaluation de la capacité de remboursement résiduelle', array['REC-03']),
  ('restructuring', 2, 'Proposition de restructuration ou d''échéancier', array['CRD-05']),
  ('contentieux', 1, 'Saisine contentieuse', array['REC-04']),
  ('contentieux', 2, 'Constitution du dossier de contentieux', array['REC-04','REC-07']),
  ('central_risks', 1, 'Déclaration de la créance impayée au registre BEAC', array['REC-05']),
  ('mise_en_jeu_garanties', 1, 'Saisie immobilière', array['GAR-06','REC-06']),
  ('mise_en_jeu_garanties', 2, 'Mainlevée ou maintien de la garantie', array['GAR-05']),
  ('closed', 1, 'Échéance réglée', array['REC-09']),
  ('closed', 2, 'Remboursement anticipé', array['REC-10']),
  ('closed', 3, 'Mainlevée en fin de prêt', array['GAR-05'])
on conflict (stage, ordinal) do update
  set label = excluded.label,
      procedures = excluded.procedures,
      updated_at = now()
where ref.arrears_obligation.deleted_at is null;
insert into ref.savings_rule (code, label, value, unit, legal_basis) values
  ('DROIT_ACQUIS_MONTHS', 'Durée de versements requise pour l''acquisition du droit acquis', 12, 'mois',
   'Figure 9 — Rémunération et droits acquis, période ≥ 1 an'),
  ('EARLY_ALERT_DAYS', 'Délai de prévenance avant l''échéance', 15, 'jours',
   'PR-02 — alerte précoce, point de rupture n° 2')
on conflict (code) do update
  set label = excluded.label,
      value = excluded.value,
      unit = excluded.unit,
      legal_basis = excluded.legal_basis,
      updated_at = now()
where ref.savings_rule.deleted_at is null;
-- ---------------------------------------------------------------------------
-- RLS : référentiel en lecture pour les agents authentifiés
-- ---------------------------------------------------------------------------

alter table ref.process enable row level security;
alter table ref.process_step enable row level security;
alter table ref.process_rupture enable row level security;
alter table ref.arrears_phase enable row level security;
alter table ref.arrears_obligation enable row level security;
alter table ref.savings_rule enable row level security;
drop policy if exists process_read on ref.process;
create policy process_read on ref.process for select to authenticated using (deleted_at is null);
drop policy if exists process_step_read on ref.process_step;
create policy process_step_read on ref.process_step for select to authenticated using (deleted_at is null);
drop policy if exists process_rupture_read on ref.process_rupture;
create policy process_rupture_read on ref.process_rupture for select to authenticated using (deleted_at is null);
drop policy if exists arrears_phase_read on ref.arrears_phase;
create policy arrears_phase_read on ref.arrears_phase for select to authenticated using (deleted_at is null);
drop policy if exists arrears_obligation_read on ref.arrears_obligation;
create policy arrears_obligation_read on ref.arrears_obligation for select to authenticated using (true);
drop policy if exists savings_rule_read on ref.savings_rule;
create policy savings_rule_read on ref.savings_rule for select to authenticated using (deleted_at is null);
