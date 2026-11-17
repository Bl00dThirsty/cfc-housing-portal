
insert into ref.role (code, label, description, pole_code, scope, landing_path, sort_order) values
  ('ADMIN','Administrateur','Controle total de la plateforme.','DG','ALL','/',10),
  ('PMO','PMO transformation','Pilote les circuits, le catalogue et les indicateurs.','DG','ALL','/workflows',20),
  ('GUICHET','Charge de clientele','Instruit les demandes et suit son portefeuille d agence.','DCM','OWN_AGENCY','/dossiers',30),
  ('DIASPORA','Conseiller diaspora','Traite les dossiers de la diaspora.','DCM-DIAS','DIASPORA_FILES','/dossiers',40),
  ('GESTIONNAIRE','Gestionnaire credit','Assemble et controle le dossier de credit.','DCR','ALL','/dossiers',50),
  ('ANALYSTE','Analyste credit','Evalue le risque et prepare la decision.','DCR','ALL','/dossiers',60),
  ('COMITE','Membre du comite','Delibere et signe les decisions de credit.','COMITE','ALL','/dossiers',70),
  ('RISQUES_BET','Bureau d etudes techniques','Produit l avis technique et le suivi de chantier.','PART-BET','OWN_FILES','/dossiers',80),
  ('NOTAIRE','Notaire','Instrumente les actes et suretes.','PART-NOTAIRE','OWN_FILES','/dossiers',90),
  ('RECOUVREMENT','Agent de recouvrement','Traite les impayes et les contentieux.','DRAC','ALL','/recouvrement',100),
  ('ARCHIVISTE','Archiviste / GED','Classe et restitue les pieces.','SDA','ALL','/dossiers',110),
  ('AUDIT','Auditeur','Lecture seule sur les dossiers, roles et audit.','SDA-AUDIT','ALL','/audit',120),
  ('CITIZEN','Client','Accede a ses propres dossiers.','CITIZEN','OWN_FILES','/espace-client',130)
on conflict (code) do update set label = excluded.label, description = excluded.description,
  pole_code = excluded.pole_code, scope = excluded.scope, landing_path = excluded.landing_path, sort_order = excluded.sort_order;

with grants (role_code, caps) as (
  select * from jsonb_each('{
    "ADMIN": ["dossier:read","dossier:create","dossier:update","kyc:read","kyc:verify","document:read","document:upload","document:validate","document:reject","savings:read","savings:validate","savings:credit","loan_offer:read","loan_offer:create","loan_offer:issue","committee:read","committee:deliberate","committee:sign","notary:read","notary:record","disbursement:read","disbursement:release","disbursement:reconcile","workflow:read","workflow:manage","workflow:execute","message:read","message:send","email:read","email:send","email:manage","admin:users","admin:roles","admin:audit","catalogue:write"],
    "PMO": ["dossier:read","workflow:read","workflow:manage","workflow:execute","message:read","message:send","email:read","email:send","email:manage","admin:users","admin:roles","admin:audit","catalogue:write"],
    "GUICHET": ["dossier:read","dossier:create","dossier:update","kyc:read","kyc:verify","document:read","document:upload","savings:read","savings:validate","workflow:read","workflow:execute","message:read","message:send","email:read","email:send"],
    "DIASPORA": ["dossier:read","dossier:create","dossier:update","kyc:read","kyc:verify","document:read","document:upload","savings:read","workflow:read","workflow:execute","message:read","message:send","email:read","email:send"],
    "GESTIONNAIRE": ["dossier:read","dossier:update","kyc:read","document:read","document:validate","document:reject","savings:read","loan_offer:read","committee:read","workflow:read","workflow:execute","message:read","message:send","email:read","email:send"],
    "ANALYSTE": ["dossier:read","dossier:update","kyc:read","document:read","document:validate","savings:read","loan_offer:read","loan_offer:create","loan_offer:issue","committee:read","committee:deliberate","disbursement:read","workflow:read","workflow:execute","message:read","message:send","email:read","email:send"],
    "COMITE": ["dossier:read","kyc:read","document:read","loan_offer:read","committee:read","committee:deliberate","committee:sign","workflow:read","workflow:execute","message:read","message:send"],
    "RISQUES_BET": ["dossier:read","document:read","document:upload","workflow:read","workflow:execute","message:read","message:send"],
    "NOTAIRE": ["dossier:read","document:read","document:upload","notary:read","notary:record","workflow:read","workflow:execute","message:read","message:send"],
    "RECOUVREMENT": ["dossier:read","document:read","savings:read","disbursement:read","workflow:read","workflow:execute","message:read","message:send","email:read","email:send"],
    "ARCHIVISTE": ["dossier:read","document:read","document:validate","message:read","message:send"],
    "AUDIT": ["dossier:read","document:read","workflow:read","message:read","email:read","admin:users","admin:roles","admin:audit"],
    "CITIZEN": ["dossier:read","dossier:create","document:read","document:upload","savings:read","message:read","message:send","email:read"]
  }'::jsonb)
)
insert into ref.role_capability (role_code, capability)
select g.role_code, c.value from grants g
cross join lateral jsonb_array_elements_text(g.caps) as c(value)
on conflict (role_code, capability) do nothing;

insert into ref.chemise_readable_by (chemise_code, role_code) values
  ('C1','ADMIN'),('C1','PMO'),('C1','GUICHET'),('C1','DIASPORA'),('C1','GESTIONNAIRE'),('C1','ANALYSTE'),('C1','COMITE'),('C1','RISQUES_BET'),('C1','NOTAIRE'),('C1','RECOUVREMENT'),('C1','ARCHIVISTE'),('C1','AUDIT'),('C1','CITIZEN'),
  ('C2','ADMIN'),('C2','PMO'),('C2','GUICHET'),('C2','DIASPORA'),('C2','GESTIONNAIRE'),('C2','ANALYSTE'),('C2','COMITE'),('C2','RISQUES_BET'),('C2','NOTAIRE'),('C2','ARCHIVISTE'),('C2','AUDIT'),
  ('C3','ADMIN'),('C3','PMO'),('C3','GESTIONNAIRE'),('C3','ANALYSTE'),('C3','COMITE'),('C3','NOTAIRE'),('C3','RECOUVREMENT'),('C3','ARCHIVISTE'),('C3','AUDIT')
on conflict do nothing;

drop policy if exists process_write on ref.process;
create policy process_write on ref.process for all to authenticated
  using ((select private."current_role"()) = 'ADMIN' or (select private.has_capability((select private."current_role"()), 'catalogue:write')))
  with check ((select private."current_role"()) = 'ADMIN' or (select private.has_capability((select private."current_role"()), 'catalogue:write')));

drop policy if exists process_step_write on ref.process_step;
create policy process_step_write on ref.process_step for all to authenticated
  using ((select private."current_role"()) = 'ADMIN' or (select private.has_capability((select private."current_role"()), 'catalogue:write')))
  with check ((select private."current_role"()) = 'ADMIN' or (select private.has_capability((select private."current_role"()), 'catalogue:write')));

drop policy if exists process_rupture_write on ref.process_rupture;
create policy process_rupture_write on ref.process_rupture for all to authenticated
  using ((select private."current_role"()) = 'ADMIN')
  with check ((select private."current_role"()) = 'ADMIN');

create or replace view public.cfc_pole_scope as
  select r.pole_code as pole_code, min(r.scope) as scope, count(*)::int as role_count
  from ref.role r where r.deleted_at is null and r.pole_code is not null
  group by r.pole_code;
grant select on public.cfc_pole_scope to authenticated;
;
