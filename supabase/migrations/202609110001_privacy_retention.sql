alter table public.supervisor_actions drop constraint if exists supervisor_actions_actor_id_fkey;
alter table public.supervisor_actions alter column actor_id drop not null;
alter table public.supervisor_actions add constraint supervisor_actions_actor_id_fkey foreign key(actor_id) references auth.users(id) on delete set null;

alter table public.caregiver_reviews drop constraint if exists caregiver_reviews_reviewer_id_fkey;
alter table public.caregiver_reviews alter column reviewer_id drop not null;
alter table public.caregiver_reviews add constraint caregiver_reviews_reviewer_id_fkey foreign key(reviewer_id) references auth.users(id) on delete set null;

create or replace function public.purge_mori_expired_data()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb := '{}'::jsonb; affected integer;
begin
  delete from public.family_invitations where expires_at < now() - interval '30 days';
  get diagnostics affected = row_count; result := result || jsonb_build_object('invitations', affected);
  delete from public.therapy_sessions where status = 'closed' and started_at < now() - interval '90 days';
  get diagnostics affected = row_count; result := result || jsonb_build_object('sessions', affected);
  delete from public.stimulus_observations where observed_at < now() - interval '180 days';
  get diagnostics affected = row_count; result := result || jsonb_build_object('observations', affected);
  delete from public.selection_decisions where created_at < now() - interval '180 days';
  get diagnostics affected = row_count; result := result || jsonb_build_object('decisions', affected);
  delete from public.audit_events where created_at < now() - interval '365 days';
  get diagnostics affected = row_count; result := result || jsonb_build_object('audit_events', affected);
  delete from public.data_subject_requests where status = 'complete' and completed_at < now() - interval '365 days';
  get diagnostics affected = row_count; result := result || jsonb_build_object('data_requests', affected);
  return result;
end;
$$;
revoke all on function public.purge_mori_expired_data() from public, anon, authenticated;
grant execute on function public.purge_mori_expired_data() to service_role;
