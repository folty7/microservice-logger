# Sails API Gateway

Public HTTP gateway for the logging platform. This Sails.js service exposes the browser-facing API and forwards domain requests to the internal Feathers users and logs services.

## Responsibilities

- Provide stable public routes for the React frontend.
- Forward authentication and user requests to `feathers-users-service`.
- Forward log read/write requests to `feathers-logs-service`.
- Preserve request method, path, body, query parameters, and `Authorization` header when proxying.
- Log HTTP request metadata with sensitive body fields redacted.
- Provide a lightweight health endpoint.

## Stack

- Node.js
- Sails.js 1.5
- Axios
- Skipper body parser
- Built-in recursive redaction of sensitive request-body fields

## Routes

Routes are defined in `config/routes.js`.

| Method | Path | Controller | Target |
| --- | --- | --- | --- |
| `GET` | `/api/health` | `api/health` | Gateway health check |
| `POST` | `/auth` | `auth/create` | Users Feathers service |
| `POST` | `/users` | `users/create` | Users Feathers service |
| `GET` | `/logs` | `logs/find` | Logs Feathers service |
| `POST` | `/logs` | `logs/create` | Logs Feathers service |

## Forwarding

The shared forwarding utility is `api/utils/forward-request.js`.

Forwarded request data:

- HTTP method
- Original path
- JSON body
- Query parameters
- `Authorization` header

Downstream service URLs are configured in `config/services.js`:

| Variable | Purpose |
| --- | --- |
| `FEATHERS_LOGS_URL` | Base URL for the logs service |
| `FEATHERS_USERS_URL` | Base URL for the users/auth service |

## Middleware

Configured in `config/http.js`.

- `bodyParser` uses Skipper with strict parsing.
- `requestsLogger` runs before the router, so every request is logged: method, URL, status, duration and IP at `info` level, the masked body only at `debug` level (production logs at `info`, so bodies are never written there).
- `errorHandler` returns normalized JSON error responses.

Upstream errors (4xx/5xx) from the Feathers services are relayed unchanged. Requests time out after 10 s; a timeout returns `504`, an unreachable service `502`.

## Rate limiting

Policies in `api/policies/` (mapped in `config/policies.js`), in-memory per gateway process and keyed by client IP:

| Route | Limit |
| --- | --- |
| `POST /auth` | 10 failed logins per 15 minutes (successful logins are not counted) |
| `POST /users` | 10 sign-ups per hour |

Exceeding a limit returns `429` with a `Retry-After` header. Behind a proxy that does not forward a trusted client IP (such as the Vite dev proxy), all clients share one bucket.

Masked request body fields (matched case-insensitively at any nesting level) include:

- `password`
- `token`
- `secret`
- `authorization`
- `apiKey`
- `creditCard`
- `accessToken`
- `refreshToken`
- `jwt`
- `cookie`

## Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm start
npm test
npm run lint
```

## Docker

The service is built from `node:22-alpine`, installs dependencies with `npm ci`, and starts with `npm start` by default. In Docker Compose development mode it runs:

```bash
npm run dev
```

Compose exposes the gateway on host port `8080`.

## Notes

- The gateway does not persist data directly.
- Authentication is delegated to the users service.
- Log authorization (ownership and roles) is enforced by the logs service using the JWT payload.
