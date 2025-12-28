# ============================================
# Stage 1: Builder stage
# ============================================
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS builder

# Metadata labels for builder stage
LABEL maintainer="hookah-wishlist team"
LABEL description="Builder stage for hookah-wishlist web scraper (Node.js/TypeScript)"
LABEL version="1.0.0"
LABEL stage="builder"

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package files first for better layer caching
COPY scraper/package*.json ./scraper/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code and configuration files
COPY scraper/src ./scraper/src
COPY scraper/tsconfig.json ./scraper/

# Copy shared Prisma schema and config from root directory
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript application
RUN pnpm --filter hookah-wishlist-scraper run build

# ============================================
# Stage 2: Production stage
# ============================================
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS production

# Metadata labels for production image
LABEL maintainer="hookah-wishlist team"
LABEL description="Production image for hookah-wishlist web scraper (Node.js/TypeScript)"
LABEL version="1.0.0"
LABEL stage="production"

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy shared Prisma schema and config from root directory
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package files
COPY scraper/package*.json ./scraper/

# Install all dependencies (including devDependencies for testing)
RUN pnpm install --frozen-lockfile

# Generate Prisma client at runtime to ensure it matches the schema
RUN pnpm prisma generate

# Copy built application from builder stage
COPY --from=builder --chown=root:root /app/scraper/dist ./scraper/dist
COPY --from=builder --chown=root:root /app/scraper/src ./scraper/src

# Switch to non-root user
USER root

# Healthcheck for scraper (checking if process is running)
# Note: Scrapers may run periodically, so we check process health
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD pgrep -f "node.*start" || exit 1

# Start the application with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "/app/scraper/dist/index.js"]
