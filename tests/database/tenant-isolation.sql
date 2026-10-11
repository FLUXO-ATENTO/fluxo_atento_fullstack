-- Isolated synthetic fixtures, no emails sent, all changes rolled back.
begin;
do $$
declare
  member_a uuid := gen_random_uuid(); member_b uuid := gen_random_uuid(); super_id uuid := gen_random_uuid();
  tenant_a uuid := gen_random_uuid(); tenant_b uuid := gen_random_uuid();
  contact_a uuid; contact_b uuid; connection_a uuid := gen_random_uuid(); connection_b uuid := gen_random_uuid();
  conversation_a uuid := gen_random_uuid(); result jsonb; row_count integer; failed boolean;
begin
  insert into auth.users(id,aud,role,email) values
    (member_a,'authenticated','authenticated',member_a::text || '@fixture.invalid'),
    (member_b,'authenticated','authenticated',member_b::text || '@fixture.invalid'),
    (super_id,'authenticated','authenticated',super_id::text || '@fixture.invalid');
  insert into public.tenants(id,name,created_by) values(tenant_a,'Fixture A',member_a),(tenant_b,'Fixture B',member_b);
  insert into public.tenant_members(tenant_id,user_id,role) values(tenant_a,member_a,'owner'),(tenant_b,member_b,'owner');
  insert into public.platform_administrators(user_id) values(super_id);
  result := public.save_contact(member_a,tenant_a,'Contato A','SAME@example.invalid','+5511999999999');
  contact_a := (result->>'id')::uuid;
  assert (result->>'created')::boolean, 'First contact should be created';
  result := public.save_contact(member_a,tenant_a,'Other name','same@example.invalid',null);
  assert not (result->>'created')::boolean and (result->>'id')::uuid=contact_a, 'Deduplication failed';
  assert (select display_name='Contato A' from public.contacts where id=contact_a), 'Existing contact was overwritten';
  result := public.save_contact(member_b,tenant_b,'Contato B','same@example.invalid',null);
  contact_b := (result->>'id')::uuid;
  assert contact_b<>contact_a, 'Contacts from different tenants merged';
  failed := false;
  begin perform public.save_contact(member_a,tenant_b,'Denied','denied@example.invalid',null);
  exception when others then if sqlerrm='TENANT_ACCESS_DENIED' then failed:=true; else raise; end if; end;
  assert failed, 'Cross-tenant service RPC accepted';
  perform public.save_contact(member_a,tenant_a,'Phone only',null,'+5511888888888');
  failed:=false;
  begin perform public.save_contact(member_a,tenant_a,'Conflict','same@example.invalid','+5511888888888');
  exception when others then if sqlerrm='IDENTITY_CONFLICT' then failed:=true; else raise; end if; end;
  assert failed, 'Conflicting identities were merged';
  failed:=false;
  begin perform public.admin_set_member_role(member_a,tenant_b,member_b,'admin');
  exception when others then if sqlerrm='ADMIN_REQUIRED' then failed:=true; else raise; end if; end;
  assert failed, 'Tenant owner gained global role management';
  failed:=false;
  begin perform public.admin_set_member_role(super_id,tenant_a,member_a,'member');
  exception when others then if sqlerrm='LAST_OWNER' then failed:=true; else raise; end if; end;
  assert failed, 'Last owner was removed';
  insert into public.tenant_members(tenant_id,user_id,role) values(tenant_a,member_b,'member');
  perform public.admin_set_member_role(super_id,tenant_a,member_b,'admin');
  assert exists(select 1 from public.platform_audit_events where actor_id=super_id and tenant_id=tenant_a and action='member.role_changed'), 'Role change lacks audit';
  -- Remove only synthetic membership so B remains a clean isolation fixture.
  delete from public.tenant_members where tenant_id=tenant_a and user_id=member_b;
  insert into public.tenant_channel_connections(id,tenant_id,channel,created_by) values
    (connection_a,tenant_a,'email_smtp',member_a),(connection_b,tenant_b,'email_smtp',member_b);
  failed:=false;
  begin insert into public.conversations(tenant_id,contact_id,connection_id,external_id) values(tenant_b,contact_a,connection_b,'cross-tenant');
  exception when foreign_key_violation then failed:=true; end;
  assert failed, 'Composite contact FK allowed tenant crossing';
  insert into public.conversations(id,tenant_id,contact_id,connection_id,external_id) values(conversation_a,tenant_a,contact_a,connection_a,'thread-1');
  insert into public.messages(tenant_id,conversation_id,connection_id,external_id,direction,body_text,occurred_at)
    values(tenant_a,conversation_a,connection_a,'message-1','inbound','Synthetic message',now());
  failed:=false;
  begin insert into public.messages(tenant_id,conversation_id,connection_id,external_id,direction,body_text,occurred_at)
    values(tenant_a,conversation_a,connection_a,'message-1','inbound','Duplicate',now());
  exception when unique_violation then failed:=true; end;
  assert failed, 'Provider message idempotency constraint missing';
  failed:=false;
  begin insert into public.messages(tenant_id,conversation_id,connection_id,external_id,direction,body_text,occurred_at)
    values(tenant_b,conversation_a,connection_b,'message-2','inbound','Cross tenant',now());
  exception when foreign_key_violation then failed:=true; end;
  assert failed, 'Message crossed tenant/connection boundary';
  perform set_config('request.jwt.claims', jsonb_build_object('sub',member_b,'role','authenticated','user_metadata',jsonb_build_object('platform_admin',true))::text,true);
  set local role authenticated;
  select count(*) into row_count from public.contacts where id in (contact_a,contact_b);
  assert row_count=1, 'RLS exposed foreign contacts';
  assert not exists(select 1 from public.messages where conversation_id=conversation_a), 'RLS exposed foreign history';
  assert not private.is_platform_administrator(), 'Editable user metadata grants admin';
  assert not has_table_privilege('authenticated','public.platform_administrators','INSERT'), 'Self elevation grant';
  assert not has_table_privilege('authenticated','public.contacts','INSERT'), 'Direct contact write grant';
  assert not has_function_privilege('authenticated','public.save_contact(uuid,uuid,text,text,text)','EXECUTE'), 'Service RPC publicly executable';
  assert not has_table_privilege('anon','public.contacts','SELECT'), 'Anonymous contacts grant';
  reset role;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',super_id,'role','authenticated')::text,true);
  set local role authenticated;
  select count(*) into row_count from public.contacts where id in (contact_a,contact_b);
  assert row_count=2, 'Super Admin cannot view all authorized tenants';
  assert exists(select 1 from public.messages where conversation_id=conversation_a), 'Super Admin cannot view tenant history';
  reset role;
end $$;
rollback;
select 'PASS: deduplication, identity conflict, tenant RLS, composite FKs, message idempotency, privilege escalation, last owner and audit; all fixtures rolled back' as result;
