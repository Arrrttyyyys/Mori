create table public.operational_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  event_name text not null check (event_name in ('api_error','model_turn','demo_access','demo_reset')),
  route text not null,
  status_code integer not null,
  latency_ms integer not null default 0,
  provider text,
  used_fallback boolean not null default false,
  malformed_responses integer not null default 0,
  identity_mode text not null check (identity_mode in ('demo','supabase','anonymous')),
  client_key_hash text
);
alter table public.operational_events enable row level security;
create index operational_events_time_idx on public.operational_events (occurred_at desc);

create table public.demo_usage_windows (
  client_key text not null,
  action text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  primary key (client_key, action, bucket_start)
);
alter table public.demo_usage_windows enable row level security;

create or replace function public.consume_mori_demo_quota(p_client_key text, p_action text, p_window_seconds integer, p_window_limit integer, p_daily_limit integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare now_value timestamptz := now(); window_bucket timestamptz; day_bucket timestamptz; window_count integer; daily_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_client_key || ':' || p_action, 0));
  window_bucket := to_timestamp(floor(extract(epoch from now_value) / p_window_seconds) * p_window_seconds);
  day_bucket := date_trunc('day', now_value);
  insert into public.demo_usage_windows(client_key,action,bucket_start,request_count,expires_at) values(p_client_key,p_action,window_bucket,1,window_bucket + make_interval(secs => p_window_seconds))
  on conflict(client_key,action,bucket_start) do update set request_count=public.demo_usage_windows.request_count+1 returning request_count into window_count;
  insert into public.demo_usage_windows(client_key,action,bucket_start,request_count,expires_at) values(p_client_key,p_action || ':daily',day_bucket,1,day_bucket + interval '2 days')
  on conflict(client_key,action,bucket_start) do update set request_count=public.demo_usage_windows.request_count+1 returning request_count into daily_count;
  delete from public.demo_usage_windows where expires_at < now_value;
  return jsonb_build_object('allowed', window_count <= p_window_limit and daily_count <= p_daily_limit, 'remaining', greatest(0, least(p_window_limit-window_count,p_daily_limit-daily_count)), 'retry_after', greatest(1, extract(epoch from (window_bucket + make_interval(secs => p_window_seconds) - now_value))::integer));
end; $$;
revoke all on function public.consume_mori_demo_quota(text,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_mori_demo_quota(text,text,integer,integer,integer) to service_role;

create or replace function public.mori_resource_snapshot() returns jsonb language sql security definer set search_path='' as $$
  select jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'database_connections', (select count(*) from pg_stat_activity where datname=current_database()),
    'active_connections', (select count(*) from pg_stat_activity where datname=current_database() and state='active'),
    'therapy_sessions', (select count(*) from public.therapy_sessions),
    'memories', (select count(*) from public.memories),
    'storage_bytes', coalesce((select sum(coalesce((metadata->>'size')::bigint,0)) from storage.objects where bucket_id='memories'),0)
  );
$$;
revoke all on function public.mori_resource_snapshot() from public,anon,authenticated;
grant execute on function public.mori_resource_snapshot() to service_role;
