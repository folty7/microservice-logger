// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app.js'
import { usersExternalResolver } from '../../../src/services/users/users.schema.js'

const rejects = async (fn, expectedCode) => {
  try {
    await fn()
    assert.fail(`expected the call to fail with ${expectedCode}`)
  } catch (error) {
    assert.strictEqual(error.code, expectedCode, `expected ${expectedCode}, got ${error.code}: ${error.message}`)
    return error
  }
}

describe('users service', () => {
  const users = () => app.service('users')
  // Only external calls (with a provider) go through validation and authentication
  const external = { provider: 'rest' }

  before(async () => {
    await app.setup()
  })

  after(async () => {
    const db = await app.get('mongodbClient')
    await db.collection('users').deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(users(), 'Registered the service')
  })

  it('creates a user with role "user", hashes the password and hides it', async () => {
    const user = await users().create({ email: 'Case.Test@Example.com', password: 'password-123' }, external)

    assert.strictEqual(user.email, 'case.test@example.com', 'email is stored lowercase')
    assert.strictEqual(user.role, 'user')

    const stored = await users()._get(user._id)
    assert.notStrictEqual(stored.password, 'password-123', 'password is hashed')

    // What the REST transport actually sends back to a client
    const dispatched = await usersExternalResolver.resolve(stored, { params: {} })
    assert.strictEqual(dispatched.password, undefined, 'password is never sent to clients')
  })

  it('rejects a duplicate email regardless of case', async () => {
    await rejects(() => users().create({ email: 'CASE.TEST@example.com', password: 'other-password' }, external), 409)
  })

  it('rejects invalid registration data', async () => {
    const invalid = [
      { email: 'not-an-email', password: 'password-123' },
      { email: 'short@example.com', password: 'short' },
      { email: 'nopassword@example.com' },
      { email: 'role@example.com', password: 'password-123', role: 'admin' },
      { email: 'id@example.com', password: 'password-123', _id: '507f1f77bcf86cd799439011' }
    ]

    for (const data of invalid) {
      await rejects(() => users().create(data, external), 400)
    }
  })

  it('authenticates case-insensitively and puts the role in the token', async () => {
    const result = await app
      .service('auth')
      .create({ strategy: 'local', email: 'Case.TEST@Example.com', password: 'password-123' }, external)

    assert.ok(result.accessToken, 'returns an access token')
    assert.strictEqual(result.authentication.payload.role, 'user')
  })

  it('rejects a wrong password', async () => {
    await rejects(
      () => app.service('auth').create({ strategy: 'local', email: 'case.test@example.com', password: 'wrong' }, external),
      401
    )
  })

  it('requires authentication for find', async () => {
    await rejects(() => users().find(external), 401)
  })
})
