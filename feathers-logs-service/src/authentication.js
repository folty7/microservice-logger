// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'

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

export const authentication = app => {
  assertSecret(app)

  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())

  app.use('auth', authentication)
}
