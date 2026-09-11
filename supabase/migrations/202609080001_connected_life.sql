-- Connected life records. Personal facts and observed interaction signals stay separate.
alter table public.memories add column if not exists context jsonb not null default '{}';
alter table public.memories add column if not exists safety text not null default 'review' check (safety in ('review','preferred','safe','neutral','sensitive','avoid','temporary'));
alter table public.memories add column if not exists avoid_until timestamptz;
alter table public.memories add column if not exists media_kind text not null default 'photo' check (media_kind in ('photo','audio','video','story'));
create table public.life_records (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('person','album','note','story')),
 data jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index life_records_owner_kind on public.life_records(owner_id,kind);
create trigger life_records_updated before update on public.life_records for each row execute function public.set_updated_at();
alter table public.life_records enable row level security;
create policy "owners manage life records" on public.life_records for all to authenticated using (owner_id=auth.uid()) with check(owner_id=auth.uid());
alter table public.stimulus_observations add column if not exists turn_number integer;
create unique index observations_session_turn_memory on public.stimulus_observations(session_id,turn_number,stimulus_id);
create table public.selection_decisions (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null references public.therapy_sessions(id) on delete cascade,
 turn_number integer not null, selected_memory_id uuid references public.memories(id) on delete set null,
 data jsonb not null, created_at timestamptz not null default now(), unique(session_id,turn_number)
);
alter table public.selection_decisions enable row level security;
create policy "owners read decisions" on public.selection_decisions for select to authenticated using(owner_id=auth.uid());
-- A memory and its scoring stimulus use the same ID. Updates cannot drift apart.
create function public.sync_memory_stimulus() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.stimuli(id,owner_id,memory_id,kind,title,tags,caregiver_priority,consent_status,sensitive)
 values(new.id,new.owner_id,new.id,case when new.media_kind='video' then 'video'::public.mori_stimulus_kind when new.media_kind='photo' then 'photo'::public.mori_stimulus_kind else 'memory'::public.mori_stimulus_kind end,new.title,
 array(select jsonb_array_elements_text(coalesce(new.context->'tags','[]'::jsonb))),
 case when new.safety='preferred' then 1 else 0.5 end,
 case when new.safety='avoid' then 'blocked'::public.mori_consent_status when new.safety in ('review','sensitive','temporary') then 'review'::public.mori_consent_status else 'allowed'::public.mori_consent_status end,new.safety='sensitive')
 on conflict(id) do update set title=excluded.title,tags=excluded.tags,caregiver_priority=excluded.caregiver_priority,consent_status=excluded.consent_status,sensitive=excluded.sensitive,kind=excluded.kind;
 return new;
end; $$;
create trigger memories_sync_stimulus after insert or update on public.memories for each row execute function public.sync_memory_stimulus();
-- Existing memories are deliberately pending review until a family approves them.
update public.memories set safety=safety;
