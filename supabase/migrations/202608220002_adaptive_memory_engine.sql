-- Patient-specific context and feedback loop for Mori's adaptive memory engine.

create type public.mori_stimulus_kind as enum ('memory', 'photo', 'video', 'person', 'place', 'topic');
create type public.mori_consent_status as enum ('allowed', 'review', 'blocked');
create type public.mori_caregiver_assessment as enum ('helpful', 'neutral', 'avoid');

create table public.patient_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  preferred_name text,
  communication_language text,
  communication_preferences jsonb not null default '{}',
  comforting_topics text[] not null default '{}',
  sensitive_topics text[] not null default '{}',
  personal_history jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stimuli (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind public.mori_stimulus_kind not null,
  memory_id uuid references public.memories(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  person_ids uuid[] not null default '{}',
  tags text[] not null default '{}',
  caregiver_priority real not null default 0.5 check (caregiver_priority between 0 and 1),
  consent_status public.mori_consent_status not null default 'review',
  sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stimulus_observations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  stimulus_id uuid not null references public.stimuli(id) on delete cascade,
  session_id uuid not null references public.therapy_sessions(id) on delete cascade,
  turn_id uuid references public.session_turns(id) on delete set null,
  engagement real not null check (engagement between 0 and 1),
  recognition real check (recognition between 0 and 1),
  emotional_valence real not null check (emotional_valence between -1 and 1),
  confusion real not null check (confusion between 0 and 1),
  distress real not null check (distress between 0 and 1),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  caregiver_assessment public.mori_caregiver_assessment,
  evidence jsonb not null default '{}',
  observed_at timestamptz not null default now()
);

create table public.memory_graph_edges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_stimulus_id uuid not null references public.stimuli(id) on delete cascade,
  target_stimulus_id uuid not null references public.stimuli(id) on delete cascade,
  relationship text not null check (relationship in ('related_to', 'person_in', 'place_of', 'reminds_of', 'followed_by')),
  affinity real not null default 0.5 check (affinity between 0 and 1),
  recognition real not null default 0.5 check (recognition between 0 and 1),
  distress real not null default 0 check (distress between 0 and 1),
  confidence real not null default 0.5 check (confidence between 0 and 1),
  last_observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (owner_id, source_stimulus_id, target_stimulus_id, relationship),
  check (source_stimulus_id <> target_stimulus_id)
);

create table public.longitudinal_memory_states (
  owner_id uuid not null references auth.users(id) on delete cascade,
  stimulus_id uuid not null references public.stimuli(id) on delete cascade,
  exposure_count integer not null default 0 check (exposure_count >= 0),
  recognition_strength real not null default 0.5 check (recognition_strength between 0 and 1),
  engagement_strength real not null default 0.5 check (engagement_strength between 0 and 1),
  positive_affect_strength real not null default 0.5 check (positive_affect_strength between 0 and 1),
  confusion_risk real not null default 0.25 check (confusion_risk between 0 and 1),
  distress_risk real not null default 0.15 check (distress_risk between 0 and 1),
  confidence real not null default 0 check (confidence between 0 and 1),
  last_updated_at timestamptz not null default now(),
  primary key (owner_id, stimulus_id)
);

create index stimuli_owner_kind_idx on public.stimuli (owner_id, kind);
create index stimulus_observations_stimulus_time_idx on public.stimulus_observations (stimulus_id, observed_at desc);
create index stimulus_observations_session_idx on public.stimulus_observations (session_id, observed_at);
create index memory_graph_source_idx on public.memory_graph_edges (source_stimulus_id);
create index memory_graph_target_idx on public.memory_graph_edges (target_stimulus_id);

create trigger patient_profiles_set_updated_at before update on public.patient_profiles
for each row execute function public.set_updated_at();
create trigger stimuli_set_updated_at before update on public.stimuli
for each row execute function public.set_updated_at();

alter table public.patient_profiles enable row level security;
alter table public.stimuli enable row level security;
alter table public.stimulus_observations enable row level security;
alter table public.memory_graph_edges enable row level security;
alter table public.longitudinal_memory_states enable row level security;

create policy "owners manage patient profile" on public.patient_profiles
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage stimuli" on public.stimuli
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners read stimulus observations" on public.stimulus_observations
for select to authenticated using (owner_id = auth.uid());
create policy "owners read memory graph" on public.memory_graph_edges
for select to authenticated using (owner_id = auth.uid());
create policy "owners read longitudinal memory states" on public.longitudinal_memory_states
for select to authenticated using (owner_id = auth.uid());

-- Observation and graph writes are server-owned so a browser cannot fabricate
-- behavioral signals. Caregiver access will be added through explicit grants.
