# One image for the whole app: Express serves the API and the built React client.

# 1. Build the React client
FROM node:22-slim AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2. Production server
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client /app/client/dist /app/client/dist

# Cloud Run sets PORT (8080 by default)
ENV PORT=8080
EXPOSE 8080
USER node

# Apply pending migrations, then start the API
CMD ["sh", "-c", "node scripts/migrate.js && node src/server.js"]
