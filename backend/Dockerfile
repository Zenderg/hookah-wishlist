# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create data and logs directories with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R node:node /app/data /app/logs

# Install production dependencies as root first
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]
