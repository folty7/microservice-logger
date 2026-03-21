// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  logsDataValidator,
  logsPatchValidator,
  logsQueryValidator,
  logsResolver,
  logsExternalResolver,
  logsDataResolver,
  logsPatchResolver,
  logsQueryResolver
} from './logs.schema.js'
import { LogsService, getOptions } from './logs.class.js'

export const logsPath = 'logs'
export const logsMethods = ['find', 'get', 'create', 'patch', 'remove']

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
      get: [],
      create: [schemaHooks.validateData(logsDataValidator), schemaHooks.resolveData(logsDataResolver)],
      patch: [schemaHooks.validateData(logsPatchValidator), schemaHooks.resolveData(logsPatchResolver)],
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
