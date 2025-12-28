# ============================================
# Stage 1: Builder stage
# ============================================
FROM node:22.12-alpine AS builder

# Metadata labels for builder stage
LABEL maintainer="hookah-wishlist team"
LABEL description="Builder stage for hookah-wishlist API (Node.js/TypeScript)"
LABEL version="1.0.0"
LABEL stage="builder"

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy package files first for better layer caching
COPY api/package*.json ./api/

# Install all dependencies (including devDependencies for build)
# Use BuildKit cache mount for faster subsequent builds
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Copy source code and configuration files
COPY api/src ./api/src
COPY api/tsconfig.json ./api/

# Copy shared Prisma schema, config and migrations from root directory
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts
COPY prisma/migrations ./prisma/migrations

# Generate Prisma client BEFORE building TypeScript
RUN pnpm prisma generate

# Build TypeScript application
RUN pnpm --filter hookah-wishlist-api run build

# ============================================
# Stage 2: Production stage
# ============================================
FROM node:22.12-alpine AS production

# Metadata labels for production image
LABEL maintainer="hookah-wishlist team"
LABEL description="Production image for hookah-wishlist API (Node.js/TypeScript)"
LABEL version="1.0.0"
LABEL stage="production"

# Install dumb-init, curl for healthcheck, and postgresql-client for pg_isready
RUN apk add --no-cache dumb-init curl postgresql-client

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy package files
COPY api/package*.json ./api/

# Install pnpm globally
RUN npm install -g pnpm

# Install only production dependencies
# Use BuildKit cache mount for faster subsequent builds
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/api/dist ./api/dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema, config and migrations from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy migration startup script
COPY api/scripts/migrate-and-start.sh ./api/scripts/migrate-and-start.sh
RUN chmod +x ./api/scripts/migrate-and-start.sh

# Switch to non-root user
USER nodejs

# Expose port 3000
EXPOSE 3000

# Healthcheck to ensure API is running properly
# Adjust the endpoint if your health endpoint is different
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application with migration script
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "/app/api/scripts/migrate-and-start.sh"]
