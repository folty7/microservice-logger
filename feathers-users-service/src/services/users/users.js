import { authenticate } from '@feathersjs/authentication'
import { Conflict } from '@feathersjs/errors'
import { logger } from '../../logger.js'

import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  usersDataValidator,
  usersPatchValidator,
  usersQueryValidator,
  usersResolver,
  usersExternalResolver,
  usersDataResolver,
  usersPatchResolver,
  usersQueryResolver
} from './users.schema.js'
import { UsersService, getOptions } from './users.class.js'

export const usersPath = 'users'
export const usersMethods = ['find', 'get', 'create', 'patch', 'remove']

export * from './users.class.js'
export * from './users.schema.js'

const DUPLICATE_KEY_ERROR = 11000

// The unique email index rejects duplicates with a generic Mongo error; expose it as a 409
const conflictOnDuplicateEmail = async (context, next) => {
  try {
    await next()
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR || error.data?.code === DUPLICATE_KEY_ERROR) {
      throw new Conflict('An account with this email already exists')
    }
    throw error
  }
}

const ensureIndexes = app =>
  app
    .get('mongodbClient')
    .then(db => db.collection('users').createIndex({ email: 1 }, { unique: true }))
    .catch(error => logger.error(`Could not create unique index on users.email: ${error.message}`))

// A configure function that registers the service and its hooks via `app.configure`
export const users = app => {
  // Register our service on the Feathers application
  app.use(usersPath, new UsersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: usersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  ensureIndexes(app)

  // Initialize hooks
  app.service(usersPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(usersExternalResolver), schemaHooks.resolveResult(usersResolver)],
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      create: [conflictOnDuplicateEmail],
      update: [authenticate('jwt')],
      patch: [authenticate('jwt'), conflictOnDuplicateEmail],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [schemaHooks.validateQuery(usersQueryValidator), schemaHooks.resolveQuery(usersQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(usersDataValidator), schemaHooks.resolveData(usersDataResolver)],
      patch: [schemaHooks.validateData(usersPatchValidator), schemaHooks.resolveData(usersPatchResolver)],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
