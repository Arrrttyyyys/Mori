create table public.upload_usage_windows (
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_start timestamptz not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  primary key (owner_id, bucket_start)
);
alter table public.upload_usage_windows enable row level security;

create or replace function public.consume_mori_upload_quota(p_owner_id uuid, p_window_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare now_value timestamptz := now(); bucket timestamptz; current_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner_id::text || ':upload', 0));
  bucket := date_trunc('minute', now_value);
  insert into public.upload_usage_windows(owner_id,bucket_start,request_count,expires_at)
  values(p_owner_id,bucket,1,bucket + interval '2 minutes')
  on conflict(owner_id,bucket_start) do update set request_count=public.upload_usage_windows.request_count+1
  returning request_count into current_count;
  delete from public.upload_usage_windows where expires_at < now_value;
  return jsonb_build_object('allowed', current_count <= p_window_limit, 'remaining', greatest(0,p_window_limit-current_count), 'retry_after', greatest(1,extract(epoch from (bucket + interval '1 minute' - now_value))::integer));
end; $$;
revoke all on function public.consume_mori_upload_quota(uuid,integer) from public,anon,authenticated;
grant execute on function public.consume_mori_upload_quota(uuid,integer) to service_role;

create table public.legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  unique(user_id,terms_version,privacy_version)
);
alter table public.legal_acceptances enable row level security;
create policy "users read own legal acceptances" on public.legal_acceptances
for select to authenticated using(user_id=auth.uid());
