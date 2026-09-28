# Logging Backend

Multi-service logging application built with a React dashboard, a Sails API gateway, two FeathersJS services, and MongoDB. The system separates authentication, log persistence, gateway routing, and the browser UI into independently containerized services.

## Architecture

- `react-frontend` - React/Vite SPA for login and log dashboard views.
- `sails-api` - Sails.js API gateway that exposes the public HTTP API and forwards requests to internal Feathers services.
- `feathers-users-service` - FeathersJS user and authentication service backed by MongoDB.
- `feathers-logs-service` - FeathersJS log ingestion/query service backed by MongoDB.
- `mongo` - MongoDB database used by both Feathers services.
- `mongo-express` - Optional database inspection UI, started only with the `debug` Compose profile.

## Service Topology

| Service | Container port | Host port | Purpose |
| --- | ---: | ---: | --- |
| `react-frontend` | `5173` | `5173` | Browser client and Vite dev server |
| `sails-api` | `8080` | `8080` | Public API gateway |
| `feathers-logs-service` | `8081` | internal | Logs service |
| `feathers-users-service` | `8082` | internal | Users/auth service |
| `mongo` | `27017` | `127.0.0.1:27017` | MongoDB (authentication enabled, localhost only) |
| `mongo-express` | `8081` | `127.0.0.1:8088` | MongoDB admin UI (`debug` profile only) |

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Router, Tailwind CSS, shadcn/Radix-style UI primitives.
- API gateway: Sails.js, Node.js, Axios, custom request forwarding middleware.
- Microservices: FeathersJS 5, Feathers Express, Feathers REST, Feathers schema validation, Feathers authentication.
- Database: MongoDB 8, native MongoDB driver, `@feathersjs/mongodb`.
- Authentication: JWT, local email/password auth, password hashing via Feathers local auth resolvers.
- Infrastructure: Docker, Docker Compose, Node Alpine images, mongo-express.

## Public API

The Sails gateway exposes the routes below. In local frontend development, Vite proxies browser requests from `/api/*` to `http://sails-api:8080` and strips the `/api` prefix, so frontend calls such as `/api/auth` and `/api/logs` reach gateway routes `/auth` and `/logs`.

| Method | Path | Target service | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` (also `/api/health`) | Sails API | Liveness of the gateway itself |
| `GET` | `/ready` (also `/api/ready`) | Sails API | Readiness: `200` only while both Feathers services answer `/ready` |
| `POST` | `/auth` | users service | Local auth; returns an access token valid for 1 day. Rate limited |
| `POST` | `/users` | users service | Registers a regular user (email + password, min. 8 characters). Rate limited |
| `GET` | `/logs` | logs service | Lists logs (users: own logs only, admins: all); requires JWT |
| `POST` | `/logs` | logs service | Creates a log entry (`system` type: admins only); requires JWT |

## Data Models

### User

- `_id`: MongoDB ObjectId
- `email`: string, valid email address, unique and stored lowercase
- `password`: string (8-128 characters), hashed before persistence and removed from external responses
- `role`: `admin` or `user`. Set by the server: registration always creates `user`; the account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` is created or promoted to `admin` when the users service starts

### Log

- `_id`: MongoDB ObjectId
- `text`: string
- `level`: integer from `0` to `7`, matching syslog severity range
- `timeStamp`: optional ISO 8601 date-time, event time reported by the client; the server fills in the receive time when it is missing
- `type`: `system` (admins only) or `user`
- `userId`: string, set by the server from the access token
- `expiresAt`: date-time, set by the server when `LOG_RETENTION_DAYS` is configured; a MongoDB TTL index deletes the log at that time
- `createdAt`: ISO 8601 date-time, set by the server when the log is received

### Authorization

The users service puts the user's `role` into the access token, and the logs service authorizes on it. Admins can read all logs and write `system` logs. Regular users only read their own logs and can only write `user` logs. Role changes take effect at the next login, because tokens carry the role for up to 1 day.

## Environment

Create `.env` from `.env.example` and fill in every empty value. Generate each secret with:

```bash
openssl rand -hex 32
```

| Variable | Purpose |
| --- | --- |
| `APP_JWT_SECRET` | JWT signing secret shared by both Feathers services (min. 32 characters) |
| `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` | MongoDB root account, used only by mongo-express |
| `MONGO_APP_DATABASE` / `MONGO_APP_USERNAME` / `MONGO_APP_PASSWORD` | Least-privileged account the services use (`readWrite` on the app database) |
| `MONGO_EXPRESS_USERNAME` / `MONGO_EXPRESS_PASSWORD` | Basic auth for mongo-express |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional first admin account, created or promoted on users-service startup |
| `FEATHERS_LOGS_URL` / `FEATHERS_USERS_URL` | Internal service URLs used by the gateway |

The same JWT secret must be shared by both Feathers services so tokens issued by the users service can authorize requests against the logs service. The services refuse to start without a secret of at least 32 characters, and access tokens expire after 1 day.

Docker Compose builds the services' MongoDB connection string from the `MONGO_APP_*` values. The application user is created by `mongo/init/01-create-app-user.js` on the first start of an empty `mongo-data` volume. If you change the MongoDB credentials later, recreate the volume with `docker compose down -v` (this deletes the database).

## Running With Docker Compose

```bash
docker compose up --build
```

After startup:

- Frontend: `http://localhost:5173`
- API gateway: `http://localhost:8080`

To also start Mongo Express (`http://localhost:8088`, basic auth from `.env`):

```bash
docker compose --profile debug up --build
```

## Running In Production Mode

`docker-compose.prod.yaml` builds production images: no bind mounts, no dev servers, `NODE_ENV=production`, and only the frontend is published. The React app is built and served by nginx, which proxies `/api` to the gateway, so the API is same-origin and the gateway itself is not exposed.

```bash
docker compose -f docker-compose.prod.yaml up --build -d
```

The app is then on `http://localhost`. MongoDB is not published at all in this mode.

## Health Checks

Every service exposes `GET /health` (process is up) and `GET /ready` (dependencies answer). Compose uses them so that services wait for a healthy database, and the gateway waits for healthy services.

## Log Retention

`LOG_RETENTION_DAYS` (default `0` = keep forever) makes the logs service stamp `expiresAt` on new logs. A TTL index then removes them. Logs written before the setting was enabled are kept.

## Development Commands

Each service can also be run directly from its own directory:

```bash
npm install
npm run dev
```

Service-specific commands and configuration details are documented in each service README:

- `react-frontend/README.md`
- `sails-api/README.md`
- `feathers-users-service/readme.md`
- `feathers-logs-service/readme.md`

## Testing

Every backend service has a test suite; `npm test` runs it.

```bash
cd feathers-users-service && npm test   # registration, duplicates, roles, login
cd feathers-logs-service && npm test    # ownership, admin-only system logs, validation
cd sails-api && npm test                # lint + redaction, rate limiting, proxy error mapping
```

The Feathers suites start a real in-memory MongoDB (`mongodb-memory-server`), so no database needs to be running. The Sails suite uses the built-in `node --test` runner.

The React frontend has no test suite; `npm run lint` and `npm run build` cover it in CI.

GitHub Actions (`.github/workflows/ci.yml`) runs all of the above on every pull request, plus `npm audit` (fails on high/critical advisories in runtime dependencies) and validation of both compose files.
