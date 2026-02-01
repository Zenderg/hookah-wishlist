# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build-time arguments for environment variables
ARG API_URL=https://your-domain.com/api

# Build application with production configuration and define values
RUN npm run build -- --configuration production --define "apiUrl='${API_URL}'"

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
# Note: New Angular application builder outputs to browser/ subdirectory
COPY --from=builder /app/dist/hookah-wishlist-frontend/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
