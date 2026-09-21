FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite server
CMD ["npm", "run", "dev"]
