# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY src ./src
COPY index.html ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install a simple HTTP server
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
