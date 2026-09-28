create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254 and email = lower(btrim(email))),
  name text check (name is null or char_length(name) <= 120),
  relationship text not null check (relationship in ('family','caregiver','older_adult','clinician_researcher','community_partner','other')),
  interest text check (interest is null or char_length(interest) <= 1000),
  source text not null default 'website' check (char_length(source) <= 40),
  privacy_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;
create index waitlist_signups_created_idx on public.waitlist_signups(created_at desc);

create table public.waitlist_usage_windows (
  subject_key text not null,
  scope text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  primary key(subject_key,scope,bucket_start)
);

alter table public.waitlist_usage_windows enable row level security;
create index waitlist_usage_windows_expiry_idx on public.waitlist_usage_windows(expires_at);

create or replace function public.consume_mori_waitlist_quota(p_subject_key text,p_scope text,p_window_seconds integer,p_window_limit integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare now_value timestamptz:=now(); bucket timestamptz; current_count integer;
begin
  if p_window_seconds < 1 or p_window_limit < 1 or char_length(p_subject_key) <> 64 or p_scope not in ('client','email') then
    raise exception 'Invalid waitlist quota policy';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_subject_key || ':' || p_scope,0));
  bucket:=to_timestamp(floor(extract(epoch from now_value)/p_window_seconds)*p_window_seconds);
  insert into public.waitlist_usage_windows(subject_key,scope,bucket_start,request_count,expires_at)
  values(p_subject_key,p_scope,bucket,1,bucket+make_interval(secs=>p_window_seconds*2))
  on conflict(subject_key,scope,bucket_start) do update set request_count=public.waitlist_usage_windows.request_count+1
  returning request_count into current_count;
  delete from public.waitlist_usage_windows where expires_at<now_value;
  return jsonb_build_object('allowed',current_count<=p_window_limit,'remaining',greatest(0,p_window_limit-current_count),'retry_after',greatest(1,extract(epoch from (bucket+make_interval(secs=>p_window_seconds)-now_value))::integer));
end; $$;

revoke all on function public.consume_mori_waitlist_quota(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_mori_waitlist_quota(text,text,integer,integer) to service_role;
