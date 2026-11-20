-- 031 — La décision de l'agent sur une pièce.
--
-- `document:validate` et `document:reject` existaient dans la matrice des
-- habilitations, et **aucune action ne les exerçait** : personne ne pouvait
-- dire à l'emprunteur que sa pièce était retenue, ni lui demander de la
-- refaire. Deux capacités sans effet sont deux mensonges.
--
-- La décision passe par une fonction atomique, comme l'activation du DUC
-- (migration 030) : la pièce change d'état et la décision est journalisée
-- dans le même fait. La RLS autorise déjà la mise à jour ; c'est
-- l'**application** de la décision qui manquait — avec sa trace.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le type de notification : une pièce rejetée a son propre signal
-- ---------------------------------------------------------------------------

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (type in (
    'kyc.decision', 'document.requested', 'document.validated',
    'document.rejected', 'document.uploaded', 'committee.decision',
    'loan.offer', 'disbursement.released', 'payoff.statement',
    'mainlevee.ready', 'support.message', 'dossier.updated'
  ));

-- ---------------------------------------------------------------------------
-- La décision sur une pièce
-- ---------------------------------------------------------------------------

create or replace function public.decide_dossier_document(
  p_document_id uuid,
  p_decision text,
  p_note text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  document_row public.dossier_documents%rowtype;
  dossier_row public.dossiers%rowtype;
  decision text;
  note text;
  event_type text;
  new_status text;
begin
  if p_document_id is null then
    raise exception 'document_required' using errcode = '42501';
  end if;

  decision := lower(trim(coalesce(p_decision, '')));
  if decision not in ('validated', 'rejected') then
    raise exception 'unknown_document_decision' using errcode = '42501';
  end if;

  -- **Valider** et **rejeter** sont deux capacités distinctes : l'unité qui
  -- contrôle la pièce ne valide pas la pièce.
  if decision = 'validated'
     and not (select private.has_capability((select private.current_role()), 'document:validate')) then
    raise exception 'document_validate_forbidden' using errcode = '42501';
  end if;

  if decision = 'rejected'
     and not (select private.has_capability((select private.current_role()), 'document:reject')) then
    raise exception 'document_reject_forbidden' using errcode = '42501';
  end if;

  select * into document_row
  from public.dossier_documents
  where id = p_document_id
    and deleted_at is null;

  if document_row.id is null then
    raise exception 'document_not_found' using errcode = '42501';
  end if;

  select * into dossier_row
  from public.dossiers
  where id = document_row.dossier_id
    and deleted_at is null;

  if dossier_row.id is null then
    raise exception 'dossier_not_found' using errcode = '42501';
  end if;

  if not (select private.can_act_on_dossier(
    (select private.current_pole()),
    dossier_row.owner_user_id,
    dossier_row.agency_id,
    dossier_row.is_diaspora,
    dossier_row.id
  )) then
    raise exception 'document_decision_forbidden' using errcode = '42501';
  end if;

  -- On ne décide pas d'une pièce qui n'est pas déposée.
  if document_row.status not in ('uploaded', 'under_review') then
    raise exception 'document_not_decidable' using errcode = '42501';
  end if;

  note := trim(coalesce(p_note, ''));

  -- Un rejet se motive : sans motif, l'emprunteur ne sait pas quoi refaire.
  if decision = 'rejected' and note = '' then
    raise exception 'motif_required' using errcode = '42501';
  end if;

  new_status := decision;
  event_type := case when decision = 'validated' then 'DOCUMENT_VALIDATED' else 'DOCUMENT_REJECTED' end;

  update public.dossier_documents
  set status = new_status,
      validated_by = (select auth.uid()),
      validated_at = now(),
      rejection_reason = case when decision = 'rejected' then note else null end,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = document_row.id;

  insert into public.dossier_events (
    dossier_id, event_type, actor_id, actor_role, payload, legal_basis, occurred_at
  )
  values (
    dossier_row.id,
    event_type,
    (select auth.uid()),
    (select private.current_role()),
    jsonb_build_object(
      'document_id', document_row.id,
      'doc_type_code', document_row.doc_type_code,
      'decision', decision,
      'note', nullif(note, ''),
      'duc_code', dossier_row.duc_code
    ),
    'COBAC R-2023/01 — lignes directrices LC-COB/01',
    now()
  );

  return event_type;
end $function$;

comment on function public.decide_dossier_document(uuid, text, text) is
  'Decide sur une piece deposee : elle est validee, ou rejetee avec un motif. La decision et sa trace sont atomiques.';

revoke all on function public.decide_dossier_document(uuid, text, text) from public;
grant execute on function public.decide_dossier_document(uuid, text, text) to authenticated, service_role;
