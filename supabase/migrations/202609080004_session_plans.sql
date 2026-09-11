alter table public.life_records drop constraint life_records_kind_check;
alter table public.life_records add constraint life_records_kind_check check(kind in ('person','album','note','story','plan'));
-- Pilot sharing refusals remain stronger than a family membership grant.
create or replace function public.family_access(patient uuid,write_access boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select patient=auth.uid() or (
 exists(select 1 from public.family_memberships m where m.owner_id=patient and m.member_id=auth.uid() and m.active and (not write_access or m.role='caregiver'))
 and not exists(select 1 from public.pilot_consents c where c.patient_id=patient and not c.caregiver_sharing_allowed)
 );
$$;
drop policy "contributors add memories" on public.memories;
create policy "contributors add memories" on public.memories for insert to authenticated with check(
 public.family_access(owner_id) and safety='review' and exists(select 1 from public.family_memberships m where m.owner_id=memories.owner_id and m.member_id=auth.uid() and m.active and m.role='contributor')
);
drop policy "contributors add stories" on public.life_records;
create policy "contributors add stories" on public.life_records for insert to authenticated with check(
 public.family_access(owner_id) and kind in ('story','note') and (kind<>'story' or data->>'status'='unverified') and exists(select 1 from public.family_memberships m where m.owner_id=life_records.owner_id and m.member_id=auth.uid() and m.active and m.role='contributor')
);
