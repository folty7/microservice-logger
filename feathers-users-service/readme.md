# Feathers Users Service

User persistence and authentication microservice for the logging platform. It stores users in MongoDB, issues JWT access tokens, hashes local passwords, and exposes the `users` and `auth` Feathers services to the Sails API gateway.

## Responsibilities

- Create users in the `users` MongoDB collection.
- Authenticate users with Feathers local email/password strategy.
- Issue JWT access tokens through the Feathers authentication service.
- Hash passwords before create/patch operations.
- Remove password fields from external responses.
- Restrict authenticated user queries to the current user's `_id`.
- Provide optional Socket.IO transport and authenticated channels for future real-time features.

## Stack

- Node.js ESM
- FeathersJS 5
- Feathers Express
- Feathers REST
- Feathers Socket.IO
- Feathers authentication, JWT, local auth, and OAuth strategy registration
- Feathers schema validation/resolvers
- MongoDB via `@feathersjs/mongodb`
- Winston logging
- Mocha test runner

## Exposed Services

### `auth`

- Registered by `src/authentication.js`.
- Supports:
  - `jwt`
  - `local`
  - `github`
  - `google`
- Local auth uses:
  - username field: `email`
  - password field: `password`

### `users`

Registered at path `users`.

| Method | Auth required | Notes |
| --- | --- | --- |
| `find` | yes | Query resolver limits authenticated users to their own `_id` |
| `get` | yes | Returns a single user |
| `create` | no | Validates input and hashes password |
| `patch` | yes | Validates patch data and hashes password if present |
| `remove` | yes | Removes user records |

## User Schema

```json
{
  "_id": "ObjectId",
  "email": "string",
  "password": "string"
}
```

Schema behavior:

- `additionalProperties` is disabled.
- `email` is required on create.
- `password` is processed by `passwordHash({ strategy: 'local' })`.
- External resolver returns `password: undefined`.

## Configuration

Default configuration is in `config/default.json`. Docker Compose overrides these values through environment variables.

| Variable | Purpose |
| --- | --- |
| `PORT` | Service port inside the container; Compose sets `8082` |
| `HOSTNAME` | Host binding override |
| `MONGODB` | MongoDB connection string |
| `FEATHERS_SECRET` | JWT signing secret shared with the logs service |

The default MongoDB database path is parsed from the connection URL and used to initialize the Feathers MongoDB client.

## Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm start
npm test
npm run mocha
npm run prettier
```

## Docker

The service is built from `node:22-alpine`, installs dependencies with `npm ci`, and starts with `npm start` by default. In Docker Compose development mode it runs:

```bash
npm run dev
```

## Tests

Tests live in `test/` and currently cover:

- Application startup.
- Static index response.
- JSON 404 handling.
- `users` service registration.
