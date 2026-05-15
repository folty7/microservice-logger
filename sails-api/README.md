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
- `maskdata` for request-body field masking
- `fast-redact` dependency available for structured redaction use cases

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
- `requestsLogger` records method, URL, status, duration, IP, user agent, query, and masked body.
- `errorHandler` returns normalized JSON error responses.

Masked request body fields include:

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
- `Authorization`

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
- Log authorization is enforced by the logs service through JWT validation.
