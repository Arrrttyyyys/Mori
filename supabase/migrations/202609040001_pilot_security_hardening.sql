-- Security hardening discovered during the pre-pilot authorization review.

-- Participants may see reviews concerning their own records. Review writes
-- remain limited to explicitly granted care-team roles.
create policy "patient reads caregiver reviews" on public.caregiver_reviews
for select to authenticated using (patient_id = auth.uid());

-- Audit records are append-only for application roles. The service role can
-- still perform approved retention operations because it bypasses RLS.
create policy "no authenticated audit updates" on public.audit_events
for update to authenticated using (false);
create policy "no authenticated audit deletes" on public.audit_events
for delete to authenticated using (false);

-- Avoid duplicate open requests caused by retries/double-clicks.
create unique index data_subject_requests_one_open_per_type
on public.data_subject_requests(patient_id, request_type)
where status in ('open', 'verified', 'processing');

-- Membership changes are administrative operations. Existing migration only
-- grants SELECT, so authenticated clients cannot self-assign privileged roles.

-- Preserve the conversational close-offer state across process restarts.
alter table public.therapy_sessions
add column if not exists close_offer_turn integer check (close_offer_turn is null or close_offer_turn >= 0);
