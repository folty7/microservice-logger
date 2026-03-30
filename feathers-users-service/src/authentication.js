// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { OAuthStrategy, oauth } from '@feathersjs/authentication-oauth'

export const authentication = app => {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())
  authentication.register('local', new LocalStrategy())
  authentication.register('github', new OAuthStrategy())
  authentication.register('google', new OAuthStrategy())

  app.use('auth', authentication)
  app.configure(oauth({}))
}
