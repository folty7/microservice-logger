// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'

export const authentication = app => {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())

  app.use('auth', authentication)
}
