# Logging Backend

Multi-service logging application built with a React dashboard, a Sails API gateway, two FeathersJS services, and MongoDB. The system separates authentication, log persistence, gateway routing, and the browser UI into independently containerized services.

## Architecture

- `react-frontend` - React/Vite SPA for login and log dashboard views.
- `sails-api` - Sails.js API gateway that exposes the public HTTP API and forwards requests to internal Feathers services.
- `feathers-users-service` - FeathersJS user and authentication service backed by MongoDB.
- `feathers-logs-service` - FeathersJS log ingestion/query service backed by MongoDB.
- `mongo` - MongoDB database used by both Feathers services.
- `mongo-express` - Optional database inspection UI.

## Service Topology

| Service | Container port | Host port | Purpose |
| --- | ---: | ---: | --- |
| `react-frontend` | `5173` | `5173` | Browser client and Vite dev server |
| `sails-api` | `8080` | `8080` | Public API gateway |
| `feathers-logs-service` | `8081` | internal | Logs service |
| `feathers-users-service` | `8082` | internal | Users/auth service |
| `mongo` | `27017` | `27017` | MongoDB |
| `mongo-express` | `8081` | `8088` | MongoDB admin UI |

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
| `GET` | `/api/health` | Sails API | Returns gateway health response on the gateway itself |
| `POST` | `/auth` | users service | Local auth; returns Feathers access token |
| `POST` | `/users` | users service | Creates a user |
| `GET` | `/logs` | logs service | Lists logs; requires JWT |
| `POST` | `/logs` | logs service | Creates a log entry; requires JWT |

## Data Models

### User

- `_id`: MongoDB ObjectId
- `email`: string
- `password`: string, hashed before persistence and removed from external responses

### Log

- `_id`: MongoDB ObjectId
- `text`: string
- `level`: integer from `0` to `7`, matching syslog severity range
- `timeStamp`: string
- `type`: `system` or `user`

## Environment

Create `.env` from `.env.example` and provide values for:

```dotenv
APP_JWT_SECRET=replace_with_shared_jwt_secret
MONGODB_URL=mongodb://mongo:27017/logging-backend
FEATHERS_LOGS_URL=http://feathers-logs-service:8081
FEATHERS_USERS_URL=http://feathers-users-service:8082
```

The same JWT secret must be shared by both Feathers services so tokens issued by the users service can authorize requests against the logs service.

## Running With Docker Compose

```bash
docker compose up --build
```

After startup:

- Frontend: `http://localhost:5173`
- API gateway: `http://localhost:8080`
- Mongo Express: `http://localhost:8088`

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

The Feathers services include Mocha tests for application startup, 404 behavior, and service registration:

```bash
cd feathers-users-service && npm test
cd feathers-logs-service && npm test
```

The Sails API currently has a placeholder `custom-tests` script. The React frontend currently exposes build and lint scripts, but no test suite is configured.
