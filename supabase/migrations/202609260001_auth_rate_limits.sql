create table public.auth_usage_windows (
  subject_key text not null,
  action text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  primary key(subject_key,action,bucket_start)
);
alter table public.auth_usage_windows enable row level security;
create index auth_usage_windows_expiry_idx on public.auth_usage_windows(expires_at);

create or replace function public.consume_mori_auth_quota(p_subject_key text,p_action text,p_window_seconds integer,p_window_limit integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare now_value timestamptz:=now(); bucket timestamptz; current_count integer;
begin
  if p_window_seconds < 1 or p_window_limit < 1 or char_length(p_subject_key) <> 64 or char_length(p_action) > 80 then
    raise exception 'Invalid authentication quota policy';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_subject_key || ':' || p_action,0));
  bucket:=to_timestamp(floor(extract(epoch from now_value)/p_window_seconds)*p_window_seconds);
  insert into public.auth_usage_windows(subject_key,action,bucket_start,request_count,expires_at)
  values(p_subject_key,p_action,bucket,1,bucket+make_interval(secs=>p_window_seconds*2))
  on conflict(subject_key,action,bucket_start) do update set request_count=public.auth_usage_windows.request_count+1
  returning request_count into current_count;
  delete from public.auth_usage_windows where expires_at<now_value;
  return jsonb_build_object('allowed',current_count<=p_window_limit,'remaining',greatest(0,p_window_limit-current_count),'retry_after',greatest(1,extract(epoch from (bucket+make_interval(secs=>p_window_seconds)-now_value))::integer));
end; $$;
revoke all on function public.consume_mori_auth_quota(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_mori_auth_quota(text,text,integer,integer) to service_role;
