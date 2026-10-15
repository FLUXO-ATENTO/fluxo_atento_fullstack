import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { setImmediate } from 'node:timers/promises'
import { createDatabase } from './harness.mjs'

// Real RPCs in a fresh disposable PostgreSQL database per case. These objects
// are deliberately synthetic envelopes, not usable OAuth credentials. The
// harness owns connection/database cleanup and rejects non-local environments.
const TEST_TIMEOUT_MS = 20_000
const BLOCK_TIMEOUT_MS = 3_000
const CONSUME_SQL = 'select * from public.google_oauth_consume($1::text, $2::text)'
const DISCONNECT_SQL = 'select * from public.google_connection_disconnect($1::uuid, $2::uuid)'
const FINISH_SQL = `select public.google_oauth_finish(
  $1::text, $2::uuid, $3::uuid, $4::jsonb, $5::text[],
  clock_timestamp() + interval '1 hour'
) as accepted`
const UPDATE_SQL = `select public.google_connection_update(
  $1::uuid, $2::uuid, $3::uuid, $4::text, $5::jsonb,
  clock_timestamp() + interval '1 hour', clock_timestamp(), $6::boolean
) as accepted`

async function session(db) {
  const client = await db.connect('service_role')
  const { rows: [{ pid }] } = await client.query(`select pg_backend_pid() as pid,
    set_config('statement_timeout', $1, false),
    set_config('lock_timeout', $2, false),
    set_config('idle_in_transaction_session_timeout', $3, false),
    set_config('default_transaction_isolation', $4, false)`,
  ['6s', '5s', '10s', 'read committed'])
  return { client, pid }
}

// Attach both handlers immediately: an unexpectedly early RPC error must be a
// test failure, not an unhandled rejection while the observer is polling.
function startRpc(connection, sql, values) {
  const pending = { pid: connection.pid, settled: false }
  pending.done = connection.client.query(sql, values).then(
    value => { pending.settled = true; return { value } },
    error => { pending.settled = true; return { error } },
  )
  return pending
}

async function rpcResult(pending) {
  const outcome = await pending.done
  if (outcome.error) throw outcome.error
  return outcome.value
}

async function waitForBlocked(db, pending, holderPid) {
  const deadline = performance.now() + BLOCK_TIMEOUT_MS
  let lastState
  while (performance.now() < deadline) {
    if (pending.settled) {
      const { error } = await pending.done
      assert.fail(`RPC ${pending.pid} completed before its lock wait was observed`
        + (error ? `: ${error.code} ${error.message}` : ''))
    }
    const { rows } = await db.admin.query(`with recursive blockers(pid, path) as (
      select $1::integer, array[$1::integer]
      union all
      select blocker.pid, blockers.path || blocker.pid
      from blockers
      cross join lateral unnest(pg_blocking_pids(blockers.pid)) as blocker(pid)
      where not (blocker.pid = any(blockers.path))
    )
    select a.state, a.wait_event_type, a.wait_event,
      pg_blocking_pids(a.pid) as blocking_pids,
      exists(select 1 from blockers where pid = $2::integer) as waiting_for_holder
    from pg_stat_activity a
    where a.pid = $1::integer and a.datname = current_database()`,
    [pending.pid, holderPid])
    lastState = rows[0]
    // A second waiter may wait behind the first waiter's tuple lock. Follow
    // that real blocking chain rather than assuming both block directly on us.
    if (lastState?.state === 'active' && lastState.wait_event_type === 'Lock'
        && lastState.waiting_for_holder) return
    await setImmediate() // Yield only; elapsed time is never evidence of a lock.
  }
  assert.fail(`RPC ${pending.pid} did not block on ${holderPid} within ${BLOCK_TIMEOUT_MS}ms: ${JSON.stringify(lastState)}`)
}

// Only the deliberately competing transaction is held open, never the whole
// test. Roll it back on assertion failure so other sessions can finish cleanup.
async function transaction(connection, run) {
  await connection.client.query('begin isolation level read committed')
  let committed = false
  try {
    return await run(async () => {
      await connection.client.query('commit')
      committed = true
    })
  } finally {
    if (!committed) await connection.client.query('rollback')
  }
}

async function lockTenant(connection, tenantId) {
  const result = await connection.client.query(
    'select id from public.tenants where id = $1::uuid for update', [tenantId])
  assert.equal(result.rowCount, 1)
}

async function enableGoogle(db, connection) {
  await connection.client.query('select public.google_data_set_enabled($1::uuid, $2::boolean)',
    [db.ids.platform, true])
}

async function beginAttempt(db, connection, userId = db.ids.ownerA) {
  const attempt = {
    tenantId: db.ids.tenantA,
    userId,
    stateHash: randomBytes(32).toString('hex'),
    browserHash: randomBytes(32).toString('hex'),
  }
  await connection.client.query(`select public.google_oauth_begin(
    $1::uuid, $2::uuid, $3::text, $4::text, $5::text, $6::jsonb
  )`, [attempt.tenantId, attempt.userId, attempt.stateHash, attempt.browserHash, null,
    { fixture: 'synthetic-pkce-envelope' }])
  return attempt
}

function consumeValues(attempt) {
  return [attempt.stateHash, attempt.browserHash]
}

function finishValues(db, attempt, marker) {
  return [attempt.stateHash, attempt.tenantId, attempt.userId, { fixture: marker }, db.scopes]
}

async function readConnection(db) {
  const result = await db.admin.query(
    'select * from public.google_tenant_connections where tenant_id = $1::uuid', [db.ids.tenantA])
  assert.equal(result.rowCount, 1)
  return result.rows[0]
}

async function seedConnection(db, connection) {
  const attempt = await beginAttempt(db, connection)
  const consumed = await connection.client.query(CONSUME_SQL, consumeValues(attempt))
  assert.equal(consumed.rowCount, 1)
  const finished = await connection.client.query(FINISH_SQL, finishValues(db, attempt, 'initial-connection'))
  assert.equal(finished.rows[0].accepted, true)
  return readConnection(db)
}

async function assertConsumedGuard(db, attempt) {
  const { rows, rowCount } = await db.admin.query(`select tenant_id, user_id, consumed_at, invalidated_at
    from public.google_oauth_attempts where state_hash = $1::text`, [attempt.stateHash])
  assert.equal(rowCount, 1, 'The consumed callback must retain its disconnect guard')
  assert.equal(rows[0].tenant_id, attempt.tenantId)
  assert.equal(rows[0].user_id, attempt.userId)
  assert.notEqual(rows[0].consumed_at, null)
  assert.equal(rows[0].invalidated_at, null)
}

async function demoteWhileWaiting(db, holder, userId, boundary, launch) {
  return transaction(holder, async commit => {
    if (boundary === 'tenant') {
      await lockTenant(holder, db.ids.tenantA)
    } else {
      const locked = await holder.client.query(`select user_id from public.tenant_members
        where tenant_id = $1::uuid and user_id = $2::uuid for update`, [db.ids.tenantA, userId])
      assert.equal(locked.rowCount, 1)
    }
    const pending = launch()
    await waitForBlocked(db, pending, holder.pid)
    const changed = await holder.client.query(`update public.tenant_members set role = $3::text
      where tenant_id = $1::uuid and user_id = $2::uuid returning role`, [db.ids.tenantA, userId, 'member'])
    assert.deepEqual(changed.rows, [{ role: 'member' }])
    await commit()
    return pending.done
  })
}

test('two simultaneous consumes of one state have exactly one winner', { timeout: TEST_TIMEOUT_MS }, async t => {
  const db = await createDatabase(t)
  const holder = await session(db)
  const first = await session(db)
  const second = await session(db)
  await enableGoogle(db, holder)
  const attempt = await beginAttempt(db, holder)

  const results = await transaction(holder, async commit => {
    await lockTenant(holder, attempt.tenantId)
    const contenders = [first, second].map(connection => startRpc(connection, CONSUME_SQL, consumeValues(attempt)))
    await Promise.all(contenders.map(pending => waitForBlocked(db, pending, holder.pid)))
    await commit()
    return Promise.all(contenders.map(rpcResult))
  })

  assert.deepEqual(results.map(result => result.rowCount).sort(), [0, 1])
  const winner = results.flatMap(result => result.rows)
  assert.equal(winner[0].state_hash, attempt.stateHash)
  assert.equal(winner[0].browser_hash, attempt.browserHash)
  await assertConsumedGuard(db, attempt)
  assert.equal((await first.client.query(CONSUME_SQL, consumeValues(attempt))).rowCount, 0, 'Replay must still fail after both commits')
})

test('disconnect commits first: a waiting consume cannot resurrect the cancelled attempt', { timeout: TEST_TIMEOUT_MS }, async t => {
  const db = await createDatabase(t)
  const disconnect = await session(db)
  const consume = await session(db)
  await enableGoogle(db, disconnect)
  const original = await seedConnection(db, disconnect)
  const attempt = await beginAttempt(db, disconnect)

  const consumed = await transaction(disconnect, async commit => {
    const removed = await disconnect.client.query(DISCONNECT_SQL, [db.ids.tenantA, db.ids.ownerA])
    assert.deepEqual(removed.rows, [original])
    const pending = startRpc(consume, CONSUME_SQL, consumeValues(attempt))
    await waitForBlocked(db, pending, disconnect.pid)
    await commit()
    return rpcResult(pending)
  })

  assert.equal(consumed.rowCount, 0)
  const finished = await consume.client.query(FINISH_SQL, finishValues(db, attempt, 'must-not-be-saved'))
  assert.equal(finished.rows[0].accepted, false)
  assert.equal((await db.admin.query('select * from public.google_oauth_attempts where tenant_id = $1::uuid', [db.ids.tenantA])).rowCount, 0)
  assert.equal((await db.admin.query('select * from public.google_tenant_connections where tenant_id = $1::uuid', [db.ids.tenantA])).rowCount, 0)
})

test('consume commits first: a waiting disconnect rejects without deleting tokens or the guard', { timeout: TEST_TIMEOUT_MS }, async t => {
  const db = await createDatabase(t)
  const consume = await session(db)
  const disconnect = await session(db)
  await enableGoogle(db, consume)
  const original = await seedConnection(db, consume)
  const attempt = await beginAttempt(db, consume)

  const outcome = await transaction(consume, async commit => {
    assert.equal((await consume.client.query(CONSUME_SQL, consumeValues(attempt))).rowCount, 1)
    const pending = startRpc(disconnect, DISCONNECT_SQL, [db.ids.tenantA, db.ids.ownerA])
    await waitForBlocked(db, pending, consume.pid)
    await commit()
    return pending.done
  })

  assert.ok(outcome.error, 'Disconnect must reject an in-flight callback')
  assert.equal(outcome.error.code, 'P0001', 'A timeout/deadlock is not an acceptable rejection')
  assert.equal(outcome.error.message, 'GOOGLE_OAUTH_IN_PROGRESS')
  await assertConsumedGuard(db, attempt)
  assert.deepEqual(await readConnection(db), original)
})

// Exercise both boundaries: authorization must be checked after a tenant-lock
// wait, and a SELECT ... FOR SHARE must recheck a role changed while it waited.
for (const boundary of ['tenant', 'membership']) {
  test(`finish refuses role loss while waiting on ${boundary}`, { timeout: TEST_TIMEOUT_MS }, async t => {
    const db = await createDatabase(t)
    const holder = await session(db)
    const callback = await session(db)
    await enableGoogle(db, holder)
    const original = await seedConnection(db, holder)
    const attempt = await beginAttempt(db, holder, db.ids.adminA)
    assert.equal((await holder.client.query(CONSUME_SQL, consumeValues(attempt))).rowCount, 1)

    const outcome = await demoteWhileWaiting(db, holder, db.ids.adminA, boundary,
      () => startRpc(callback, FINISH_SQL, finishValues(db, attempt, 'must-not-overwrite')))

    assert.ifError(outcome.error)
    assert.equal(outcome.value.rows[0].accepted, false)
    assert.deepEqual(await readConnection(db), original)
    await assertConsumedGuard(db, attempt)
  })

  test(`connection_update rejects actor role loss while waiting on ${boundary}`, { timeout: TEST_TIMEOUT_MS }, async t => {
    const db = await createDatabase(t)
    const holder = await session(db)
    const update = await session(db)
    await enableGoogle(db, holder)
    const original = await seedConnection(db, holder)

    const outcome = await demoteWhileWaiting(db, holder, db.ids.adminA, boundary,
      () => startRpc(update, UPDATE_SQL, [db.ids.tenantA, db.ids.adminA, original.revision,
        'connected', { fixture: 'must-not-overwrite' }, false]))

    assert.ok(outcome.error, 'An actor who lost admin privileges must be rejected')
    assert.equal(outcome.error.code, 'P0001', 'A timeout/deadlock is not an acceptable rejection')
    assert.equal(outcome.error.message, 'GOOGLE_TENANT_ADMIN_REQUIRED')
    assert.deepEqual(await readConnection(db), original)
  })

  for (const [status, returningResources] of [['connected', false], ['needs_reconnect', true]]) {
    test(`connection_update refuses authorizer role loss on ${boundary} (${status}, resources=${returningResources})`, { timeout: TEST_TIMEOUT_MS }, async t => {
      const db = await createDatabase(t)
      const holder = await session(db)
      const update = await session(db)
      await enableGoogle(db, holder)
      const original = await seedConnection(db, holder)

      // The caller is still adminA. Revoking ownerA tests the distinct original
      // authorizer, including partial resources in needs_reconnect responses.
      const outcome = await demoteWhileWaiting(db, holder, db.ids.ownerA, boundary,
        () => startRpc(update, UPDATE_SQL, [db.ids.tenantA, db.ids.adminA, original.revision,
          status, { fixture: 'must-not-overwrite' }, returningResources]))

      assert.ifError(outcome.error)
      assert.equal(outcome.value.rows[0].accepted, false)
      assert.deepEqual(await readConnection(db), original)
    })
  }
}

test('simultaneous ensure_personal_tenant calls provision only one tenant for a new user', { timeout: TEST_TIMEOUT_MS }, async t => {
  const db = await createDatabase(t)
  const holder = await session(db)
  const first = await session(db)
  const second = await session(db)
  const userId = randomUUID()
  await db.admin.query('insert into auth.users(id, email) values($1::uuid, $2::text)', [userId, 'new-user@example.test'])
  const before = await db.admin.query('select count(*)::integer as count from public.tenants')
  assert.equal((await db.admin.query('select tenant_id from public.tenant_members where user_id = $1::uuid', [userId])).rowCount, 0)

  const results = await transaction(holder, async commit => {
    // Same transaction-scoped key as the real provisioning RPC; no mocked lock.
    await holder.client.query('select pg_advisory_xact_lock(hashtextextended($1::text, $2::bigint))', [userId, 1])
    const contenders = [first, second].map(connection => startRpc(connection,
      'select public.ensure_personal_tenant($1::uuid) as tenant_id', [userId]))
    await Promise.all(contenders.map(pending => waitForBlocked(db, pending, holder.pid)))
    await commit()
    return Promise.all(contenders.map(rpcResult))
  })

  const tenantId = results[0].rows[0].tenant_id
  assert.ok(tenantId)
  assert.equal(results[1].rows[0].tenant_id, tenantId)
  const tenants = await db.admin.query('select id, created_by from public.tenants where created_by = $1::uuid', [userId])
  assert.deepEqual(tenants.rows, [{ id: tenantId, created_by: userId }])
  const memberships = await db.admin.query('select tenant_id, role from public.tenant_members where user_id = $1::uuid', [userId])
  assert.deepEqual(memberships.rows, [{ tenant_id: tenantId, role: 'owner' }])
  const after = await db.admin.query('select count(*)::integer as count from public.tenants')
  assert.equal(after.rows[0].count, before.rows[0].count + 1, 'No orphan tenant may be left by a losing contender')
})

test('compare-and-swap accepts exactly one of two concurrent updates using the same revision', { timeout: TEST_TIMEOUT_MS }, async t => {
  const db = await createDatabase(t)
  const holder = await session(db)
  const first = await session(db)
  const second = await session(db)
  await enableGoogle(db, holder)
  const original = await seedConnection(db, holder)
  const envelopes = [{ fixture: 'writer-a' }, { fixture: 'writer-b' }]

  const results = await transaction(holder, async commit => {
    await lockTenant(holder, db.ids.tenantA)
    const contenders = [first, second].map((connection, index) => startRpc(connection, UPDATE_SQL,
      [db.ids.tenantA, db.ids.adminA, original.revision, 'connected', envelopes[index], false]))
    await Promise.all(contenders.map(pending => waitForBlocked(db, pending, holder.pid)))
    await commit()
    return Promise.all(contenders.map(rpcResult))
  })

  const accepted = results.map(result => result.rows[0].accepted)
  assert.deepEqual([...accepted].sort(), [false, true])
  const winner = accepted.indexOf(true)
  const current = await readConnection(db)
  assert.notEqual(current.revision, original.revision)
  assert.equal(current.authorized_by, original.authorized_by)
  assert.equal(current.status, 'connected')
  assert.deepEqual(current.token_envelope, envelopes[winner])
  assert.notEqual(current.last_checked_at, null)
  const stale = await first.client.query(UPDATE_SQL,
    [db.ids.tenantA, db.ids.adminA, original.revision, 'connected', { fixture: 'stale-retry' }, false])
  assert.equal(stale.rows[0].accepted, false)
  assert.deepEqual(await readConnection(db), current, 'A stale retry cannot overwrite the winning revision')
})
