
insert into public.savings_accounts (dossier_id, citizen_id, account_number, opening_date, balance, target_amount, interest_rate, status)
select d.id, d.citizen_id, 'EP-' || right(d.duc_code, 4) || '-01', current_date - 200,
       coalesce(d.savings_current, 0), d.savings_target, 3.5, 'active'
from public.dossiers d
where d.duc_code in ('CFC-2026-1001','CFC-2026-1005','CFC-2026-1006')
  and not exists (select 1 from public.savings_accounts a where a.dossier_id = d.id);

insert into public.savings_transactions (account_id, dossier_id, transaction_type, amount, credit, balance_after, channel, reference, validated_at, transaction_date)
select a.id, a.dossier_id, 'deposit', t.amt, t.amt, t.running, t.channel,
       'DEP-' || right(a.account_number, 6) || '-' || t.n,
       now() - make_interval(days => 30 * (5 - t.n)), current_date - 30 * (5 - t.n)
from public.savings_accounts a
cross join (values
  (1, 900000, 900000, 'agency'),
  (2, 700000, 1600000, 'mobile_money_mtn'),
  (3, 800000, 2400000, 'bank_transfer'),
  (4, 700000, 3100000, 'agency')
) as t(n, amt, running, channel)
where a.account_number like 'EP-1001%'
  and not exists (select 1 from public.savings_transactions x where x.account_id = a.id);

insert into public.notifications (recipient_user_id, type, title, body, dossier_id, action_url, created_at)
select u.id, v.ntype, v.title, v.body, d.id, '/dossiers/' || d.id::text, now() - v.age
from (values
  ('guichet@cfc.local','dossier.updated','Dossier mis a jour','CFC-2026-1001 est passe a l etape CRD-02.','CFC-2026-1001', interval '2 hours'),
  ('guichet@cfc.local','document.requested','Piece attendue','Le releve bancaire manque sur CFC-2026-1001.','CFC-2026-1001', interval '1 days'),
  ('analyste@cfc.local','dossier.updated','Dossier a instruire','CFC-2026-1003 attend votre avis technique.','CFC-2026-1003', interval '3 hours'),
  ('analyste@cfc.local','committee.decision','Comite planifie','Le comite examine CFC-2026-1010 demain.','CFC-2026-1010', interval '5 hours'),
  ('admin@cfc.local','support.message','Nouveau message','Un message a ete poste sur CFC-2026-1005.','CFC-2026-1005', interval '1 hours'),
  ('diaspora@cfc.local','dossier.updated','Dossier diaspora','CFC-2026-1009 est en analyse risque.','CFC-2026-1009', interval '4 hours'),
  ('recouvrement@cfc.local','dossier.updated','Echeance en retard','CFC-2026-1008 presente une echeance en retard.','CFC-2026-1008', interval '6 hours'),
  ('client@cfc.local','dossier.updated','Votre dossier avance','Votre dossier CFC-2026-1001 est en instruction.','CFC-2026-1001', interval '2 days')
) as v(email, ntype, title, body, duc, age)
join auth.users u on u.email = v.email
join public.dossiers d on d.duc_code = v.duc
where not exists (
  select 1 from public.notifications n
  where n.recipient_user_id = u.id and n.title = v.title and n.dossier_id = d.id);

insert into public.support_messages (room_name, dossier_id, author_user_id, author_name, author_role, content, created_at)
select 'dossier:' || d.duc_code, d.id, u.id,
       coalesce(sp.full_name, u.raw_user_meta_data->>'full_name', u.email),
       v.role_label, v.content, now() - v.age
from (values
  ('CFC-2026-1001','guichet@cfc.local','Charge de clientele','Bonjour, le releve bancaire manque encore pour finaliser l analyse.', interval '2 days'),
  ('CFC-2026-1001','analyste@cfc.local','Analyste credit','Merci, je relance le client aujourd hui.', interval '1 days'),
  ('CFC-2026-1001','client@cfc.local','Client','Je depose le document ce soir.', interval '20 hours'),
  ('CFC-2026-1005','diaspora@cfc.local','Conseiller diaspora','Le mandat notarie est signe, je transmets l acte.', interval '1 days'),
  ('CFC-2026-1005','admin@cfc.local','Administrateur','Bien recu, le dossier peut passer a la mise en place.', interval '18 hours'),
  ('CFC-2026-1003','analyste@cfc.local','Analyste credit','Le ratio d endettement est conforme, avis favorable.', interval '3 days')
) as v(duc, email, role_label, content, age)
join public.dossiers d on d.duc_code = v.duc
join auth.users u on u.email = v.email
left join public.staff_profiles sp on sp.id = u.id
where not exists (select 1 from public.support_messages m where m.dossier_id = d.id and m.content = v.content);

insert into ref.email_template (code, version, label, subject_template, html_template, text_template, event_type, audience, is_active, variables, effective_from)
values
 ('DOSSIER_CREATED', 1, 'Accuse de reception de dossier', 'Votre dossier {{duc_code}} est enregistre',
  '<p>Bonjour {{name}},</p><p>Votre dossier <strong>{{duc_code}}</strong> a bien ete enregistre.</p>',
  'Bonjour {{name}}, votre dossier {{duc_code}} est enregistre.',
  'DOSSIER_CREATED', 'citizen', true, array['name','duc_code'], now() - interval '30 days'),
 ('DOCUMENT_REQUESTED', 1, 'Demande de piece', 'Piece manquante sur le dossier {{duc_code}}',
  '<p>Bonjour {{name}},</p><p>La piece {{document}} est attendue.</p>',
  'Bonjour {{name}}, la piece {{document}} est attendue.',
  'DOCUMENT_REQUESTED', 'citizen', true, array['name','duc_code','document'], now() - interval '30 days'),
 ('STEP_ADVANCED', 1, 'Avancement du dossier', 'Votre dossier {{duc_code}} progresse',
  '<p>Bonjour {{name}},</p><p>Le dossier {{duc_code}} est a l etape {{step}}.</p>',
  'Le dossier {{duc_code}} est a l etape {{step}}.',
  'STEP_ADVANCED', 'citizen', true, array['name','duc_code','step'], now() - interval '30 days'),
 ('COMMITTEE_DECISION', 1, 'Decision du comite', 'Decision sur votre dossier {{duc_code}}',
  '<p>Bonjour {{name}},</p><p>Le comite a rendu sa decision : {{decision}}.</p>',
  'Decision du comite : {{decision}}.',
  'COMMITTEE_DECISION', 'citizen', true, array['name','duc_code','decision'], now() - interval '30 days')
on conflict (code, version) do nothing;

insert into public.email_deliveries (template_code, recipient_email, recipient_user_id, subject, status, provider, payload, sent_at, created_at)
select v.tpl, v.recipient, u.id, v.subject, v.status, 'smtp',
       jsonb_build_object('name', coalesce(u.raw_user_meta_data->>'full_name','Client'), 'duc_code', v.duc),
       case when v.status = 'sent' then now() - v.age else null end, now() - v.age
from (values
  ('DOSSIER_CREATED','client@cfc.local','Votre dossier CFC-2026-1001 est enregistre','sent','CFC-2026-1001', interval '5 days'),
  ('STEP_ADVANCED','client@cfc.local','Votre dossier CFC-2026-1001 progresse','sent','CFC-2026-1001', interval '2 days'),
  ('DOCUMENT_REQUESTED','client@cfc.local','Piece manquante sur le dossier CFC-2026-1001','queued','CFC-2026-1001', interval '6 hours'),
  ('COMMITTEE_DECISION','d.mbappe@example.fr','Decision sur votre dossier CFC-2026-1005','sent','CFC-2026-1005', interval '1 days'),
  ('STEP_ADVANCED','k.fotso@example.ca','Votre dossier CFC-2026-1009 progresse','failed','CFC-2026-1009', interval '3 hours')
) as v(tpl, recipient, subject, status, duc, age)
left join auth.users u on u.email = v.recipient
where not exists (select 1 from public.email_deliveries e where e.recipient_email = v.recipient and e.subject = v.subject);

insert into public.parties (party_type, name, legal_name, email, phone, country)
select 'notary', 'Etude Maitre Kamdem', 'Etude Kamdem SARL', 'notaire@cfc.local', '+237 690 00 00 08', 'CM'
where not exists (select 1 from public.parties p where p.name = 'Etude Maitre Kamdem');

insert into public.dossier_parties (dossier_id, party_id, role_in_dossier, mandate_reference)
select d.id, p.id, 'notary', 'MAND-2026-0007'
from public.dossiers d, public.parties p
where d.duc_code = 'CFC-2026-1003' and p.name = 'Etude Maitre Kamdem'
  and not exists (select 1 from public.dossier_parties dp where dp.dossier_id = d.id and dp.party_id = p.id);

insert into public.grants (party_id, dossier_id, capabilities, valid_from)
select p.id, d.id, array['dossier:read','document:read','notary:record'], now() - interval '10 days'
from public.dossiers d, public.parties p
where d.duc_code = 'CFC-2026-1003' and p.name = 'Etude Maitre Kamdem'
  and not exists (select 1 from public.grants g where g.dossier_id = d.id and g.party_id = p.id);
;
