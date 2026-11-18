-- ---------------------------------------------------------------------------
-- Retrait des deux modèles d'e-mail hérités du kit de démonstration
-- ---------------------------------------------------------------------------
--
-- `DOSSIER_CREATED` et `STEP_ADVANCED` datent du kit : leur corps est un
-- paragraphe nu, sans la charte CFC, et ils ne correspondent à aucun message
-- que la plateforme envoie. Le CFC expédie d'autres messages — et c'est le
-- code qui décide du message : `APPLICATION_SUBMITTED` pour la transmission
-- du dossier, `DOSSIER_UPDATED` pour une mise à jour, `KYC_APPROVED` pour une
-- validation.
--
-- Les lignes sont **closes** (supprimées logiquement) et non réécrites : le
-- catalogue ne montre plus que les modèles que la banque envoie, tous
-- publiés par sa console d'administration et tous porteurs de sa charte.
--
-- L'opération est idempotente : une version déjà close n'est pas touchée.
update ref.email_template
set deleted_at = now()
where code in ('DOSSIER_CREATED', 'STEP_ADVANCED')
  and deleted_at is null;
