// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { OAuthStrategy, oauth } from '@feathersjs/authentication-oauth'

const MIN_SECRET_LENGTH = 32

// Refuse to start with a missing or weak JWT secret instead of silently falling back to one.
const assertSecret = app => {
  const secret = app.get('authentication')?.secret
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `FEATHERS_SECRET must be set to a random string of at least ${MIN_SECRET_LENGTH} characters`
    )
  }
}

// Puts the user's role into the access token so other services (logs) can authorize
// without querying the users service. Accounts created before roles existed count as 'user'.
class RoleAwareAuthenticationService extends AuthenticationService {
  async getPayload(authResult, params) {
    const payload = await super.getPayload(authResult, params)
    // The entity is stored under the configured entity name ("users" in config/default.json)
    const user = authResult[this.configuration.entity]

    return user ? { ...payload, role: user.role || 'user' } : payload
  }
}

// Emails are stored lowercase (see users.schema.js), so match logins case-insensitively too
class EmailLocalStrategy extends LocalStrategy {
  async authenticate(data, params) {
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : data.email

    return super.authenticate({ ...data, email }, params)
  }
}

export const authentication = app => {
  assertSecret(app)

  const authentication = new RoleAwareAuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())
  authentication.register('local', new EmailLocalStrategy())
  authentication.register('github', new OAuthStrategy())
  authentication.register('google', new OAuthStrategy())

  app.use('auth', authentication)
  app.configure(oauth({}))
}
