# Docker Compose Configuration

## Overview

This document provides Docker Compose configuration for running entire Hookah Wishlist System locally. All services run in isolated Docker containers with PostgreSQL, eliminating the need for local database installation. The project uses **pnpm workspaces** for monorepo management with centralized Prisma configuration.

## Prerequisites

- Docker 20.10+ or Docker Desktop
- Docker Compose 2.20+
- Git repository cloned locally
- pnpm 9+ (for workspace management)

## pnpm Workspaces Configuration

The project uses pnpm workspaces to manage multiple packages:

```yaml
# pnpm-workspace.yaml
packages:
  - 'api'
  - 'scraper'
  - 'bot'
  - 'mini-app'
```

### Benefits of pnpm Workspaces

1. **Shared Dependencies**: Common packages installed once at root
2. **Faster Installs**: Hard links reduce disk usage and install time
3. **Consistent Versions**: All workspaces use same dependency versions
4. **Simplified CI/CD**: Single install command for all packages
5. **Local Linking**: Workspaces can import each other without publishing
6. **Type Safety**: TypeScript cross-references work across workspaces

## Centralized Prisma Configuration

Prisma configuration is centralized at project root:

```
project-root/
├── prisma/
│   ├── schema.prisma          # Shared database schema
│   └── migrations/            # Shared migration files
├── prisma.config.ts           # Prisma configuration
├── api/
│   └── package.json           # Imports @prisma/client
├── scraper/
│   └── package.json           # Imports @prisma/client
├── bot/
│   └── package.json
├── mini-app/
│   └── package.json
└── pnpm-workspace.yaml         # Workspace configuration
```

Both API and scraper import Prisma Client from the same installation, ensuring schema consistency.

## Docker Compose File

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hookah-postgres
    environment:
      POSTGRES_USER: hookah_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: hookah_wishlist
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hookah_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hookah-network

  api:
    build: ./api
    container_name: hookah-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hookah_user:${POSTGRES_PASSWORD}@postgres:5432/hookah_wishlist
      PORT: 3000
      NODE_ENV: development
      JWT_SECRET: ${JWT_SECRET}
      BOT_API_KEY: ${BOT_API_KEY}
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - hookah-network

  bot:
    build: ./bot
    container_name: hookah-bot
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      API_URL: http://api:3000/api/v1
      API_KEY: ${BOT_API_KEY}
      NODE_ENV: development
      LOG_LEVEL: info
    depends_on:
      - api
    networks:
      - hookah-network

  scraper:
    build: ./scraper
    container_name: hookah-scraper
    environment:
      DATABASE_URL: postgresql://hookah_user:${POSTGRES_PASSWORD}@postgres:5432/hookah_wishlist
      SCRAPER_SCHEDULE: "0 2 * * *"
      SCRAPER_TIMEOUT: 60000
      SCRAPER_MAX_RETRIES: 3
      SCRAPER_DELAY_BRAND: 2000
      SCRAPER_DELAY_TOBACCO: 1000
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hookah-network

  mini-app:
    build: ./mini-app
    container_name: hookah-mini-app
    ports:
      - "8080:80"
    environment:
      VITE_API_URL: /api
      VITE_TELEGRAM_BOT_USERNAME: ${TELEGRAM_BOT_USERNAME}
    depends_on:
      api:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - hookah-network

volumes:
  postgres_data:
    driver: local

networks:
  hookah-network:
    driver: bridge
```

## Environment Variables

Create `.env` file in project root:

```env
# PostgreSQL
POSTGRES_PASSWORD=your_secure_postgres_password_here

# API
JWT_SECRET=your_secure_jwt_secret_here
BOT_API_KEY=your_secure_bot_api_key_here

# Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Mini App
TELEGRAM_BOT_USERNAME=your_bot_username
```

## Dockerfiles

### API Dockerfile

Create `api/Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

### Bot Dockerfile

Create `bot/Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Start application
CMD ["node", "dist/index.js"]
```

### Scraper Dockerfile

Create `scraper/Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Start application
CMD ["node", "dist/index.js"]
```

### Mini App Dockerfile

Create `mini-app/Dockerfile`:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Usage

### Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Start Specific Service

```bash
# Start only API and PostgreSQL
docker-compose up postgres api

# Start only bot
docker-compose up bot

# Start only scraper
docker-compose up scraper
```

### View Service Status

```bash
# Check status of all services
docker-compose ps

# Check logs for specific service
docker-compose logs api
docker-compose logs bot
docker-compose logs scraper
docker-compose logs postgres
```

### Execute Commands in Containers

```bash
# Run database migrations
docker-compose exec api pnpm prisma migrate deploy

# Access PostgreSQL shell
docker-compose exec postgres psql -U hookah_user -d hookah_wishlist

# Access API shell
docker-compose exec api sh

# Access bot shell
docker-compose exec bot sh

# Access scraper shell
docker-compose exec scraper sh
```

### Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This will install dependencies for all workspaces:
# - api
# - bot
# - scraper
# - mini-app
# Including shared dependencies like @prisma/client
```

### Generate Prisma Client

```bash
# Generate Prisma Client for all workspaces
pnpm prisma generate

# This generates the client once at root level
# Both api and scraper can import from the same installation
```

## Database Management

### Connect to PostgreSQL

```bash
# Connect via docker-compose
docker-compose exec postgres psql -U hookah_user -d hookah_wishlist

# Or connect from host
psql -h localhost -p 5432 -U hookah_user -d hookah_wishlist
```

### Run Migrations

```bash
# Create migration
pnpm prisma migrate dev --name add_scraper_fields

# Apply migrations
docker-compose exec api pnpm prisma migrate deploy

# Or run from root
pnpm prisma migrate deploy
```

### Backup Database

```bash
# Backup via docker-compose
docker-compose exec -T postgres pg_dump -U hookah_user hookah_wishlist > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Restore via docker-compose
docker-compose exec -T postgres psql -U hookah_user hookah_wishlist < backup.sql
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart <service-name>

# Rebuild and start
docker-compose up -d --build <service-name>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U hookah_user
```

### Port Conflicts

If port 3000, 5432, or 8080 are already in use:

```bash
# Modify docker-compose.yml to use different ports
# Example: Change "3000:3000" to "3001:3000"
```

### pnpm Workspace Issues

If workspace dependencies are not resolving:

```bash
# Ensure pnpm-workspace.yaml is in project root
ls -la pnpm-workspace.yaml

# Ensure all workspaces are listed
cat pnpm-workspace.yaml

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Verify package.json files reference workspace names correctly
cat api/package.json
cat bot/package.json
cat scraper/package.json
cat mini-app/package.json
```

### Prisma Client Issues

If Prisma Client is not found:

```bash
# Ensure Prisma is installed at root level
pnpm list | grep prisma

# Generate Prisma Client
pnpm prisma generate

# Verify schema path
ls -la prisma/schema.prisma

# Verify prisma.config.ts exists
ls -la prisma.config.ts
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **API**: HTTP GET request to `/health` endpoint
- **Bot**: No health check (long-running process)
- **Scraper**: No health check (scheduled job)
- **Mini App**: HTTP GET request to `/` endpoint

Coolify automatically restarts unhealthy services.

## Development Workflow

### Typical Development Cycle

```bash
# 1. Install dependencies
pnpm install

# 2. Start services
docker-compose up -d

# 3. Make code changes
# Edit files in api/, bot/, scraper/, mini-app/

# 4. Rebuild affected service
docker-compose up -d --build <service-name>

# 5. Run database migrations (if needed)
docker-compose exec api pnpm prisma migrate deploy

# 6. View logs
docker-compose logs -f <service-name>
```

### Hot Reloading

For development with hot reloading, you can run services individually:

```bash
# Start PostgreSQL and API
docker-compose up postgres api

# In another terminal, run bot locally
cd bot
pnpm install
pnpm run dev

# In another terminal, run mini-app locally
cd mini-app
pnpm install
pnpm run dev
```

## Production Considerations

When deploying to Coolify:

1. **Remove development volumes** - Don't mount source directories
2. **Use production builds** - `pnpm build` instead of development mode
3. **Set NODE_ENV=production** - In environment variables
4. **Optimize Docker images** - Multi-stage builds for smaller images
5. **Configure resource limits** - Set memory and CPU limits in Coolify
6. **Include Prisma generation** - Add `pnpm prisma generate` to build command
7. **Run migrations** - Add `pnpm prisma migrate deploy` to build command

## Build Commands

### Development

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Build all workspaces
pnpm build

# Or build specific workspace
pnpm --filter api build
pnpm --filter bot build
pnpm --filter scraper build
pnpm --filter mini-app build
```

### Production (Coolify)

The build command should include all necessary steps:

```bash
# API build command
pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build

# Bot build command
pnpm install && pnpm build

# Scraper build command
pnpm install && pnpm build

# Mini App build command
pnpm install && pnpm build
```

## Summary

This Docker Compose configuration provides:

✅ **All services containerized** - No local PostgreSQL installation needed
✅ **pnpm workspaces** - Efficient monorepo management with shared dependencies
✅ **Centralized Prisma** - Shared schema and migrations across API and scraper
✅ **Health checks** - Automatic service monitoring
✅ **Environment variables** - Secure secret management
✅ **Easy startup** - Single command to start all services
✅ **Development workflow** - Simple rebuild and restart cycle
✅ **Database management** - Easy backup and restore
✅ **Production ready** - Configuration compatible with Coolify deployment
✅ **Shared dependencies** - Reduced disk usage and faster installs
✅ **Cross-workspace imports** - Workspaces can import each other
✅ **Type safety** - TypeScript cross-references across workspaces
✅ **Efficient builds** - pnpm's hard links for faster builds
✅ **Migration workflow** - Prisma migrations managed centrally
✅ **Multi-stage builds** - Optimized Docker images for production

The Docker Compose configuration, combined with pnpm workspaces and centralized Prisma, provides a streamlined development and deployment experience with efficient dependency management and consistent database schema across all services.
