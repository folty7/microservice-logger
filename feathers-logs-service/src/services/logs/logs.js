// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

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

// A configure function that registers the service and its hooks via `app.configure`
export const logs = app => {
  // Register our service on the Feathers application
  app.use(logsPath, new LogsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: logsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(logsPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(logsExternalResolver), schemaHooks.resolveResult(logsResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(logsQueryValidator), schemaHooks.resolveQuery(logsQueryResolver)],
      find: [],
      create: [schemaHooks.validateData(logsDataValidator), schemaHooks.resolveData(logsDataResolver)]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
