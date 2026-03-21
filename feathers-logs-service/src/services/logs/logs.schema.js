// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { ObjectIdSchema } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const logsSchema = {
  $id: 'Logs',
  type: 'object',
  additionalProperties: false,
  required: ['_id', 'text'],
  properties: {
    _id: ObjectIdSchema(),
    text: { type: 'string' }
  }
}
export const logsValidator = getValidator(logsSchema, dataValidator)
export const logsResolver = resolve({})

export const logsExternalResolver = resolve({})

// Schema for creating new data
export const logsDataSchema = {
  $id: 'LogsData',
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    ...logsSchema.properties
  }
}
export const logsDataValidator = getValidator(logsDataSchema, dataValidator)
export const logsDataResolver = resolve({})

// Schema for updating existing data
export const logsPatchSchema = {
  $id: 'LogsPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...logsSchema.properties
  }
}
export const logsPatchValidator = getValidator(logsPatchSchema, dataValidator)
export const logsPatchResolver = resolve({})

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
