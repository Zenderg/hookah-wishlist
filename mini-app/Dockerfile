# ============================================
# Stage 1: Build the React app with Vite
# ============================================
FROM node:22.12-alpine AS builder

# Metadata labels for better image management
LABEL maintainer="hookah-wishlist team"
LABEL description="Build stage for hookah-wishlist mini-app (React/Vite)"
LABEL version="1.0.0"
LABEL stage="builder"

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with BuildKit cache mount support
# --mount=type=cache,target=/root/.npm significantly speeds up builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:1.27-alpine AS production

# Metadata labels for production image
LABEL maintainer="hookah-wishlist team"
LABEL description="Production nginx image for hookah-wishlist mini-app"
LABEL version="1.0.0"
LABEL stage="production"

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security
# nginx:alpine runs as nginx user by default, but we ensure proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /run

# Copy built assets from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

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
