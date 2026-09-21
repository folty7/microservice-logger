// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { ObjectIdSchema } from '@feathersjs/schema'
import { passwordHash } from '@feathersjs/authentication-local'
import { dataValidator, queryValidator } from '../../validators.js'

export const userRoles = ['admin', 'user']

const normalizeEmail = async value => (typeof value === 'string' ? value.trim().toLowerCase() : value)

const emailSchema = { type: 'string', format: 'email', maxLength: 254 }
const passwordSchema = { type: 'string', minLength: 8, maxLength: 128 }

// Main data model schema
export const usersSchema = {
  $id: 'Users',
  type: 'object',
  additionalProperties: false,
  required: ['_id', 'email'],
  properties: {
    _id: ObjectIdSchema(),
    email: emailSchema,
    password: { type: 'string' },
    role: { type: 'string', enum: userRoles }
  }
}
export const usersValidator = getValidator(usersSchema, dataValidator)
export const usersResolver = resolve({})

export const usersExternalResolver = resolve({
  // The password should never be visible externally
  password: async () => undefined
})

// Schema for creating new data. `_id` and `role` are server-controlled and cannot be sent by clients.
export const usersDataSchema = {
  $id: 'UsersData',
  type: 'object',
  additionalProperties: false,
  required: ['email', 'password'],
  properties: {
    email: emailSchema,
    password: passwordSchema
  }
}
export const usersDataValidator = getValidator(usersDataSchema, dataValidator)
export const usersDataResolver = resolve({
  email: normalizeEmail,
  password: passwordHash({ strategy: 'local' }),
  // Every new account is a regular user; admins are promoted server-side (see seed-admin.js)
  role: async () => 'user'
})

// Schema for updating existing data
export const usersPatchSchema = {
  $id: 'UsersPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    email: emailSchema,
    password: passwordSchema
  }
}
export const usersPatchValidator = getValidator(usersPatchSchema, dataValidator)
export const usersPatchResolver = resolve({
  email: normalizeEmail,
  password: passwordHash({ strategy: 'local' })
})

// Schema for allowed query properties
export const usersQuerySchema = {
  $id: 'UsersQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(usersSchema.properties)
  }
}
export const usersQueryValidator = getValidator(usersQuerySchema, queryValidator)
export const usersQueryResolver = resolve({
  // If there is a user (e.g. with authentication), they are only allowed to see their own data
  _id: async (value, user, context) => {
    if (context.params.user) {
      return context.params.user._id
    }

    return value
  }
})
