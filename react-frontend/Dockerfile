# Shared dependency layer; owned by `node` so both the dev server and the build can write caches
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci && chown -R node:node /app

# Development image: Vite dev server with HMR (used by docker-compose.yaml)
FROM deps AS dev
COPY --chown=node:node . .
USER node
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Build stage for the production bundle
FROM deps AS build
COPY --chown=node:node . .
USER node
RUN npm run build

# Production image: static files served by nginx, /api proxied to the gateway
FROM nginx:1.29-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
