# Feathers Logs Service

JWT-protected log persistence microservice for the logging platform. It exposes a small Feathers service for creating and querying structured log entries stored in MongoDB.

## Responsibilities

- Persist log records in the `logs` MongoDB collection.
- Validate log payloads with Feathers JSON schemas.
- Enforce JWT authentication on all external log operations.
- Support Feathers query syntax for filtering, pagination, and sorting.
- Provide a REST API consumed through the Sails API gateway.

## Stack

- Node.js ESM
- FeathersJS 5
- Feathers Express
- Feathers REST
- Feathers authentication with JWT strategy
- Feathers schema validation/resolvers
- MongoDB via `@feathersjs/mongodb`
- Winston logging
- Mocha test runner

## Exposed Services

### `auth`

- Registered by `src/authentication.js`.
- Supports JWT validation only.
- Uses the shared `FEATHERS_SECRET` so access tokens issued by the users service can authorize log requests.

### `logs`

Registered at path `logs`.

| Method | Auth required | Notes |
| --- | --- | --- |
| `find` | yes | Lists logs with Feathers query syntax |
| `create` | yes | Validates and stores a log entry |

## Log Schema

```json
{
  "_id": "ObjectId",
  "text": "string",
  "level": 0,
  "timeStamp": "string",
  "type": "system"
}
```

Schema rules:

- `text`, `level`, `timeStamp`, and `type` are required.
- `level` is an integer from `0` to `7`, matching the syslog severity range.
- `type` must be either `system` or `user`.
- `additionalProperties` is disabled.

## Configuration

Default configuration is in `config/default.json`. Docker Compose overrides these values through environment variables.

| Variable | Purpose |
| --- | --- |
| `PORT` | Service port inside the container; Compose sets `8081` |
| `HOSTNAME` | Host binding override |
| `MONGODB` | MongoDB connection string |
| `FEATHERS_SECRET` | JWT verification secret shared with the users service |

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
- `logs` service registration.
