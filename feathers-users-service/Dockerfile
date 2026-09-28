FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Dependencies first: this layer is cached until package files change
COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

# Never run the service as root
USER node

# Exec form so the process receives SIGTERM and can shut down gracefully
CMD ["npm", "start"]
