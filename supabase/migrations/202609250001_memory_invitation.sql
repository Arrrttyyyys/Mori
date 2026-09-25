-- Keep a proposed memory separate from the media currently visible in a session.
-- This lets Mori make conversation and ask permission before showing anything.
alter table public.therapy_sessions
  add column if not exists pending_memory_id uuid references public.memories(id) on delete set null;
