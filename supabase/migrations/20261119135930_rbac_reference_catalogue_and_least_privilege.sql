-- Keep the live capability catalogue complete before administrators edit grants.
-- These codes were already used by persisted role grants but had no visible
-- catalogue row, so the role-permission console could not manage them.
insert into ref.capability (code, label, group_label, description, sort_order)
values
  ('analytics:read', 'Consulter les indicateurs', 'Pilotage', 'Lire les indicateurs autorisés par le périmètre du rôle.', 360),
  ('analytics:export', 'Exporter les indicateurs', 'Pilotage', 'Exporter les indicateurs accessibles au rôle.', 370),
  ('catalogue:read', 'Consulter les référentiels', 'Administration', 'Consulter les produits, services et référentiels actifs.', 380),
  ('dossier:approve', 'Approuver un dossier', 'Dossiers', 'Approuver un dossier selon le circuit autorisé.', 390),
  ('dossier:assign', 'Affecter un dossier', 'Dossiers', 'Affecter un dossier à un agent habilité.', 400),
  ('dossier:delete', 'Retirer un dossier', 'Dossiers', 'Retirer un dossier selon la procédure et les contraintes de conservation.', 410),
  ('dossier:export', 'Exporter un dossier', 'Dossiers', 'Exporter les données auxquelles le rôle a accès.', 420),
  ('kyc:decide', 'Décider du contrôle KYC', 'Conformité', 'Valider ou rejeter le contrôle KYC dans le portefeuille affecté.', 430),
  ('kyc:escalate', 'Escalader un dossier KYC', 'Conformité', 'Transmettre un cas de conformité à la fonction autorisée sans ouvrir le profil complet.', 440),
  ('notary:draft', 'Préparer un acte', 'Notariat', 'Préparer un projet d’acte notarié.', 450),
  ('notary:release', 'Publier un acte', 'Notariat', 'Libérer un acte après validation du circuit notarial.', 460),
  ('recovery:manage', 'Gérer le recouvrement', 'Recouvrement', 'Mettre à jour les actions de recouvrement autorisées.', 470),
  ('recovery:read', 'Consulter le recouvrement', 'Recouvrement', 'Consulter les informations de recouvrement autorisées.', 480),
  ('savings:debit', 'Débiter un carnet', 'Épargne', 'Enregistrer un débit selon les contrôles applicables.', 490),
  ('savings:reverse', 'Annuler une opération d’épargne', 'Épargne', 'Contrepasser une opération selon le circuit de validation.', 500)
on conflict (code) do update
set label = excluded.label,
    group_label = excluded.group_label,
    description = excluded.description,
    sort_order = excluded.sort_order,
    deleted_at = null,
    deleted_by = null;

-- Full KYC remains limited to the currently assigned GESTIONNAIRE. System
-- administration can escalate a case but does not inspect borrower identity.
update ref.role_capability
set deleted_at = coalesce(deleted_at, now())
where deleted_at is null
  and role_code <> 'GESTIONNAIRE'
  and capability in ('kyc:read', 'kyc:verify', 'kyc:decide');

insert into ref.role_capability (role_code, capability)
values
  ('GESTIONNAIRE', 'kyc:read'),
  ('GESTIONNAIRE', 'kyc:verify'),
  ('GESTIONNAIRE', 'kyc:decide')
on conflict (role_code, capability) do update
set deleted_at = null,
    deleted_by = null
where ref.role_capability.deleted_at is not null;

-- A workflow operator does not implicitly receive staff-account or role
-- administration. Internal audit can review audit records but cannot alter
-- identities or their permissions.
update ref.role_capability
set deleted_at = coalesce(deleted_at, now())
where deleted_at is null
  and (
    (role_code = 'PMO' and capability in ('admin:users', 'admin:roles', 'admin:audit'))
    or (role_code = 'AUDIT' and capability in ('admin:users', 'admin:roles'))
  );

insert into ref.role_capability (role_code, capability)
values ('AUDIT', 'admin:audit')
on conflict (role_code, capability) do update
set deleted_at = null,
    deleted_by = null
where ref.role_capability.deleted_at is not null;

-- Local/staging reference seed also includes these specialist roles. This
-- migration repairs environments that were created from the older seven-role
-- seed without changing the persisted role codes.
insert into ref.role (code, label, description, pole_code, scope, landing_path, sort_order)
values
  ('PMO', 'PMO transformation', 'Pilotage des circuits, du catalogue et des indicateurs autorisés.', 'DG', 'ALL', '/portail-cfc/settings/workflow', 8),
  ('ANALYSTE', 'Analyste crédit', 'Analyse de crédit et préparation des décisions autorisées.', 'DCR', 'ALL', '/portail-cfc/actors/credit-committees', 9),
  ('RECOUVREMENT', 'Agent de recouvrement', 'Suivi des impayés et actions de recouvrement autorisées.', 'DRAC', 'ALL', '/portail-cfc/actors/disbursements/recovery', 10),
  ('ARCHIVISTE', 'Archiviste / GED', 'Classement, contrôle documentaire et restitution des pièces autorisées.', 'SDA', 'ALL', '/portail-cfc/dossiers', 11),
  ('AUDIT', 'Auditeur', 'Consultation en lecture seule des éléments autorisés et de la piste d’audit.', 'SDA-AUDIT', 'ALL', '/portail-cfc/dossiers', 12)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description,
    pole_code = excluded.pole_code,
    scope = excluded.scope,
    landing_path = excluded.landing_path,
    sort_order = excluded.sort_order,
    deleted_at = null,
    deleted_by = null;
