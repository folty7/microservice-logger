import { authenticate } from '@feathersjs/authentication'
import { Forbidden } from '@feathersjs/errors'
import { getAuthPayload, isAdmin } from '../../auth-payload.js'
import { logger } from '../../logger.js'

import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  logsDataValidator,
  logsQueryValidator,
  logsResolver,
  logsExternalResolver,
  logsDataResolver,
  logsQueryResolver
} from './logs.schema.js'
import { LogsService, getOptions } from './logs.class.js'

export const logsPath = 'logs'
export const logsMethods = ['find', 'create']

export * from './logs.class.js'
export * from './logs.schema.js'

// Only admins may write `system` logs; regular users can only log `user` events
const restrictSystemLogs = async context => {
  const payload = getAuthPayload(context)
  const entries = Array.isArray(context.data) ? context.data : [context.data]

  if (payload && !isAdmin(payload) && entries.some(entry => entry?.type === 'system')) {
    throw new Forbidden("Only admins can create logs of type 'system'")
  }
}

// Supports the default dashboard query: own logs (or all logs for admins), newest first
const ensureIndexes = app =>
  app
    .get('mongodbClient')
    .then(db =>
      db.collection('logs').createIndexes([{ key: { userId: 1, createdAt: -1 } }, { key: { createdAt: -1 } }])
    )
    .catch(error => logger.error(`Could not create indexes on logs: ${error.message}`))

// A configure function that registers the service and its hooks via `app.configure`
export const logs = app => {
  // Register our service on the Feathers application
  app.use(logsPath, new LogsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: logsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  ensureIndexes(app)

  // Initialize hooks
  app.service(logsPath).hooks({
    around: {
      all: [authenticate('jwt'), schemaHooks.resolveExternal(logsExternalResolver), schemaHooks.resolveResult(logsResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(logsQueryValidator), schemaHooks.resolveQuery(logsQueryResolver)],
      find: [],
      create: [
        schemaHooks.validateData(logsDataValidator),
        restrictSystemLogs,
        schemaHooks.resolveData(logsDataResolver)
      ]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
