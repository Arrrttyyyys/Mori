-- Serialize a session across browser tabs and server workers, including closure.
alter table public.therapy_sessions add column turn_lease uuid;
alter table public.therapy_sessions add column turn_lease_until timestamptz;
create function public.claim_mori_session(patient uuid, session_key uuid, lease_key uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.therapy_sessions set turn_lease=lease_key,turn_lease_until=now()+interval '90 seconds'
 where id=session_key and owner_id=patient and status='active' and (turn_lease is null or turn_lease_until<now());
 return found;
end;$$;
create function public.release_mori_session(patient uuid, session_key uuid, lease_key uuid) returns void language sql security definer set search_path='' as $$
 update public.therapy_sessions set turn_lease=null,turn_lease_until=null where id=session_key and owner_id=patient and turn_lease=lease_key;
$$;
revoke all on function public.claim_mori_session(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.release_mori_session(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_mori_session(uuid,uuid,uuid) to service_role;
grant execute on function public.release_mori_session(uuid,uuid,uuid) to service_role;
