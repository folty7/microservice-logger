// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { ObjectIdSchema } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const logsSchema = {
  $id: 'Logs',
  type: 'object',
  additionalProperties: false,
  required: ['text', 'level', 'timeStamp', 'type'],
  properties: {
    _id: ObjectIdSchema(),
    text: { type: 'string' },
    level: {
      type: 'integer',
      minimum: 1,
      maximum: 9
    },
    timeStamp: { type: 'string' },
    type: { enum: ['system', 'user'] },
  }
}
export const logsValidator = getValidator(logsSchema, dataValidator)
export const logsResolver = resolve({})

export const logsExternalResolver = resolve({})

// Schema pre vytváranie (POST)
export const logsDataSchema = {
  $id: 'LogsData',
  type: 'object',
  additionalProperties: false,
  required: ['text', 'level', 'timeStamp', 'type'],
  properties: {
    ...logsSchema.properties
  }
}
export const logsDataValidator = getValidator(logsDataSchema, dataValidator)
export const logsDataResolver = resolve({})


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
export const logsQueryResolver = resolve({})
