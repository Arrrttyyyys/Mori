-- Mori's persistent application schema.
-- Apply with the Supabase CLI (`supabase db push`) or in the SQL editor.

create extension if not exists pgcrypto;

create type public.mori_session_status as enum ('active', 'closed');
create type public.mori_emotional_state as enum (
  'calm', 'reflective', 'nostalgic', 'confused', 'distressed', 'joyful'
);
create type public.mori_risk_level as enum ('low', 'medium', 'high');
create type public.mori_session_action as enum ('continue', 'close');

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text,
  image_url text,
  title text not null check (char_length(title) between 1 and 200),
  story text,
  memory_date text,
  people text[] not null default '{}',
  place text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.mori_session_status not null default 'active',
  current_memory_id uuid references public.memories(id) on delete set null,
  emotional_states public.mori_emotional_state[] not null default '{}',
  topics_discussed text[] not null default '{}',
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.session_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.therapy_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  turn_index integer not null check (turn_index >= 0),
  user_message text not null check (char_length(user_message) between 1 and 10000),
  spoken_response text not null,
  next_question text not null default '',
  show_photo boolean not null default false,
  memory_id uuid references public.memories(id) on delete set null,
  emotional_state public.mori_emotional_state not null,
  session_action public.mori_session_action not null default 'continue',
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create table public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.therapy_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (char_length(topic) between 1 and 300),
  summary text not null check (char_length(summary) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.therapy_sessions(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  turn_id uuid references public.session_turns(id) on delete set null,
  risk_level public.mori_risk_level not null,
  flags text[] not null default '{}',
  status text not null default 'detected' check (status in ('detected', 'acknowledged', 'escalated', 'resolved')),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create index memories_owner_created_idx on public.memories (owner_id, created_at desc);
create index family_notes_owner_created_idx on public.family_notes (owner_id, created_at desc);
create index therapy_sessions_owner_started_idx on public.therapy_sessions (owner_id, started_at desc);
create index session_turns_session_index_idx on public.session_turns (session_id, turn_index);
create index safety_events_owner_created_idx on public.safety_events (owner_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger memories_set_updated_at before update on public.memories
for each row execute function public.set_updated_at();
create trigger family_notes_set_updated_at before update on public.family_notes
for each row execute function public.set_updated_at();
create trigger session_summaries_set_updated_at before update on public.session_summaries
for each row execute function public.set_updated_at();

alter table public.memories enable row level security;
alter table public.family_notes enable row level security;
alter table public.therapy_sessions enable row level security;
alter table public.session_turns enable row level security;
alter table public.session_summaries enable row level security;
alter table public.safety_events enable row level security;

create policy "owners manage memories" on public.memories
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage family notes" on public.family_notes
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and author_id = auth.uid());
create policy "owners manage sessions" on public.therapy_sessions
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage turns" on public.session_turns
for all to authenticated using (owner_id = auth.uid()) with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.therapy_sessions s
    where s.id = session_id and s.owner_id = auth.uid()
  )
);
create policy "owners read summaries" on public.session_summaries
for select to authenticated using (owner_id = auth.uid());
create policy "owners read safety events" on public.safety_events
for select to authenticated using (owner_id = auth.uid());

-- Writes to summaries and safety events are intentionally reserved for the
-- server service role. Browser clients can only read their own records.

insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do update set public = excluded.public;

create policy "owners read memory objects" on storage.objects
for select to authenticated using (
  bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners upload memory objects" on storage.objects
for insert to authenticated with check (
  bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owners delete memory objects" on storage.objects
for delete to authenticated using (
  bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
);
