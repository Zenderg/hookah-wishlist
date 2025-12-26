# Docker Compose Configuration

## Overview

This document provides the Docker Compose configuration for running the entire Hookah Wishlist System locally. All services run in isolated Docker containers with PostgreSQL, eliminating the need for local database installation.

## Prerequisites

- Docker 20.10+ or Docker Desktop
- Docker Compose 2.20+
- Git repository cloned locally

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
      - postgres
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
      - postgres
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
```

## Dockerfiles

### API Dockerfile

Create `api/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Bot Dockerfile

Create `bot/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "dist/index.js"]
```

### Scraper Dockerfile

Create `scraper/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx playwright install --with-deps

CMD ["node", "dist/index.js"]
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
docker-compose exec api npx prisma migrate dev

# Access PostgreSQL shell
docker-compose exec postgres psql -U hookah_user -d hookah_wishlist

# Access API shell
docker-compose exec api sh

# Access bot shell
docker-compose exec bot sh

# Access scraper shell
docker-compose exec scraper sh
```

## Database Management

### Connect to PostgreSQL

```bash
# Connect via docker-compose
docker-compose exec postgres psql -U hookah_user -d hookah_wishlist

# Or connect from host
psql -h localhost -p 5432 -U hookah_user -d hookah_wishlist
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

If port 3000 or 5432 are already in use:

```bash
# Modify docker-compose.yml to use different ports
# Example: Change "3000:3000" to "3001:3000"
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **API**: HTTP GET request to `/health` endpoint
- **Bot**: No health check (long-running process)
- **Scraper**: No health check (scheduled job)

Coolify automatically restarts unhealthy services.

## Development Workflow

### Typical Development Cycle

```bash
# 1. Start services
docker-compose up -d

# 2. Make code changes
# Edit files in api/, bot/, scraper/

# 3. Rebuild affected service
docker-compose up -d --build <service-name>

# 4. Run database migrations (if needed)
docker-compose exec api npx prisma migrate dev

# 5. View logs
docker-compose logs -f <service-name>
```

### Hot Reloading

For development with hot reloading:

```bash
# Mount source directories as volumes in docker-compose.yml
# Example for API:
# volumes:
#   - ./api:/app
#   - /app/node_modules
```

## Production Considerations

When deploying to Coolify:

1. **Remove development volumes** - Don't mount source directories
2. **Use production builds** - `npm run build` instead of development mode
3. **Set NODE_ENV=production** - In environment variables
4. **Optimize Docker images** - Multi-stage builds for smaller images
5. **Configure resource limits** - Set memory and CPU limits in Coolify

## Summary

This Docker Compose configuration provides:

✅ **All services containerized** - No local PostgreSQL installation needed
✅ **Health checks** - Automatic service monitoring
✅ **Environment variables** - Secure secret management
✅ **Easy startup** - Single command to start all services
✅ **Development workflow** - Simple rebuild and restart cycle
✅ **Database management** - Easy backup and restore
✅ **Production ready** - Configuration compatible with Coolify deployment
