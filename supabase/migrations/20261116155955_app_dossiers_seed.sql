
create temp table _seed_dossiers (
  duc text, name text, owner_email text, agency_code text, citizen_email text, is_diaspora boolean,
  project_type text, project_title text, project_cost numeric, loan_amount numeric, rate numeric,
  duration_years smallint, monthly_income numeric, savings_target numeric, savings_current numeric,
  status text, phase text, step text, progress smallint, completion smallint, risk text, rating text,
  due_in_days int, created_days_ago int, cni text, phone text, email text, city text, region text
) on commit drop;

insert into _seed_dossiers values
 ('CFC-2026-1001','Construction villa Bonapriso','guichet@cfc.local','AG-DLA','client@cfc.local',false,'Villa individuelle','Construction villa 4 pieces',45000000,30000000,7.5,15,900000,9000000,3100000,'open','kyc_savings','CRD-02',15,40,'LOW','A',45,120,'1122334455','+237 690 11 22 33','client@cfc.local','Douala','Littoral'),
 ('CFC-2026-1002','Extension maison Makepe','guichet@cfc.local','AG-DLA',null,false,'Extension','Extension 2 pieces',25000000,15000000,8.0,10,600000,5000000,1800000,'open','risk_bet','CRD-06',45,60,'STANDARD','B',30,95,'2233445567','+237 690 11 22 34','m.bele@example.cm','Douala','Littoral'),
 ('CFC-2026-1003','Achat terrain Ndokoti','gestionnaire@cfc.local','AG-DLA',null,false,'Terrain','Achat terrain avec titre',18000000,12000000,8.5,7,700000,4000000,4000000,'open','committees','CRD-08',70,80,'STANDARD','A',20,80,'3344556678','+237 690 11 22 35','a.ngono@example.cm','Douala','Littoral'),
 ('CFC-2026-1004','Renovation appartement Akwa','guichet@cfc.local','AG-DLA',null,false,'Renovation','Renovation complete',12000000,8000000,9.0,5,450000,2500000,700000,'on_hold','risk_bet','CRD-04',35,30,'HIGH','C',-5,60,'4455667789','+237 690 11 22 36','p.tchana@example.cm','Douala','Littoral'),
 ('CFC-2026-1005','Villa diaspora Douala','diaspora@cfc.local','AG-DIA',null,true,'Villa individuelle','Construction villa diaspora',60000000,40000000,7.2,20,2500000,12000000,9000000,'open','notary_mortgage','CRD-11',85,90,'LOW','A',25,150,'5566778890','+33 6 11 22 33','d.mbappe@example.fr','Douala','Littoral'),
 ('CFC-2026-1006','Immeuble locatif Bonamoussadi','gestionnaire@cfc.local','AG-DLA',null,false,'Immeuble','Immeuble 6 appartements',120000000,75000000,7.0,20,3500000,20000000,18000000,'open','disbursements','CRD-12',95,95,'STANDARD','A',12,300,'6677889901','+237 690 11 22 37','s.invest@example.cm','Douala','Littoral'),
 ('CFC-2026-1007','Maison familiale Bafoussam','guichet@cfc.local','AG-DLA',null,false,'Maison','Construction maison familiale',22000000,14000000,7.8,12,650000,4500000,4500000,'closed','closing_release','CRD-13',100,100,'LOW','A',null,400,'7788990012','+237 690 11 22 41','b.familial@example.cm','Bafoussam','Ouest'),
 ('CFC-2026-1008','Studio Yaounde Bastos','gestionnaire@cfc.local','AG-DLA',null,false,'Studio','Acquisition studio',35000000,25000000,8.2,10,1200000,7000000,500000,'on_hold','kyc_savings','CRD-01',5,10,'HIGH','C',-12,25,'8899001123','+237 690 11 22 38','j.ella@example.cm','Yaounde','Centre'),
 ('CFC-2026-1009','Villa diaspora Montreal','diaspora@cfc.local','AG-DIA',null,true,'Villa individuelle','Construction villa diaspora',85000000,55000000,7.4,18,3000000,15000000,6000000,'open','risk_bet','CRD-06',40,55,'STANDARD','B',40,110,'9900112234','+1 514 11 22 33','k.fotso@example.ca','Douala','Littoral'),
 ('CFC-2026-1010','Residence Mvog-Ada','guichet@cfc.local','AG-DLA',null,false,'Immeuble','Petit immeuble 3 appartements',48000000,30000000,7.9,15,950000,8000000,5200000,'open','committees','CRD-07',60,70,'STANDARD','B',18,90,'1011121345','+237 690 11 22 39','r.mvog@example.cm','Yaounde','Centre'),
 ('CFC-2026-1011','Duplex Logbessou','gestionnaire@cfc.local','AG-DLA',null,false,'Duplex','Construction duplex',38000000,24000000,7.6,14,800000,7000000,7000000,'closed','closing_release','CRD-13',100,100,'LOW','A',null,500,'2122232456','+237 690 11 22 40','t.logb@example.cm','Douala','Littoral'),
 ('CFC-2026-1012','Terrain et construction Edea','guichet@cfc.local','AG-DLA',null,false,'Terrain','Terrain plus construction',15000000,9000000,8.4,8,400000,3000000,750000,'open','kyc_savings','CRD-03',25,20,'HIGH','C',60,40,'3233343567','+237 690 11 22 42','e.terrain@example.cm','Edea','Littoral');

insert into public.dossiers (
  duc_code, citizen_id, owner_user_id, agency_id, service_code, product_code, is_diaspora,
  name, cni_raw, phone, email, address, city, region, agency, advisor,
  project_type, project_title, project_cost, savings_percent, savings_target, savings_current,
  monthly_income, loan_amount, rate, duration_years, monthly_payment, debt_ratio,
  risk_level, rating, status, current_phase, current_step, progress, completion_percent,
  entered_phase_at, sla_deadline, created_at, closed_at
)
select
  d.duc, cs.id, ow.id, ag.id, 'CRD', 'CRD-STD', d.is_diaspora,
  d.name, d.cni, d.phone, d.email, 'Douala', d.city, d.region, ag.label, owp.full_name,
  d.project_type, d.project_title, d.project_cost,
  round(d.savings_current / nullif(d.savings_target, 0) * 100),
  d.savings_target, d.savings_current,
  d.monthly_income, d.loan_amount, d.rate, d.duration_years,
  round(d.loan_amount * (d.rate / 1200) / (1 - power(1 + d.rate / 1200, -d.duration_years * 12)), 0),
  round((d.loan_amount * (d.rate / 1200) / (1 - power(1 + d.rate / 1200, -d.duration_years * 12))) / d.monthly_income * 100, 2),
  d.risk, d.rating, d.status, d.phase, d.step, d.progress, d.completion,
  now() - interval '5 days',
  case when d.due_in_days is null then null else now() + make_interval(days => d.due_in_days) end,
  now() - make_interval(days => d.created_days_ago),
  case when d.status = 'closed' then now() - interval '2 days' else null end
from _seed_dossiers d
left join auth.users cs on cs.email = d.citizen_email
join auth.users ow on ow.email = d.owner_email
join public.agencies ag on ag.code = d.agency_code
left join public.staff_profiles owp on owp.id = ow.id
where not exists (select 1 from public.dossiers x where x.duc_code = d.duc);
;
