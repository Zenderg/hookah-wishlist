# ============================================
# Stage 1: Builder stage
# ============================================
FROM node:22.12-alpine AS builder

# Metadata labels for builder stage
LABEL maintainer="hookah-wishlist team"
LABEL description="Builder stage for hookah-wishlist Telegram bot (Node.js/TypeScript)"
LABEL version="1.0.0"
LABEL stage="builder"

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use BuildKit cache mount for faster subsequent builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# ============================================
# Stage 2: Production stage
# ============================================
FROM node:22.12-alpine AS production

# Metadata labels for production image
LABEL maintainer="hookah-wishlist team"
LABEL description="Production image for hookah-wishlist Telegram bot (Node.js/TypeScript)"
LABEL version="1.0.0"
LABEL stage="production"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
# Use BuildKit cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Healthcheck for bot (checking if process is running)
# Note: Telegram bots may not have HTTP endpoints, so we check process health
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD pgrep -f "node.*start" || exit 1

# Start the application with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
