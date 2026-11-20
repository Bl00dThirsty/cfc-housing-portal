-- 013 — Row Level Security.
--
-- Règles appliquées :
-- - `USING` pour les lectures, `WITH CHECK` pour les écritures. Un `UPDATE`
--   sans `WITH CHECK` est le trou classique : la ligne peut être déplacée
--   hors du périmètre de l'acteur.
-- - `auth.uid()` est enveloppé dans `(select auth.uid())` pour être évalué
--   une seule fois comme InitPlan plutôt qu'à chaque ligne.
-- - Aucune prédicat n'est recopié : le périmètre passe par
--   `private.can_act_on_dossier`, la capacité par `private.has_capability`,
--   la chemise par `private.can_read_chemise`.
-- - `TO authenticated` + prédicat de propriété : l'authentification n'est pas
--   l'autorisation.

-- ---------------------------------------------------------------------------
-- Prédicat de lecture d'une chemise
-- ---------------------------------------------------------------------------

create or replace function private.can_read_chemise(p_role text, p_chemise text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_role = 'ADMIN'
    or exists (
      select 1
      from ref.chemise_readable_by c
      where c.chemise_code = p_chemise
        and c.role_code = p_role
        and c.deleted_at is null
    );
$$;
-- ---------------------------------------------------------------------------
-- Activation
-- ---------------------------------------------------------------------------

alter table public.agencies enable row level security;
alter table public.agencies force row level security;
alter table public.actors enable row level security;
alter table public.actors force row level security;
alter table public.citizen_profiles enable row level security;
alter table public.citizen_profiles force row level security;
alter table public.staff_profiles enable row level security;
alter table public.staff_profiles force row level security;
alter table public.staff_assignments enable row level security;
alter table public.staff_assignments force row level security;
alter table public.dossiers enable row level security;
alter table public.dossiers force row level security;
alter table public.dossier_documents enable row level security;
alter table public.dossier_documents force row level security;
alter table public.dossier_events enable row level security;
alter table public.dossier_events force row level security;
alter table public.parties enable row level security;
alter table public.parties force row level security;
alter table public.dossier_parties enable row level security;
alter table public.dossier_parties force row level security;
alter table public.grants enable row level security;
alter table public.grants force row level security;
alter table public.savings_accounts enable row level security;
alter table public.savings_accounts force row level security;
alter table public.savings_transactions enable row level security;
alter table public.savings_transactions force row level security;
alter table public.committee_deliberations enable row level security;
alter table public.committee_deliberations force row level security;
alter table public.deliberation_lines enable row level security;
alter table public.deliberation_lines force row level security;
alter table public.loan_offers enable row level security;
alter table public.loan_offers force row level security;
alter table public.land_titles enable row level security;
alter table public.land_titles force row level security;
alter table public.notary_instruments enable row level security;
alter table public.notary_instruments force row level security;
alter table public.oppositions enable row level security;
alter table public.oppositions force row level security;
alter table public.insurances enable row level security;
alter table public.insurances force row level security;
alter table public.disbursements enable row level security;
alter table public.disbursements force row level security;
alter table public.disbursement_schedules enable row level security;
alter table public.disbursement_schedules force row level security;
alter table public.reconciliation_runs enable row level security;
alter table public.reconciliation_runs force row level security;
alter table public.data_subject_requests enable row level security;
alter table public.data_subject_requests force row level security;
alter table ref.pole enable row level security;
alter table ref.pole force row level security;
alter table ref.role enable row level security;
alter table ref.role force row level security;
alter table ref.role_capability enable row level security;
alter table ref.role_capability force row level security;
alter table ref.chemise enable row level security;
alter table ref.chemise force row level security;
alter table ref.chemise_readable_by enable row level security;
alter table ref.chemise_readable_by force row level security;
alter table ref.document_nature enable row level security;
alter table ref.document_nature force row level security;
alter table ref.document_type enable row level security;
alter table ref.document_type force row level security;
alter table ref.document_type_equivalent enable row level security;
alter table ref.document_type_equivalent force row level security;
alter table ref.service enable row level security;
alter table ref.service force row level security;
alter table ref.product enable row level security;
alter table ref.product force row level security;
alter table ref.product_rate enable row level security;
alter table ref.product_rate force row level security;
alter table ref.service_document_requirement enable row level security;
alter table ref.service_document_requirement force row level security;
alter table ref.debt_capacity_policy enable row level security;
alter table ref.debt_capacity_policy force row level security;
alter table ref.approval_threshold enable row level security;
alter table ref.approval_threshold force row level security;
alter table ref.retention_policy enable row level security;
alter table ref.retention_policy force row level security;
-- ---------------------------------------------------------------------------
-- Référentiel `ref` — lecture libre pour les authentifiés, écriture réservée
-- à l'administrateur (paramétrage du catalogue documentaire).
-- ---------------------------------------------------------------------------

create policy ref_read on ref.pole for select to authenticated using (true);
create policy ref_write on ref.pole for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.role for select to authenticated using (true);
create policy ref_write on ref.role for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.role_capability for select to authenticated using (true);
create policy ref_write on ref.role_capability for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.chemise for select to authenticated using (true);
create policy ref_write on ref.chemise for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.chemise_readable_by for select to authenticated using (true);
create policy ref_write on ref.chemise_readable_by for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.document_nature for select to authenticated using (true);
create policy ref_write on ref.document_nature for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.document_type for select to authenticated using (true);
create policy ref_write on ref.document_type for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.document_type_equivalent for select to authenticated using (true);
create policy ref_write on ref.document_type_equivalent for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.service for select to authenticated using (true);
create policy ref_write on ref.service for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.product for select to authenticated using (true);
create policy ref_write on ref.product for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.product_rate for select to authenticated using (true);
create policy ref_write on ref.product_rate for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.service_document_requirement for select to authenticated using (true);
create policy ref_write on ref.service_document_requirement for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.debt_capacity_policy for select to authenticated using (true);
create policy ref_write on ref.debt_capacity_policy for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.approval_threshold for select to authenticated using (true);
create policy ref_write on ref.approval_threshold for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
create policy ref_read on ref.retention_policy for select to authenticated using (true);
create policy ref_write on ref.retention_policy for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
-- ---------------------------------------------------------------------------
-- Identité
-- ---------------------------------------------------------------------------

create policy agencies_read on public.agencies for select to authenticated using (true);
create policy agencies_write on public.agencies for all to authenticated
  using ((select private.current_role()) = 'ADMIN')
  with check ((select private.current_role()) = 'ADMIN');
-- Un acteur lit sa propre fiche ; un agent habilité lit l'ensemble du
-- portefeuille.
create policy actors_read on public.actors for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'dossier:read'))
  );
-- Un citoyen crée sa propre fiche — jamais un rôle `staff`.
create policy actors_insert on public.actors for insert to authenticated
  with check (id = (select auth.uid()) and actor_type = 'citizen');
create policy actors_update on public.actors for update to authenticated
  using (id = (select auth.uid()) and actor_type = 'citizen')
  with check (id = (select auth.uid()) and actor_type = 'citizen');
create policy citizen_profiles_read on public.citizen_profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'kyc:read'))
  );
create policy citizen_profiles_insert on public.citizen_profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy citizen_profiles_update on public.citizen_profiles for update to authenticated
  using (
    id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'kyc:verify'))
  )
  with check (
    id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'kyc:verify'))
  );
create policy staff_profiles_read on public.staff_profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'admin:users'))
    or agency_id = (select private.actor_agency_id())
  );
create policy staff_profiles_write on public.staff_profiles for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'admin:users')))
  with check ((select private.has_capability((select private.current_role()), 'admin:users')));
-- L'affectation d'un agent : l'agent la consulte, seul l'administrateur la
-- modifie. Aucun agent ne s'auto-attribue un rôle.
create policy staff_assignments_read on public.staff_assignments for select to authenticated
  using (
    actor_id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'admin:users'))
  );
create policy staff_assignments_write on public.staff_assignments for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'admin:roles')))
  with check ((select private.has_capability((select private.current_role()), 'admin:roles')));
-- ---------------------------------------------------------------------------
-- Dossiers
-- ---------------------------------------------------------------------------

-- Un citoyen ne voit que son dossier ; un agent ne voit que les dossiers de
-- son périmètre (agence, portefeuille ou transverse selon son rôle).
create policy dossiers_read on public.dossiers for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.has_capability((select private.current_role()), 'dossier:read'))
      and (select private.can_act_on_dossier(
             (select private.current_pole()),
             owner_user_id,
             agency_id,
             is_diaspora,
             id
           ))
    )
  );
create policy dossiers_insert on public.dossiers for insert to authenticated
  with check (
    citizen_id = (select auth.uid())
    or (
      (select private.has_capability((select private.current_role()), 'dossier:create'))
      and (select private.can_act_on_dossier(
             (select private.current_pole()),
             owner_user_id,
             agency_id,
             is_diaspora,
             id
           ))
    )
  );
create policy dossiers_update on public.dossiers for update to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.has_capability((select private.current_role()), 'dossier:update'))
      and (select private.can_act_on_dossier(
             (select private.current_pole()),
             owner_user_id,
             agency_id,
             is_diaspora,
             id
           ))
    )
  )
  with check (
    citizen_id = (select auth.uid())
    or (
      (select private.has_capability((select private.current_role()), 'dossier:update'))
      and (select private.can_act_on_dossier(
             (select private.current_pole()),
             owner_user_id,
             agency_id,
             is_diaspora,
             id
           ))
    )
  );
create policy dossiers_delete on public.dossiers for delete to authenticated
  using ((select private.has_capability((select private.current_role()), 'admin:roles')));
-- ---------------------------------------------------------------------------
-- Pièces du dossier — la chemise restreint la lecture
-- ---------------------------------------------------------------------------

create policy dossier_documents_read on public.dossier_documents for select to authenticated
  using (
    exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and (
          d.citizen_id = (select auth.uid())
          or (
            (select private.has_capability((select private.current_role()), 'document:read'))
            and (select private.can_act_on_dossier(
                   (select private.current_pole()),
                   d.owner_user_id,
                   d.agency_id,
                   d.is_diaspora,
                   d.id
                 ))
          )
        )
    )
    and (
      (select private.current_role()) = 'ADMIN'
      or (select private.can_read_chemise((select private.current_role()), chemise_code))
      or exists (
        select 1
        from public.dossiers d2
        where d2.id = dossier_id
          and d2.citizen_id = (select auth.uid())
      )
    )
  );
-- Le dépôt et le retrait d'une pièce sont encadrés par la capacité
-- `document:upload` et par la chemise concernée.
create policy dossier_documents_insert on public.dossier_documents for insert to authenticated
  with check (
    (select private.has_capability((select private.current_role()), 'document:upload'))
    and (
      (select private.current_role()) = 'ADMIN'
      or (select private.can_read_chemise((select private.current_role()), chemise_code))
    )
    and exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and (
          d.citizen_id = (select auth.uid())
          or (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
        )
    )
  );
-- Validation et rejet : les agents habilités seulement.
create policy dossier_documents_update on public.dossier_documents for update to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'document:validate'))
    or (select private.has_capability((select private.current_role()), 'document:reject'))
  )
  with check (
    (select private.has_capability((select private.current_role()), 'document:validate'))
    or (select private.has_capability((select private.current_role()), 'document:reject'))
  );
-- L'auteur d'une pièce peut la remplacer tant qu'elle n'est pas validée :
-- le `WITH CHECK` interdit de s'auto-valider.
create policy dossier_documents_owner_update on public.dossier_documents for update to authenticated
  using (uploaded_by = (select auth.uid()))
  with check (uploaded_by = (select auth.uid()) and status = 'uploaded');
create policy dossier_documents_delete on public.dossier_documents for delete to authenticated
  using (
    uploaded_by = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'admin:roles'))
  );
-- ---------------------------------------------------------------------------
-- Journal d'événements — AJOUT SEUL
-- ---------------------------------------------------------------------------

create policy dossier_events_read on public.dossier_events for select to authenticated
  using (
    exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and (
          d.citizen_id = (select auth.uid())
          or (
            (select private.has_capability((select private.current_role()), 'dossier:read'))
            and (select private.can_act_on_dossier(
                   (select private.current_pole()),
                   d.owner_user_id,
                   d.agency_id,
                   d.is_diaspora,
                   d.id
                 ))
          )
        )
    )
  );
-- Aucune politique d'insertion : les écritures passent par
-- `private.append_dossier_event` (security definer), qui contrôle
-- l'habilitation de l'acteur sur le dossier.

-- ---------------------------------------------------------------------------
-- Tiers et mandats
-- ---------------------------------------------------------------------------

create policy parties_read on public.parties for select to authenticated using (true);
create policy parties_write on public.parties for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'dossier:update')))
  with check ((select private.has_capability((select private.current_role()), 'dossier:update')));
create policy dossier_parties_read on public.dossier_parties for select to authenticated
  using (
    exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and (
          d.citizen_id = (select auth.uid())
          or (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
        )
    )
  );
create policy dossier_parties_write on public.dossier_parties for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'dossier:update')))
  with check ((select private.has_capability((select private.current_role()), 'dossier:update')));
create policy grants_read on public.grants for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'admin:roles'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and (
          d.citizen_id = (select auth.uid())
          or (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
        )
    )
  );
create policy grants_write on public.grants for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'admin:roles')))
  with check ((select private.has_capability((select private.current_role()), 'admin:roles')));
-- ---------------------------------------------------------------------------
-- Épargne
-- ---------------------------------------------------------------------------

create policy savings_accounts_read on public.savings_accounts for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.has_capability((select private.current_role()), 'savings:read'))
      and exists (
        select 1
        from public.dossiers d
        where d.id = dossier_id
          and (select private.can_act_on_dossier(
                 (select private.current_pole()),
                 d.owner_user_id,
                 d.agency_id,
                 d.is_diaspora,
                 d.id
               ))
      )
    )
  );
create policy savings_accounts_write on public.savings_accounts for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'savings:credit')))
  with check ((select private.has_capability((select private.current_role()), 'savings:credit')));
create policy savings_transactions_read on public.savings_transactions for select to authenticated
  using (
    exists (
      select 1
      from public.savings_accounts sa
      where sa.id = account_id
        and (
          sa.citizen_id = (select auth.uid())
          or (select private.has_capability((select private.current_role()), 'savings:read'))
        )
    )
  );
create policy savings_transactions_insert on public.savings_transactions for insert to authenticated
  with check (
    (select private.has_capability((select private.current_role()), 'savings:credit'))
    and exists (
      select 1
      from public.savings_accounts sa
      join public.dossiers d on d.id = sa.dossier_id
      where sa.id = savings_transactions.account_id
        and (select private.can_act_on_dossier(
               (select private.current_pole()),
               d.owner_user_id,
               d.agency_id,
               d.is_diaspora,
               d.id
             ))
    )
  );
create policy savings_transactions_update on public.savings_transactions for update to authenticated
  using ((select private.has_capability((select private.current_role()), 'savings:validate')))
  with check ((select private.has_capability((select private.current_role()), 'savings:validate')));
-- ---------------------------------------------------------------------------
-- Comités de crédit
-- ---------------------------------------------------------------------------

create policy committee_deliberations_read on public.committee_deliberations for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'committee:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy committee_deliberations_write on public.committee_deliberations for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'committee:deliberate')))
  with check ((select private.has_capability((select private.current_role()), 'committee:deliberate')));
create policy deliberation_lines_read on public.deliberation_lines for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'committee:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
-- Signer sa propre ligne : la signature est irrévocable.
create policy deliberation_lines_insert on public.deliberation_lines for insert to authenticated
  with check (
    (select private.has_capability((select private.current_role()), 'committee:deliberate'))
    or (
      (select private.has_capability((select private.current_role()), 'committee:sign'))
      and signer_id = (select auth.uid())
    )
  );
create policy deliberation_lines_update on public.deliberation_lines for update to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'committee:sign'))
    and signer_id = (select auth.uid())
  )
  with check (
    (select private.has_capability((select private.current_role()), 'committee:sign'))
    and signer_id = (select auth.uid())
  );
create policy loan_offers_read on public.loan_offers for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'loan_offer:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
-- La rédaction d'une offre et son émission sont deux capacités distinctes :
-- `loan_offer:create` rédige, `loan_offer:issue` engage l'offre.
create policy loan_offers_insert on public.loan_offers for insert to authenticated
  with check ((select private.has_capability((select private.current_role()), 'loan_offer:create')));
create policy loan_offers_update on public.loan_offers for update to authenticated
  using ((select private.has_capability((select private.current_role()), 'loan_offer:issue')))
  with check ((select private.has_capability((select private.current_role()), 'loan_offer:issue')));
create policy loan_offers_delete on public.loan_offers for delete to authenticated
  using ((select private.has_capability((select private.current_role()), 'admin:roles')));
-- ---------------------------------------------------------------------------
-- Notariat et garanties
-- ---------------------------------------------------------------------------

create policy land_titles_read on public.land_titles for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'notary:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy land_titles_write on public.land_titles for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'notary:record')))
  with check ((select private.has_capability((select private.current_role()), 'notary:record')));
create policy notary_instruments_read on public.notary_instruments for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'notary:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy notary_instruments_write on public.notary_instruments for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'notary:record')))
  with check ((select private.has_capability((select private.current_role()), 'notary:record')));
create policy oppositions_read on public.oppositions for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'notary:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy oppositions_write on public.oppositions for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'notary:record')))
  with check ((select private.has_capability((select private.current_role()), 'notary:record')));
create policy insurances_read on public.insurances for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'notary:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy insurances_write on public.insurances for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'notary:record')))
  with check ((select private.has_capability((select private.current_role()), 'notary:record')));
-- ---------------------------------------------------------------------------
-- Décaissements et rapprochements
-- ---------------------------------------------------------------------------

create policy disbursements_read on public.disbursements for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'disbursement:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy disbursements_write on public.disbursements for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'disbursement:release')))
  with check ((select private.has_capability((select private.current_role()), 'disbursement:release')));
create policy disbursement_schedules_read on public.disbursement_schedules for select to authenticated
  using (
    (select private.has_capability((select private.current_role()), 'disbursement:read'))
    or exists (
      select 1
      from public.dossiers d
      where d.id = dossier_id
        and d.citizen_id = (select auth.uid())
    )
  );
create policy disbursement_schedules_write on public.disbursement_schedules for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'disbursement:release')))
  with check ((select private.has_capability((select private.current_role()), 'disbursement:release')));
create policy reconciliation_runs_read on public.reconciliation_runs for select to authenticated
  using ((select private.has_capability((select private.current_role()), 'disbursement:reconcile')));
create policy reconciliation_runs_write on public.reconciliation_runs for all to authenticated
  using ((select private.has_capability((select private.current_role()), 'disbursement:reconcile')))
  with check ((select private.has_capability((select private.current_role()), 'disbursement:reconcile')));
-- ---------------------------------------------------------------------------
-- Demandes d'exercice des droits
-- ---------------------------------------------------------------------------

create policy data_subject_requests_read on public.data_subject_requests for select to authenticated
  using (
    requester_actor_id = (select auth.uid())
    or (select private.has_capability((select private.current_role()), 'admin:audit'))
  );
create policy data_subject_requests_insert on public.data_subject_requests for insert to authenticated
  with check (requester_actor_id = (select auth.uid()));
create policy data_subject_requests_update on public.data_subject_requests for update to authenticated
  using ((select private.has_capability((select private.current_role()), 'admin:audit')))
  with check ((select private.has_capability((select private.current_role()), 'admin:audit')));
grant execute on function private.can_read_chemise(text, text) to authenticated, service_role;
-- ---------------------------------------------------------------------------
-- Exposition du schéma `ref` via l'API
--
-- Le catalogue déclarable doit être lisible par l'application : le schéma
-- `ref` est donc exposé comme `public` (cf. `api.schemas` de `config.toml`).
--
-- L'exposition n'est pas l'autorisation : les politiques `ref_read` /
-- `ref_write` limitent l'accès aux rôles `authenticated`, et l'écriture à
-- l'administrateur. Un visiteur anonyme n'obtient aucune ligne.
--
-- Le schéma `private`, lui, n'est jamais exposé et n'accorde aucun droit à
-- `authenticator`.
-- ---------------------------------------------------------------------------

grant usage on schema ref to anon, authenticated, service_role, authenticator;
grant select on all tables in schema ref to anon, authenticated;
grant insert, update, delete on all tables in schema ref to authenticated;
grant all on all tables in schema ref to service_role;
-- Les tables futures du référentiel suivent les mêmes droits.
alter default privileges in schema ref grant select on tables to anon, authenticated;
alter default privileges in schema ref grant all on tables to service_role;
-- ---------------------------------------------------------------------------
-- Garde-fou de champs : « mise à jour d'identité seulement » pour le citoyen
--
-- Le RLS raisonne au niveau de la ligne ; la restriction au niveau du champ
-- est appliquée ici, au niveau du trigger, où l'on peut comparer la ligne
-- avant et après.
-- ---------------------------------------------------------------------------

create or replace function private.guard_citizen_dossier_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select private.current_role()) is null
     and (select auth.uid()) = old.citizen_id
     and (
       new.loan_amount is distinct from old.loan_amount
       or new.rate is distinct from old.rate
       or new.duration is distinct from old.duration
       or new.duration_years is distinct from old.duration_years
       or new.monthly_payment is distinct from old.monthly_payment
       or new.monthly_income is distinct from old.monthly_income
       or new.project_cost is distinct from old.project_cost
       or new.savings_target is distinct from old.savings_target
       or new.savings_current is distinct from old.savings_current
       or new.savings_percent is distinct from old.savings_percent
       or new.current_balance is distinct from old.current_balance
       or new.debt_ratio is distinct from old.debt_ratio
       or new.status is distinct from old.status
       or new.current_phase is distinct from old.current_phase
       or new.current_step is distinct from old.current_step
       or new.risk_level is distinct from old.risk_level
       or new.rating is distinct from old.rating
       or new.progress is distinct from old.progress
       or new.completion_percent is distinct from old.completion_percent
       or new.owner_user_id is distinct from old.owner_user_id
       or new.agency_id is distinct from old.agency_id
     ) then
    raise exception 'dossier_field_forbidden' using errcode = '42501';
  end if;

  return new;
end $$;
create trigger trg_guard_citizen_dossier_update
  before update on public.dossiers
  for each row execute function private.guard_citizen_dossier_update();
grant execute on function private.guard_citizen_dossier_update() to service_role;
