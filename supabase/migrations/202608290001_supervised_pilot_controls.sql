-- Supervised-pilot governance, consent, role grants, review, and audit controls.
create type public.mori_pilot_role as enum ('patient', 'caregiver', 'supervisor', 'clinician', 'administrator');
create type public.mori_consent_decision as enum ('not_started', 'pending', 'granted', 'withdrawn');
create type public.mori_incident_severity as enum ('low', 'medium', 'high', 'critical');

create table public.pilot_memberships (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role public.mori_pilot_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (patient_id, member_id, role)
);

create table public.pilot_consents (
  patient_id uuid primary key references auth.users(id) on delete cascade,
  patient_consent public.mori_consent_decision not null default 'not_started',
  representative_consent public.mori_consent_decision not null default 'not_started',
  current_assent public.mori_consent_decision not null default 'not_started',
  photos_allowed boolean not null default false,
  audio_allowed boolean not null default false,
  transcript_allowed boolean not null default false,
  caregiver_sharing_allowed boolean not null default false,
  research_use_allowed boolean not null default false,
  signed_by text,
  signed_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.supervisor_actions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.therapy_sessions(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('pause','resume','stop','distress','remove_stimulus','acknowledge')),
  reason text,
  created_at timestamptz not null default now()
);

create table public.pilot_incidents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.therapy_sessions(id) on delete set null,
  severity public.mori_incident_severity not null,
  category text not null,
  description text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.caregiver_reviews (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.therapy_sessions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  resource_type text not null check (resource_type in ('summary','reflection','observation','memory')),
  resource_id uuid,
  decision text not null check (decision in ('approved','corrected','rejected','sensitive','delete_requested')),
  correction text,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('export','correct','restrict','delete')),
  status text not null default 'open' check (status in ('open','verified','processing','complete','denied')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index pilot_memberships_member_idx on public.pilot_memberships(member_id) where active;
create index supervisor_actions_session_idx on public.supervisor_actions(session_id, created_at desc);
create index pilot_incidents_patient_idx on public.pilot_incidents(patient_id, created_at desc);
create index audit_events_patient_idx on public.audit_events(patient_id, created_at desc);

alter table public.pilot_memberships enable row level security;
alter table public.pilot_consents enable row level security;
alter table public.supervisor_actions enable row level security;
alter table public.pilot_incidents enable row level security;
alter table public.caregiver_reviews enable row level security;
alter table public.audit_events enable row level security;
alter table public.data_subject_requests enable row level security;

create function public.has_pilot_role(target_patient uuid, allowed_roles public.mori_pilot_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select target_patient = auth.uid() or exists (
  select 1 from public.pilot_memberships m where m.patient_id = target_patient and m.member_id = auth.uid() and m.active and m.role = any(allowed_roles)
) $$;

create policy "patient reads own consent" on public.pilot_consents for select to authenticated using (patient_id = auth.uid());
create policy "authorized staff read consent" on public.pilot_consents for select to authenticated using (public.has_pilot_role(patient_id, array['caregiver','supervisor','clinician','administrator']::public.mori_pilot_role[]));
create policy "authorized staff manage consent" on public.pilot_consents for all to authenticated using (public.has_pilot_role(patient_id, array['supervisor','clinician','administrator']::public.mori_pilot_role[])) with check (public.has_pilot_role(patient_id, array['supervisor','clinician','administrator']::public.mori_pilot_role[]));
create policy "members see memberships" on public.pilot_memberships for select to authenticated using (patient_id = auth.uid() or member_id = auth.uid());
create policy "supervisors write actions" on public.supervisor_actions for insert to authenticated with check (actor_id = auth.uid() and public.has_pilot_role(patient_id, array['supervisor','clinician','administrator']::public.mori_pilot_role[]));
create policy "care team reads actions" on public.supervisor_actions for select to authenticated using (public.has_pilot_role(patient_id, array['caregiver','supervisor','clinician','administrator']::public.mori_pilot_role[]));
create policy "care team reads incidents" on public.pilot_incidents for select to authenticated using (public.has_pilot_role(patient_id, array['caregiver','supervisor','clinician','administrator']::public.mori_pilot_role[]));
create policy "care team reviews" on public.caregiver_reviews for all to authenticated using (reviewer_id = auth.uid() and public.has_pilot_role(patient_id, array['caregiver','supervisor','clinician']::public.mori_pilot_role[])) with check (reviewer_id = auth.uid() and public.has_pilot_role(patient_id, array['caregiver','supervisor','clinician']::public.mori_pilot_role[]));
create policy "patient and administrators read audit" on public.audit_events for select to authenticated using (patient_id = auth.uid() or public.has_pilot_role(patient_id, array['administrator']::public.mori_pilot_role[]));
create policy "patient manages requests" on public.data_subject_requests for all to authenticated using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Incident and audit inserts should use the server service role. Audit rows should
-- be retained according to the approved pilot data-management policy.
