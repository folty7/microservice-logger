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
  required: ['text', 'level', 'timeStamp', 'type'],
  properties: {
    _id: ObjectIdSchema(),
    text: { type: 'string' },
    level: {    // standard syslog levels, https://en.wikipedia.org/wiki/Syslog#Message_components
      type: 'integer',
      minimum: 0,
      maximum: 7
    },
    timeStamp: { type: 'string' },
    type: { enum: ['system', 'user'] },
    // Set by the server: id of the user whose token created the log
    userId: { type: 'string' },
    // Set by the server: when the log was received (ISO 8601, sortable)
    createdAt: { type: 'string', format: 'date-time' }
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
  required: ['text', 'level', 'timeStamp', 'type'],
  properties: { text, level, timeStamp, type }
}
export const logsDataValidator = getValidator(logsDataSchema, dataValidator)
export const logsDataResolver = resolve({
  userId: async (value, data, context) => getAuthPayload(context)?.sub ?? value,
  createdAt: async () => new Date().toISOString()
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
