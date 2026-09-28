// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app.js'

const ALICE = '507f1f77bcf86cd799439011'
const BOB = '507f1f77bcf86cd799439012'

// Builds the params of an external request carrying a real access token for this user/role
const as = async (sub, role) => {
  const accessToken = await app.service('auth').createAccessToken({ sub, role })

  return { provider: 'rest', authentication: { strategy: 'jwt', accessToken } }
}

const logData = (overrides = {}) => ({
  text: 'something happened',
  level: 6,
  timeStamp: new Date().toISOString(),
  type: 'user',
  ...overrides
})

const rejects = async (fn, expectedCode) => {
  try {
    await fn()
    assert.fail(`expected the call to fail with ${expectedCode}`)
  } catch (error) {
    assert.strictEqual(error.code, expectedCode, `expected ${expectedCode}, got ${error.code}: ${error.message}`)
  }
}

describe('logs service', () => {
  const logs = () => app.service('logs')
  let alice
  let bob
  let admin

  before(async () => {
    await app.setup()
    alice = await as(ALICE, 'user')
    bob = await as(BOB, 'user')
    admin = await as(BOB, 'admin')
  })

  after(async () => {
    const db = await app.get('mongodbClient')
    await db.collection('logs').deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(logs(), 'Registered the service')
  })

  it('requires authentication', async () => {
    await rejects(() => logs().find({ provider: 'rest' }), 401)
  })

  it('stamps userId and createdAt from the token', async () => {
    const log = await logs().create(logData({ text: 'alice one' }), alice)

    assert.strictEqual(log.userId, ALICE)
    assert.ok(!Number.isNaN(Date.parse(log.createdAt)), 'createdAt is a date')
  })

  it('fills in a missing timeStamp with the receive time', async () => {
    const { timeStamp, ...withoutTimeStamp } = logData({ text: 'no timestamp' })
    const log = await logs().create(withoutTimeStamp, alice)

    assert.ok(!Number.isNaN(Date.parse(log.timeStamp)), 'timeStamp was filled in')
  })

  it('rejects client-supplied userId and invalid data', async () => {
    await rejects(() => logs().create(logData({ userId: BOB }), alice), 400)
    await rejects(() => logs().create(logData({ timeStamp: 'yesterday' }), alice), 400)
    await rejects(() => logs().create(logData({ level: 9 }), alice), 400)
    await rejects(() => logs().create(logData({ text: '' }), alice), 400)
  })

  it("lets only admins write 'system' logs", async () => {
    await rejects(() => logs().create(logData({ type: 'system' }), alice), 403)

    const log = await logs().create(logData({ type: 'system', text: 'system one' }), admin)
    assert.strictEqual(log.type, 'system')
  })

  it('shows users only their own logs, newest first', async () => {
    await logs().create(logData({ text: 'alice two' }), alice)
    await logs().create(logData({ text: 'bob one' }), bob)

    const page = await logs().find({ ...alice, query: { $sort: { createdAt: -1 } } })

    assert.deepStrictEqual(
      page.data.map(log => log.text),
      ['alice two', 'no timestamp', 'alice one']
    )
  })

  it("ignores a query for another user's logs", async () => {
    const page = await logs().find({ ...alice, query: { userId: BOB } })

    assert.ok(page.data.every(log => log.userId === ALICE), 'only own logs are returned')
  })

  it('shows admins every log', async () => {
    const page = await logs().find({ ...admin, query: {} })

    assert.strictEqual(page.total, 5)
  })
})
