create table public.family_memberships (
 owner_id uuid not null references auth.users(id) on delete cascade,
 member_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('viewer','contributor','caregiver')),
 active boolean not null default true,
 created_at timestamptz not null default now(), primary key(owner_id,member_id), check(owner_id<>member_id)
);
create table public.family_invitations (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 token_hash text not null unique,role text not null check(role in ('viewer','contributor','caregiver')),
 expires_at timestamptz not null default now()+interval '7 days',accepted_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table public.family_memberships enable row level security;
alter table public.family_invitations enable row level security;
create policy "read own memberships" on public.family_memberships for select to authenticated using(member_id=auth.uid() or owner_id=auth.uid());
create policy "owner manages memberships" on public.family_memberships for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "owner reads invitations" on public.family_invitations for select to authenticated using(owner_id=auth.uid());
create function public.family_access(patient uuid,write_access boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select patient=auth.uid() or exists(select 1 from public.family_memberships m where m.owner_id=patient and m.member_id=auth.uid() and m.active and (not write_access or m.role='caregiver'));
$$;
create policy "family reads profile" on public.patient_profiles for select to authenticated using(public.family_access(owner_id));
create policy "caregiver manages profile" on public.patient_profiles for all to authenticated using(public.family_access(owner_id,true)) with check(public.family_access(owner_id,true));
create policy "family reads memories" on public.memories for select to authenticated using(public.family_access(owner_id));
create policy "caregiver manages memories" on public.memories for all to authenticated using(public.family_access(owner_id,true)) with check(public.family_access(owner_id,true));
create policy "contributors add memories" on public.memories for insert to authenticated with check(exists(select 1 from public.family_memberships m where m.owner_id=memories.owner_id and m.member_id=auth.uid() and m.active and m.role='contributor') and safety='review');
create policy "family reads life records" on public.life_records for select to authenticated using(public.family_access(owner_id));
create policy "caregiver manages life records" on public.life_records for all to authenticated using(public.family_access(owner_id,true)) with check(public.family_access(owner_id,true));
create policy "contributors add stories" on public.life_records for insert to authenticated with check(kind in ('story','note') and (kind<>'story' or data->>'status'='unverified') and exists(select 1 from public.family_memberships m where m.owner_id=life_records.owner_id and m.member_id=auth.uid() and m.active and m.role='contributor'));
create policy "family reads sessions" on public.therapy_sessions for select to authenticated using(public.family_access(owner_id));
create policy "caregiver manages sessions" on public.therapy_sessions for all to authenticated using(public.family_access(owner_id,true)) with check(public.family_access(owner_id,true));
create policy "family reads turns" on public.session_turns for select to authenticated using(public.family_access(owner_id));
create policy "caregiver writes turns" on public.session_turns for all to authenticated using(public.family_access(owner_id,true)) with check(public.family_access(owner_id,true) and exists(select 1 from public.therapy_sessions s where s.id=session_id and s.owner_id=session_turns.owner_id));
create policy "family reads summaries" on public.session_summaries for select to authenticated using(public.family_access(owner_id));
create policy "family reads notes" on public.family_notes for select to authenticated using(public.family_access(owner_id));
create policy "family reads observations" on public.stimulus_observations for select to authenticated using(public.family_access(owner_id));
create policy "family reads graph" on public.memory_graph_edges for select to authenticated using(public.family_access(owner_id));
create policy "family reads learning" on public.longitudinal_memory_states for select to authenticated using(public.family_access(owner_id));
create policy "family reads decisions" on public.selection_decisions for select to authenticated using(public.family_access(owner_id));
-- Signed URLs resolve only through a memory in an accessible workspace.
create policy "family reads contributed media" on storage.objects for select to authenticated using(bucket_id='memories' and exists(select 1 from public.memories m where m.storage_path=name and public.family_access(m.owner_id)));
create policy "caregiver deletes contributed media" on storage.objects for delete to authenticated using(bucket_id='memories' and exists(select 1 from public.memories m where m.storage_path=name and public.family_access(m.owner_id,true)));
-- Single-use invitation redemption is atomic. Tokens are stored only as hashes.
create function public.accept_family_invitation(invitation_hash text,member uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare invite public.family_invitations;begin
 select * into invite from public.family_invitations where token_hash=invitation_hash and accepted_by is null and expires_at>now() for update;
 if invite.id is null or invite.owner_id=member then raise exception 'Invitation unavailable';end if;
 insert into public.family_memberships(owner_id,member_id,role) values(invite.owner_id,member,invite.role) on conflict(owner_id,member_id) do update set role=excluded.role,active=true;
 update public.family_invitations set accepted_by=member where id=invite.id;
 return invite.owner_id;end;$$;
revoke all on function public.accept_family_invitation(text,uuid) from public,anon,authenticated;
grant execute on function public.accept_family_invitation(text,uuid) to service_role;
