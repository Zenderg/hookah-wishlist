# ============================================
# Stage 1: Build React app with Vite
# ============================================
FROM node:22.12-alpine AS builder

# Metadata labels for better image management
LABEL maintainer="hookah-wishlist team"
LABEL description="Build stage for hookah-wishlist mini-app (React/Vite)"
LABEL version="1.0.0"
LABEL stage="builder"

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package files first for better layer caching
COPY mini-app/package*.json ./mini-app/

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies with BuildKit cache mount support
# --mount=type=cache,target=/root/.pnpm-store significantly speeds up builds
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Copy source code
COPY mini-app/src ./mini-app/src
COPY mini-app/index.html ./mini-app/
COPY mini-app/vite.config.ts ./mini-app/
COPY mini-app/tsconfig*.json ./mini-app/
COPY mini-app/postcss.config.js ./mini-app/
COPY mini-app/tailwind.config.js ./mini-app/

# Build application with environment variables
ARG VITE_API_URL
ARG NODE_ENV=production
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=${NODE_ENV}

RUN pnpm --filter mini-app run build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:1.27-alpine AS production

# Metadata labels for production image
LABEL maintainer="hookah-wishlist team"
LABEL description="Production nginx image for hookah-wishlist mini-app"
LABEL version="1.0.0"
LABEL stage="production"

# Install curl for healthcheck and dumb-init for proper signal handling
RUN apk add --no-cache curl dumb-init

# Create non-root user for security
# nginx:alpine runs as nginx user by default, but we ensure proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /run

# Copy built assets from builder stage
COPY --from=builder --chown=nginx:nginx /app/mini-app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY mini-app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Healthcheck to ensure nginx is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Switch to non-root user
USER nginx

# Start nginx with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
