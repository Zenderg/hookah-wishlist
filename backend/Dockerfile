# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app/data

# Switch to non-root user
USER node

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY .env.example .env
EXPOSE 3000
CMD ["node", "dist/index.js"]
