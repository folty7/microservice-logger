// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { ObjectIdSchema } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'
import { getAuthPayload, isAdmin } from '../../auth-payload.js'

// Main data model schema
export const logsSchema = {
  $id: 'Logs',
  type: 'object',
  additionalProperties: false,
  required: ['text', 'level', 'type'],
  properties: {
    _id: ObjectIdSchema(),
    text: { type: 'string', minLength: 1, maxLength: 10000 },
    level: {    // standard syslog levels, https://en.wikipedia.org/wiki/Syslog#Message_components
      type: 'integer',
      minimum: 0,
      maximum: 7
    },
    // Event time reported by the client; the server fills it in when it is missing
    timeStamp: { type: 'string', format: 'date-time' },
    type: { enum: ['system', 'user'] },
    // Set by the server: id of the user whose token created the log
    userId: { type: 'string' },
    // Set by the server: when the log was received (ISO 8601, sortable)
    createdAt: { type: 'string', format: 'date-time' },
    // Set by the server when LOG_RETENTION_DAYS is configured; a TTL index deletes the log then
    expiresAt: { type: 'string', format: 'date-time' }
  }
}
export const logsValidator = getValidator(logsSchema, dataValidator)
export const logsResolver = resolve({})

export const logsExternalResolver = resolve({})

// Schema pre vytváranie (POST). `_id`, `userId` and `createdAt` are server-controlled.
const { text, level, timeStamp, type } = logsSchema.properties
export const logsDataSchema = {
  $id: 'LogsData',
  type: 'object',
  additionalProperties: false,
  required: ['text', 'level', 'type'],
  properties: { text, level, timeStamp, type }
}
export const logsDataValidator = getValidator(logsDataSchema, dataValidator)
export const logsDataResolver = resolve({
  // Clients that do not send an event time get the receive time
  timeStamp: async (value, data, context) => value ?? new Date().toISOString(),
  userId: async (value, data, context) => getAuthPayload(context)?.sub ?? value,
  createdAt: async () => new Date().toISOString(),
  expiresAt: async (value, data, context) => {
    const retentionDays = context.app.get('logRetentionDays')

    // Stored as a Date so MongoDB's TTL index can expire it; logs without it are kept forever
    return retentionDays > 0 ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : undefined
  }
})


// Schema for allowed query properties
export const logsQuerySchema = {
  $id: 'LogsQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(logsSchema.properties)
  }
}
export const logsQueryValidator = getValidator(logsQuerySchema, queryValidator)
export const logsQueryResolver = resolve({
  // Regular users only ever see their own logs; admins and internal calls see everything
  userId: async (value, query, context) => {
    const payload = getAuthPayload(context)

    return payload && !isAdmin(payload) ? payload.sub : value
  }
})
