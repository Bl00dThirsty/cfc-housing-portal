
alter table public.staff_assignments drop constraint if exists staff_assignments_role_check;
alter table public.staff_assignments drop constraint if exists staff_assignments_role_fkey;
alter table public.staff_assignments
  add constraint staff_assignments_role_fkey foreign key (role) references ref.role (code) on update cascade;

insert into public.agencies (code, label, city, region, country, is_diaspora_desk)
select v.code, v.label, v.city, v.region, 'CM', v.diaspora
from (values
  ('AG-DLA', 'Agence de Douala Bonanjo', 'Douala', 'Littoral', false),
  ('AG-YDE', 'Agence de Yaounde Centre', 'Yaounde', 'Centre', false),
  ('AG-DIA', 'Diaspora Desk', 'Paris', 'Ile-de-France', true)
) as v(code, label, city, region, diaspora)
where not exists (select 1 from public.agencies a where a.code = v.code);

create temp table _seed_users (
  email text, full_name text, role text, agency_code text, job_title text, department text, phone text, tone text
) on commit drop;

insert into _seed_users values
  ('admin@cfc.local',        'Ariane Mbarga',      'ADMIN',        'AG-YDE', 'Administratrice plateforme', 'Direction Generale', '+237 690 00 00 01', 'amber'),
  ('pmo@cfc.local',          'Pascal Nkoulou',     'PMO',          'AG-YDE', 'Responsable PMO',            'Direction Generale', '+237 690 00 00 02', 'violet'),
  ('guichet@cfc.local',      'Clarisse Ewane',     'GUICHET',      'AG-DLA', 'Chargee de clientele',       'Reseau Commercial',  '+237 690 00 00 03', 'sky'),
  ('diaspora@cfc.local',     'Yannick Fotso',      'DIASPORA',     'AG-DIA', 'Conseiller diaspora',        'Diaspora Desk',      '+33 6 00 00 00 04', 'teal'),
  ('gestionnaire@cfc.local', 'Bertrand Onana',     'GESTIONNAIRE', 'AG-DLA', 'Gestionnaire credit',        'Direction du Credit','+237 690 00 00 05', 'emerald'),
  ('analyste@cfc.local',     'Sandrine Ngo Bassong','ANALYSTE',    'AG-YDE', 'Analyste credit',            'Direction du Credit','+237 690 00 00 06', 'indigo'),
  ('comite@cfc.local',       'Honore Tchoumi',     'COMITE',       'AG-YDE', 'President du comite',        'Comite de Credit',   '+237 690 00 00 07', 'rose'),
  ('notaire@cfc.local',      'Maitre Alice Kamdem', 'NOTAIRE',     null,     'Notaire partenaire',         'Etude Kamdem',       '+237 690 00 00 08', 'stone'),
  ('recouvrement@cfc.local', 'Serge Mballa',       'RECOUVREMENT', 'AG-DLA', 'Agent de recouvrement',      'Recouvrement',       '+237 690 00 00 09', 'orange'),
  ('audit@cfc.local',        'Nadine Essomba',     'AUDIT',        'AG-YDE', 'Auditrice interne',          'Audit Interne',      '+237 690 00 00 10', 'slate'),
  ('client@cfc.local',       'Jean-Pierre Abena',  'CITIZEN',      null,     'Client particulier',         null,                 '+237 690 00 00 11', 'cyan');

create temp table _seed_ids (email text primary key, uid uuid) on commit drop;

do $$
declare r record; v_id uuid;
begin
  for r in select * from _seed_users loop
    select u.id into v_id from auth.users u where u.email = r.email;
    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new,
        email_change_token_current, email_change, email_change_confirm_status,
        phone_change, phone_change_token, reauthentication_token,
        raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        r.email, extensions.crypt('Cfc2026!', extensions.gen_salt('bf')),
        now(), now(), now(), '', '', '', '', '', 0, '', '', '',
        jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role',r.role),
        jsonb_build_object('full_name', r.full_name), false, false
      );
      insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_id::text, v_id,
              jsonb_build_object('sub', v_id::text, 'email', r.email, 'email_verified', true),
              'email', now(), now(), now());
    end if;
    insert into _seed_ids values (r.email, v_id) on conflict (email) do update set uid = excluded.uid;
  end loop;
end $$;

insert into public.actors (id, actor_type)
select s.uid, case when u.role = 'CITIZEN' then 'citizen' else 'staff' end
from _seed_users u join _seed_ids s using (email)
where not exists (select 1 from public.actors a where a.id = s.uid);

insert into public.staff_profiles (id, full_name, pole, job_title, department, agency_id, phone, avatar_tone, initials)
select s.uid, u.full_name, r.pole_code, u.job_title, u.department, a.id, u.phone, u.tone,
       upper(left(replace(u.full_name, ' ', ''), 2))
from _seed_users u
join _seed_ids s using (email)
join ref.role r on r.code = u.role
left join public.agencies a on a.code = u.agency_code
where u.role <> 'CITIZEN'
  and not exists (select 1 from public.staff_profiles sp where sp.id = s.uid);

insert into public.staff_assignments (actor_id, role, scope, agency_id)
select s.uid, u.role, r.scope, a.id
from _seed_users u
join _seed_ids s using (email)
join ref.role r on r.code = u.role
left join public.agencies a on a.code = u.agency_code
where u.role <> 'CITIZEN'
  and not exists (select 1 from public.staff_assignments sa where sa.actor_id = s.uid and sa.deleted_at is null);

insert into public.citizen_profiles (id, full_name, affiliation_status, cni_raw, phone, email, address, city, region, kyc_state, risk_rating, is_diaspora)
select s.uid, 'Jean-Pierre Abena', 'first_time', '1122334455', '+237 690 00 00 11', 'client@cfc.local',
       'Rue 12, Bonapriso', 'Douala', 'Littoral', 'approved', 'LOW', false
from _seed_ids s
where s.email = 'client@cfc.local'
  and not exists (select 1 from public.citizen_profiles cp where cp.id = s.uid);
;
