import test from 'node:test'
import assert from 'node:assert/strict'
import { createDatabase } from './harness.mjs'

const googleTables = ['google_data_configuration', 'google_data_configuration_audit', 'google_oauth_attempts', 'google_tenant_connections']
const hash = character => character.repeat(64)
const envelope = { v: 1, fixture: true }
const denied = promise => assert.rejects(promise, { code: '42501' })

for (const legacyDefaults of [false, true]) {
  test(`all migrations + exact private grants (${legacyDefaults ? 'legacy' : 'explicit'} defaults)`, { timeout: 30000 }, async t => {
    const { admin, connect, ids } = await createDatabase(t, { legacyDefaults })
    const rows = await admin.query('select relname,relrowsecurity,relforcerowsecurity from pg_class where relname=any($1)', [googleTables])
    assert.equal(rows.rowCount, 4)
    assert.ok(rows.rows.every(row => row.relrowsecurity && row.relforcerowsecurity))
    const functions = await admin.query("select p.oid::regprocedure::text as signature,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'google_%'")
    assert.equal(functions.rowCount, 7)
    for (const fn of functions.rows) {
      assert.equal(fn.prosecdef, false, fn.signature)
      assert.ok(fn.proconfig.includes('search_path=""'), fn.signature)
    }
    for (const role of ['anon', 'authenticated']) {
      const browser = await connect(role, ids.ownerA)
      for (const table of googleTables) {
        for (const query of [`select * from public.${table}`, `insert into public.${table} default values`, `update public.${table} set ${table === 'google_data_configuration' ? 'enabled=enabled' : table === 'google_data_configuration_audit' ? 'enabled=enabled' : table === 'google_oauth_attempts' ? 'consumed_at=consumed_at' : 'status=status'}`, `delete from public.${table}`]) {
          await denied(browser.query(query))
        }
      }
      for (const fn of functions.rows) {
        assert.equal((await admin.query('select has_function_privilege($1,$2,\'EXECUTE\') as allowed', [role, fn.signature])).rows[0].allowed, false)
      }
      for (const query of [
        'select public.google_data_status()',
        `select public.google_data_set_enabled('${ids.platform}',true)`,
        `select public.google_oauth_begin('${ids.tenantA}','${ids.ownerA}','${hash('a')}','${hash('b')}',null,'{}')`,
        `select * from public.google_oauth_consume('${hash('a')}','${hash('b')}')`,
        `select public.google_oauth_finish('${hash('a')}','${ids.tenantA}','${ids.ownerA}','{}',array[]::text[],now())`,
        `select public.google_connection_update('${ids.tenantA}','${ids.ownerA}','${ids.tenantA}','connected',null,null,null,true)`,
        `select * from public.google_connection_disconnect('${ids.tenantA}','${ids.ownerA}')`,
      ]) await denied(browser.query(query))
    }
    const expected = {
      google_data_configuration: ['SELECT', 'UPDATE'],
      google_data_configuration_audit: ['SELECT', 'INSERT'],
      google_oauth_attempts: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      google_tenant_connections: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    }
    for (const table of googleTables) {
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
        const { rows } = await admin.query('select has_table_privilege(\'service_role\',$1,$2) as allowed', [`public.${table}`, privilege])
        assert.equal(rows[0].allowed, expected[table].includes(privilege), `${table} ${privilege}`)
      }
    }
    const service = await connect()
    assert.equal((await service.query('select public.google_data_status() as status')).rows[0].status.enabled, false)
    await assert.rejects(service.query('select public.google_data_set_enabled($1,true)', [ids.ownerA]), /GOOGLE_ADMIN_REQUIRED/)
    await service.query('select public.google_data_set_enabled($1,true)', [ids.platform])
    assert.equal((await service.query('select public.google_data_status() as status')).rows[0].status.enabled, true)
    assert.equal((await service.query('select count(*)::int as count from public.google_data_configuration_audit')).rows[0].count, 1)
    await denied(service.query('delete from public.google_data_configuration'))
    await denied(service.query('update public.google_data_configuration_audit set enabled=false'))
    await denied(service.query('delete from public.google_data_configuration_audit'))
  })
}

test('real RLS separates two companies, rejects writes/escalation and ignores editable metadata', { timeout: 30000 }, async t => {
  const { admin, connect, ids } = await createDatabase(t, { legacyDefaults: true })
  const service = await connect()
  for (const [tenant, owner, host] of [[ids.tenantA, ids.ownerA, 'a.example.test'], [ids.tenantB, ids.ownerB, 'b.example.test']]) {
    const monitor = (await service.query('select public.create_monitor_for_tenant($1,$2,$3,$4) as id', [tenant, owner, `https://${host}`, host])).rows[0].id
    await service.query("insert into public.monitor_checks(monitor_id,user_id,tenant_id,status,duration_ms,detail) values($1,$2,$3,'ok',10,'Fictício')", [monitor, owner, tenant])
    await service.query("insert into public.tenant_channel_connections(tenant_id,channel,created_by) values($1,'email_smtp',$2)", [tenant, owner])
  }
  for (const [user, tenant] of [[ids.ownerA, ids.tenantA], [ids.memberA, ids.tenantA], [ids.ownerB, ids.tenantB]]) {
    const browser = await connect('authenticated', user)
    for (const table of ['monitors', 'monitor_checks', 'tenant_channel_connections']) {
      const { rows } = await browser.query(`select tenant_id from public.${table}`)
      assert.deepEqual(rows.map(row => row.tenant_id), [tenant])
      await denied(browser.query(`delete from public.${table}`))
    }
    await denied(browser.query('insert into public.platform_administrators(user_id) values($1)', [user]))
    await denied(browser.query("update public.tenant_members set role='owner' where user_id=$1", [user]))
    await denied(browser.query('select public.ensure_personal_tenant($1)', [ids.platform]))
    await denied(browser.query('select * from public.tenants'))
  }
  const spoofed = await connect('authenticated', ids.ownerB)
  await spoofed.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: ids.ownerB, user_metadata: { role: 'superadmin', tenant_id: ids.tenantA } })])
  await admin.query("update auth.users set raw_user_meta_data=$1 where id=$2", [{ role: 'superadmin', tenant_id: ids.tenantA }, ids.ownerB])
  assert.equal((await spoofed.query('select private.is_platform_administrator() as admin')).rows[0].admin, false)
  assert.deepEqual((await spoofed.query('select tenant_id from public.monitors')).rows.map(row => row.tenant_id), [ids.tenantB])
  const anonymous = await connect('anon')
  await denied(anonymous.query('select * from public.monitors'))
  const platformBrowser = await connect('authenticated', ids.platform)
  assert.equal((await platformBrowser.query('select * from public.monitors')).rowCount, 0, 'global role is not implicit tenant data membership')
  await assert.rejects(service.query('select public.create_monitor_for_tenant($1,$2,$3,$4)', [ids.tenantA, ids.ownerB, 'https://a.example.test/other', 'a.example.test']), /TENANT_ACCESS_DENIED/)
})

test('Google RPC lifecycle binds state, browser, user, tenant, scopes and current role', { timeout: 30000 }, async t => {
  const { admin, connect, ids, scopes } = await createDatabase(t)
  const service = await connect()
  const begin = (tenant, user, state, browser) => service.query('select public.google_oauth_begin($1,$2,$3,$4,null,$5)', [tenant, user, state, browser, envelope])
  const consume = (state, browser) => service.query('select * from public.google_oauth_consume($1,$2)', [state, browser])
  const finish = (state, tenant, user, permissions = scopes) => service.query("select public.google_oauth_finish($1,$2,$3,$4,$5,now()+interval '1 hour') as accepted", [state, tenant, user, envelope, permissions])
  await assert.rejects(begin(ids.tenantA, ids.ownerA, hash('a'), hash('b')), /GOOGLE_DISABLED/)
  await service.query('select public.google_data_set_enabled($1,true)', [ids.platform])
  for (const user of [ids.ownerB, ids.memberA, ids.platform]) await assert.rejects(begin(ids.tenantA, user, hash('a'), hash('b')), /GOOGLE_TENANT_ADMIN_REQUIRED/)
  await begin(ids.tenantA, ids.ownerA, hash('a'), hash('b'))
  assert.equal((await consume(hash('a'), hash('c'))).rowCount, 0)
  assert.equal((await finish(hash('a'), ids.tenantA, ids.ownerA)).rows[0].accepted, false, 'unconsumed state')
  assert.equal((await consume(hash('a'), hash('b'))).rowCount, 1)
  assert.equal((await consume(hash('a'), hash('b'))).rowCount, 0, 'replay')
  assert.equal((await finish(hash('a'), ids.tenantB, ids.ownerB)).rows[0].accepted, false, 'wrong tenant and actor')
  await assert.rejects(finish(hash('a'), ids.tenantA, ids.ownerA, [...scopes, 'https://www.googleapis.com/auth/drive']), { code: '23514' })
  assert.equal((await finish(hash('a'), ids.tenantA, ids.ownerA)).rows[0].accepted, true, 'failed SQL statement rolled back state deletion')
  assert.equal((await service.query('select count(*)::int as count from public.google_tenant_connections where tenant_id=$1', [ids.tenantB])).rows[0].count, 0)
  await begin(ids.tenantA, ids.adminA, hash('d'), hash('e'))
  await consume(hash('d'), hash('e'))
  await admin.query("update public.tenant_members set role='member' where tenant_id=$1 and user_id=$2", [ids.tenantA, ids.adminA])
  assert.equal((await finish(hash('d'), ids.tenantA, ids.adminA)).rows[0].accepted, false)
  await assert.rejects(service.query('select * from public.google_connection_disconnect($1,$2)', [ids.tenantA, ids.ownerA]), /GOOGLE_OAUTH_IN_PROGRESS/)
  await service.query('delete from public.google_oauth_attempts where state_hash=$1', [hash('d')])
  await begin(ids.tenantA, ids.ownerA, hash('f'), hash('a'))
  await consume(hash('f'), hash('a'))
  await service.query('select public.google_data_set_enabled($1,false)', [ids.platform])
  await service.query('select public.google_data_set_enabled($1,true)', [ids.platform])
  assert.equal((await finish(hash('f'), ids.tenantA, ids.ownerA)).rows[0].accepted, false)
  assert.ok((await service.query('select invalidated_at,consumed_at from public.google_oauth_attempts where state_hash=$1', [hash('f')])).rows[0].consumed_at)
  await service.query('delete from public.google_oauth_attempts where state_hash=$1', [hash('f')])
  assert.equal((await service.query('select * from public.google_connection_disconnect($1,$2)', [ids.tenantA, ids.ownerA])).rowCount, 1)
  assert.equal((await service.query('select * from public.google_connection_disconnect($1,$2)', [ids.tenantA, ids.ownerA])).rowCount, 0)
})
