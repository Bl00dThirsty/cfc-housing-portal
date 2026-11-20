-- Workflow catalogue edits use the same capability checks and audit trail as
-- the rest of the reference data.  Ordering is a separate operation so the
-- existing 7-argument save RPC remains backward compatible.

select private.attach_audit_trigger('ref.process');
select private.attach_audit_trigger('ref.process_step');

create or replace function public.cfc_set_process_step_order(
  p_code text,
  p_sort_order integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not (select private.has_capability((select private.current_role()), 'workflow:manage')) then
    raise exception 'workflow_manage_forbidden' using errcode = '42501';
  end if;
  if p_sort_order < 0 then
    raise exception 'invalid_sort_order' using errcode = '22023';
  end if;

  update ref.process_step
  set sort_order = p_sort_order
  where code = upper(trim(coalesce(p_code, '')))
    and deleted_at is null;
  if not found then
    raise exception 'process_step_not_found' using errcode = 'P0002';
  end if;
  return true;
end
$function$;

revoke all on function public.cfc_set_process_step_order(text, integer) from public, anon;
grant execute on function public.cfc_set_process_step_order(text, integer) to authenticated;
