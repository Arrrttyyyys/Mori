-- Run against a disposable database after every migration; all fixtures roll back.
begin;
insert into auth.users(id) values
 ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002'),
 ('10000000-0000-0000-0000-000000000003'),('10000000-0000-0000-0000-000000000004');
insert into public.family_memberships(owner_id,member_id,role) values
 ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','caregiver'),
 ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','contributor');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
insert into public.memories(id,owner_id,title,safety,media_kind) values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Owner garden','safe','story');
do $$begin
 if (select consent_status from public.stimuli where id='20000000-0000-0000-0000-000000000001')<>'allowed' then raise exception 'Approved memory failed stimulus sync';end if;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
do $$begin
 if exists(select 1 from public.memories where id='20000000-0000-0000-0000-000000000001') then raise exception 'Stranger can read private memory';end if;
 begin
  insert into public.life_records(owner_id,kind,data) values('10000000-0000-0000-0000-000000000001','person','{"name":"intruder"}');
  raise exception 'Stranger can write life records';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$begin
 if not exists(select 1 from public.memories where id='20000000-0000-0000-0000-000000000001') then raise exception 'Contributor cannot read shared memory';end if;
 begin
  insert into public.memories(owner_id,title,safety) values('10000000-0000-0000-0000-000000000001','Unreviewed attack','safe');
  raise exception 'Contributor can approve own upload';
 exception when insufficient_privilege then null;end;
 begin
  insert into public.life_records(owner_id,kind,data) values('10000000-0000-0000-0000-000000000001','story','{"text":"Invented fact","status":"confirmed"}');
  raise exception 'Contributor can confirm own story';
 exception when insufficient_privilege then null;end;
end$$;
insert into public.memories(owner_id,title,safety) values('10000000-0000-0000-0000-000000000001','Family contribution','review');
insert into public.life_records(owner_id,kind,data) values('10000000-0000-0000-0000-000000000001','story','{"text":"A family story","status":"unverified"}');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
update public.memories set safety='avoid' where id='20000000-0000-0000-0000-000000000001';
do $$begin
 if (select safety from public.memories where id='20000000-0000-0000-0000-000000000001')<>'avoid' then raise exception 'Caregiver cannot restrict a memory';end if;
end$$;
reset role;
do $$begin
 if (select consent_status from public.stimuli where id='20000000-0000-0000-0000-000000000001')<>'blocked' then raise exception 'Avoid did not update stimulus';end if;
end$$;
update public.family_memberships set active=false where member_id='10000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$begin
 if exists(select 1 from public.memories where id='20000000-0000-0000-0000-000000000001') then raise exception 'Revoked caregiver retains access';end if;
end$$;
reset role;
insert into public.family_invitations(owner_id,token_hash,role) values('10000000-0000-0000-0000-000000000001','test-invitation','viewer');
select public.accept_family_invitation('test-invitation','10000000-0000-0000-0000-000000000004');
do $$begin
 begin
  perform public.accept_family_invitation('test-invitation','10000000-0000-0000-0000-000000000002');
  raise exception 'Invitation was reusable';
 exception when raise_exception then
  if sqlerrm<>'Invitation unavailable' then raise;end if;
 end;
end$$;
insert into public.pilot_consents(patient_id,caregiver_sharing_allowed) values('10000000-0000-0000-0000-000000000001',false);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$begin
 if exists(select 1 from public.memories where owner_id='10000000-0000-0000-0000-000000000001') then raise exception 'Pilot sharing refusal ignored';end if;
 begin
  insert into public.memories(owner_id,title,safety) values('10000000-0000-0000-0000-000000000001','Disallowed contribution','review');
  raise exception 'Contributor can write after sharing refusal';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
