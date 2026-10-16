import test from 'node:test'
import assert from 'node:assert/strict'
import { createDatabase } from './harness.mjs'

const protectedTables = ['platform_plans', 'platform_plan_targets', 'tenant_controls', 'platform_billing_settings', 'support_threads', 'support_messages']

test('platform catalog and support have explicit grants and tenant isolation', { timeout: 30000 }, async t => {
  const { admin, connect, ids } = await createDatabase(t, { legacyDefaults: true })
  const metadata = await admin.query('select relname,relrowsecurity,relforcerowsecurity from pg_class where relname=any($1)', [protectedTables])
  assert.equal(metadata.rowCount, protectedTables.length)
  assert.ok(metadata.rows.every(row => row.relrowsecurity && row.relforcerowsecurity))
  for (const role of ['anon', 'authenticated']) {
    const browser = await connect(role, ids.ownerA)
    for (const table of protectedTables) {
      await assert.rejects(browser.query(`select * from public.${table}`), { code: '42501' })
      await assert.rejects(browser.query(`insert into public.${table} default values`), { code: '42501' })
    }
    await assert.rejects(browser.query('select public.save_platform_plan(null,null,null,null,null,null,null,null,null,null,null,null,null)'), { code: '42501' })
  }
  const service = await connect()
  const savePlan = (actor, id, targets) => service.query('select public.save_platform_plan($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) as id',
    [actor, id, 'Inicial', 4900, 'monthly', 10, 2, 100, 7, ['monitoring'], 'selected', 'published', targets])
  await assert.rejects(savePlan(ids.ownerA, null, [ids.tenantA]), /PLATFORM_ADMIN_REQUIRED/)
  const planId = (await savePlan(ids.platform, null, [ids.tenantA])).rows[0].id
  assert.equal((await service.query('select count(*)::int as count from public.platform_plan_targets where plan_id=$1', [planId])).rows[0].count, 1)
  await assert.rejects(savePlan(ids.platform, planId, [ids.tenantA, ids.tenantA]), /INVALID_PLAN_TARGETS/)
  assert.deepEqual((await service.query('select tenant_id from public.platform_plan_targets where plan_id=$1', [planId])).rows.map(row => row.tenant_id), [ids.tenantA])
  await service.query('insert into public.support_threads(tenant_id) values($1)', [ids.tenantA])
  await service.query('insert into public.support_messages(tenant_id,sender_id,sender_platform,body) values($1,$2,false,$3)', [ids.tenantA, ids.ownerA, 'Pergunta de teste'])
  assert.equal((await service.query('select count(*)::int as count from public.support_messages where tenant_id=$1', [ids.tenantA])).rows[0].count, 1)
})

test('connection limits and paused state are enforced inside PostgreSQL', { timeout: 30000 }, async t => {
  const { connect, ids } = await createDatabase(t)
  const service = await connect()
  await service.query("insert into public.tenant_controls(tenant_id,max_connections,allowed_channels,channel_limits) values($1,1,array['email_smtp']::text[],'{}'::jsonb)", [ids.tenantA])
  const insert = channel => service.query('insert into public.tenant_channel_connections(tenant_id,channel,created_by) values($1,$2,$3)', [ids.tenantA, channel, ids.ownerA])
  await assert.rejects(insert('whatsapp_waba'), /CHANNEL_DISABLED/)
  await insert('email_smtp')
  await service.query("update public.tenant_controls set allowed_channels=array['email_smtp','whatsapp_waba']::text[] where tenant_id=$1", [ids.tenantA])
  await assert.rejects(insert('whatsapp_waba'), /CONNECTION_LIMIT/)
  await service.query("update public.tenant_controls set status='paused' where tenant_id=$1", [ids.tenantA])
  await assert.rejects(service.query("update public.tenant_channel_connections set status='pending' where tenant_id=$1", [ids.tenantA]), /TENANT_PAUSED/)
})
