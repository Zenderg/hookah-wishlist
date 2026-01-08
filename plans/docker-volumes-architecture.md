# Docker Volumes Architecture for Persistent SQLite Database Storage

## Executive Summary

This document provides a comprehensive architecture plan for implementing Docker volumes to ensure persistent SQLite database storage in the hookah-wishlist project. The architecture addresses data persistence across container restarts and deployments while maintaining compatibility with the existing SQLite implementation with WAL mode.

---

## 1. Current State Analysis

### 1.1 Existing Configuration

**docker-compose.yml** (Current State):
```yaml
services:
  backend:
    volumes:
      - ./data:/app/data  # Bind mount (relative path)
    environment:
      - STORAGE_PATH=/app/data
      - STORAGE_TYPE=file  # Incorrect - should be sqlite

volumes:
  data:  # Named volume declared but NOT used
```

### 1.2 Issues Identified

1. **Named Volume Not Used**: A named volume `data:` is declared but the backend service uses a bind mount `./data:/app/data` instead
2. **Incorrect Storage Type**: `STORAGE_TYPE=file` should be `sqlite` to match the SQLite storage implementation
3. **Missing Database Path**: No explicit `DATABASE_PATH` environment variable set
4. **No Volume Permissions**: No user/group configuration for proper file ownership
5. **No Backup Strategy**: No backup volume or backup scripts configured
6. **WAL File Considerations**: WAL mode creates additional files (`wishlist.db-wal`, `wishlist.db-shm`) that must be in the same volume

### 1.3 SQLite Implementation Requirements

From [`backend/src/storage/sqlite.storage.ts`](backend/src/storage/sqlite.storage.ts):
- Database path configurable via `DATABASE_PATH` environment variable
- Automatic directory creation if it doesn't exist
- WAL mode enabled by default
- Creates additional files:
  - `wishlist.db` - Main database file
  - `wishlist.db-wal` - Write-Ahead Log file
  - `wishlist.db-shm` - Shared memory file

---

## 2. Recommended Volumes Architecture

### 2.1 Architecture Decision: Named Volumes vs Bind Mounts

**Recommendation: Use Named Volumes for Production**

**Justification:**

| Aspect | Named Volumes | Bind Mounts |
|--------|--------------|-------------|
| **Portability** | ✅ Host-independent | ❌ Host-dependent |
| **Backup** | ✅ Easy with Docker commands | ❌ Requires host access |
| **Permissions** | ✅ Managed by Docker | ❌ Manual configuration needed |
| **Performance** | ✅ Optimized by Docker | ⚠️ Depends on host FS |
| **Development** | ⚠️ Less convenient | ✅ Direct file access |
| **Production** | ✅ Best practice | ❌ Not recommended |

**Hybrid Approach:**
- **Production**: Named volumes (portable, managed)
- **Development**: Bind mounts (direct access, debugging)

### 2.2 Volume Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Named Volume: hookah-wishlist-data      │   │
│  │  (Managed by Docker, persistent storage)        │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  /app/data/                                     │   │
│  │    ├── wishlist.db           (SQLite database)  │   │
│  │    ├── wishlist.db-wal       (WAL log file)    │   │
│  │    └── wishlist.db-shm       (Shared memory)    │   │
│  └─────────────────────────────────────────────────┘   │
│                         ▲                               │
│                         │ Mount                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Backend Container                              │   │
│  │  WORKDIR: /app                                  │   │
│  │  Mount Point: /app/data → hookah-wishlist-data  │   │
│  │  DATABASE_PATH: /app/data/wishlist.db           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Volume Naming Conventions

**Named Volumes:**
- `hookah-wishlist-data` - Primary database storage
- `hookah-wishlist-backups` - Backup storage (optional)

**Mount Points:**
- `/app/data` - Database files in backend container

**Environment Variables:**
- `DATABASE_PATH=/app/data/wishlist.db` - Explicit database path
- `STORAGE_TYPE=sqlite` - Storage type
- `STORAGE_PATH=/app/data` - Storage directory path

---

## 3. Detailed Implementation Plan

### 3.1 Production Configuration (docker-compose.yml)

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hookah-wishlist-backend
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_WEBHOOK_URL=${TELEGRAM_WEBHOOK_URL}
      - HOOKEH_DB_API_URL=${HOOKEH_DB_API_URL:-https://hdb.coolify.dknas.org}
      - API_RATE_LIMIT=${API_RATE_LIMIT:-100}
      - STORAGE_TYPE=sqlite  # Fixed: was 'file'
      - DATABASE_PATH=/app/data/wishlist.db  # Added: explicit path
      - STORAGE_PATH=/app/data
      - MINI_APP_URL=${MINI_APP_URL}
    volumes:
      - hookah-wishlist-data:/app/data  # Named volume instead of bind mount
    restart: unless-stopped
    networks:
      - hookah-network
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./mini-app
      dockerfile: Dockerfile
    container_name: hookah-wishlist-frontend
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - hookah-network
    depends_on:
      - backend
    expose:
      - "5173"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5173/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: hookah-wishlist-nginx
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
    networks:
      - hookah-network
    depends_on:
      - backend:
        condition: service_healthy
      - frontend:
        condition: service_healthy

  # Backup service (optional, for automated backups)
  backup:
    image: alpine:latest
    container_name: hookah-wishlist-backup
    volumes:
      - hookah-wishlist-data:/data:ro
      - ./backups:/backups
    environment:
      - BACKUP_SCHEDULE=${BACKUP_SCHEDULE:-0 2 * * *}
      - BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
    command: >
      sh -c "
        apk add --no-cache dcron &&
        echo '${BACKUP_SCHEDULE} /backup.sh' | crontab - &&
        echo '#!/bin/sh' > /backup.sh &&
        echo 'date' >> /backup.log &&
        echo 'tar czf /backups/wishlist-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .' >> /backup.sh &&
        echo 'find /backups -name \"wishlist-backup-*.tar.gz\" -mtime +${BACKUP_RETENTION_DAYS} -delete' >> /backup.sh &&
        chmod +x /backup.sh &&
        crond -f -l 2
      "
    restart: unless-stopped
    networks:
      - hookah-network
    depends_on:
      - backend

networks:
  hookah-network:
    driver: bridge

volumes:
  hookah-wishlist-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/docker/volumes/hookah-wishlist-data/_data
  hookah-wishlist-backups:
    driver: local
```

### 3.2 Development Configuration (docker-compose.dev.yml)

```yaml
services:
  backend:
    volumes:
      - ./data:/app/data  # Bind mount for development
      - ./backend/src:/app/src  # Hot reload
    environment:
      - NODE_ENV=development
      - STORAGE_TYPE=sqlite
      - DATABASE_PATH=/app/data/wishlist.db
      - STORAGE_PATH=/app/data
    # Remove healthcheck for faster startup
    healthcheck: disable

  # Remove backup service in development
  backup:
    profiles:
      - backup  # Only start with --profile backup
```

### 3.3 Environment Variables (.env.example)

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook

# Server Configuration
PORT=3000
NODE_ENV=production

# hookah-db API Configuration
HOOKEH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKEH_DB_API_KEY=your_hookah_db_api_key_here
API_RATE_LIMIT=100

# Storage Configuration
STORAGE_TYPE=sqlite
DATABASE_PATH=/app/data/wishlist.db
STORAGE_PATH=/app/data

# Mini-App Configuration
MINI_APP_URL=https://your-domain.com/mini-app

# Backup Configuration (Optional)
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=7
```

### 3.4 Backend Dockerfile Updates

**No changes required** - The current Dockerfile is correct. Volumes should be managed by docker-compose, not the Dockerfile.

However, ensure the Dockerfile creates the data directory:

```dockerfile
# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app/data

USER node

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY .env.example .env

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 4. Backup and Restore Procedures

### 4.1 Manual Backup

**Backup Database Volume:**
```bash
# Create backup directory
mkdir -p ./backups

# Backup using Docker run
docker run --rm \
  -v hookah-wishlist-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine:latest \
  tar czf /backup/wishlist-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

**Backup Specific Database File:**
```bash
# Copy database file directly (if using bind mount)
cp ./data/wishlist.db ./data/wishlist.db.backup

# Include WAL files for consistency
cp ./data/wishlist.db-wal ./data/wishlist.db-wal.backup
cp ./data/wishlist.db-shm ./data/wishlist.db-shm.backup
```

### 4.2 Automated Backup

**Using Docker Compose Backup Service:**
```bash
# Start backup service
docker-compose --profile backup up -d backup

# View backup logs
docker-compose logs -f backup
```

**Using Cron Job on Host:**
```bash
# Add to crontab
0 2 * * * cd /path/to/hookah-wishlist && docker-compose exec -T backend sh -c 'tar czf - /app/data' > ./backups/wishlist-backup-$(date +\%Y\%m\%d).tar.gz
```

### 4.3 Restore Procedures

**Restore from Volume Backup:**
```bash
# Stop services
docker-compose down

# Remove old volume (WARNING: deletes data)
docker volume rm hookah-wishlist-data

# Create new volume
docker volume create hookah-wishlist-data

# Restore from backup
docker run --rm \
  -v hookah-wishlist-data:/data \
  -v $(pwd)/backups:/backup:ro \
  alpine:latest \
  tar xzf /backup/wishlist-backup-YYYYMMDD-HHMMSS.tar.gz -C /data

# Start services
docker-compose up -d
```

**Restore from Database File Backup:**
```bash
# Stop backend service
docker-compose stop backend

# Copy backup files to data directory
cp ./data/wishlist.db.backup ./data/wishlist.db
cp ./data/wishlist.db-wal.backup ./data/wishlist.db-wal
cp ./data/wishlist.db-shm.backup ./data/wishlist.db-shm

# Start backend service
docker-compose start backend
```

### 4.4 Backup Verification

**Verify Backup Integrity:**
```bash
# Extract and verify backup
docker run --rm \
  -v $(pwd)/backups:/backup:ro \
  alpine:latest \
  sh -c "cd /tmp && tar xzf /backup/wishlist-backup-YYYYMMDD-HHMMSS.tar.gz && ls -la"

# Check database integrity
docker run --rm \
  -v hookah-wishlist-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine:latest \
  sh -c "apk add --no-cache sqlite && sqlite3 /data/wishlist.db 'PRAGMA integrity_check;'"
```

---

## 5. Development vs Production Strategies

### 5.1 Development Strategy

**Configuration:**
- Use bind mounts for direct file access
- Enable hot reload for faster development
- Disable healthchecks for faster startup
- Use development environment variables

**docker-compose.dev.yml:**
```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./data:/app/data  # Bind mount for direct access
      - ./backend/src:/app/src  # Hot reload
    environment:
      - NODE_ENV=development
      - STORAGE_TYPE=sqlite
      - DATABASE_PATH=/app/data/wishlist.db
    command: npm run dev  # Override for development

  # No backup service in development
```

**Usage:**
```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use npm script
npm run dev:docker
```

### 5.2 Production Strategy

**Configuration:**
- Use named volumes for portability
- Enable healthchecks for reliability
- Use production environment variables
- Enable automated backups
- Enable restart policies

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  backend:
    environment:
      - NODE_ENV=production
      - STORAGE_TYPE=sqlite
      - DATABASE_PATH=/app/data/wishlist.db
    restart: always
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  backup:
    profiles:
      - production  # Only start with --profile production
```

**Usage:**
```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d

# Or use npm script
npm run start:prod
```

### 5.3 Migration Strategy

**From Bind Mount to Named Volume:**

1. **Create backup of existing data:**
   ```bash
   docker run --rm \
     -v $(pwd)/data:/data:ro \
     -v $(pwd)/backups:/backup \
     alpine:latest \
     tar czf /backup/migration-backup-$(date +%Y%m%d).tar.gz -C /data .
   ```

2. **Stop services:**
   ```bash
   docker-compose down
   ```

3. **Create named volume:**
   ```bash
   docker volume create hookah-wishlist-data
   ```

4. **Restore data to named volume:**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data \
     -v $(pwd)/backups:/backup:ro \
     alpine:latest \
     tar xzf /backup/migration-backup-YYYYMMDD.tar.gz -C /data
   ```

5. **Update docker-compose.yml** to use named volume (as shown in section 3.1)

6. **Start services:**
   ```bash
   docker-compose up -d
   ```

7. **Verify data integrity:**
   ```bash
   docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); console.log('Database stats:', wishlistStorage.getStats());"
   ```

---

## 6. Volume Permissions and Ownership

### 6.1 Permission Strategy

**Issue:** Docker volumes may have incorrect permissions when created.

**Solution:** Configure proper permissions in Dockerfile and docker-compose.

### 6.2 Dockerfile Configuration

```dockerfile
# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app/data

# Switch to non-root user
USER node

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY .env.example .env

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 6.3 docker-compose Configuration

```yaml
services:
  backend:
    user: "${UID:-1000}:${GID:-1000}"  # Use host user ID
    volumes:
      - hookah-wishlist-data:/app/data
    # Or use init container to fix permissions
    init: true
```

### 6.4 Permission Fix Script

**scripts/fix-permissions.sh:**
```bash
#!/bin/bash

# Fix volume permissions
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  sh -c "chown -R 1000:1000 /data"

echo "Permissions fixed for hookah-wishlist-data volume"
```

**Usage:**
```bash
chmod +x scripts/fix-permissions.sh
./scripts/fix-permissions.sh
```

---

## 7. Monitoring and Maintenance

### 7.1 Volume Monitoring

**Check Volume Usage:**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect hookah-wishlist-data

# Check volume size
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  du -sh /data
```

### 7.2 Database Maintenance

**Perform WAL Checkpoint:**
```bash
# Connect to backend container
docker-compose exec backend sh

# Run checkpoint
node -e "const { wishlistStorage } = require('./dist/storage'); wishlistStorage.checkpoint();"
```

**Database Vacuum:**
```bash
# Connect to backend container
docker-compose exec backend sh

# Vacuum database
node -e "const Database = require('better-sqlite3'); const db = new Database('/app/data/wishlist.db'); db.exec('VACUUM'); db.close();"
```

### 7.3 Health Checks

**Add Health Check Endpoint to Backend:**

In [`backend/src/api/server.ts`](backend/src/api/server.ts):
```typescript
app.get('/health', (req, res) => {
  try {
    // Check database connection
    const stats = wishlistStorage.getStats();
    res.status(200).json({
      status: 'healthy',
      database: {
        connected: true,
        records: stats.count,
        walMode: stats.walMode
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## 8. Security Considerations

### 8.1 Volume Security

**Best Practices:**
1. Use read-only mounts where possible (e.g., nginx config)
2. Restrict volume access to necessary services only
3. Use non-root users in containers
4. Set proper file permissions (600 or 640 for database files)
5. Encrypt volumes at rest (for production)

### 8.2 Backup Security

**Secure Backup Storage:**
```bash
# Set restrictive permissions on backup directory
chmod 700 ./backups

# Encrypt backups (optional)
gpg --encrypt --recipient your-email@example.com ./backups/wishlist-backup.tar.gz
```

### 8.3 Environment Variables

**Never commit sensitive data:**
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
backups/
data/
```

---

## 9. Troubleshooting

### 9.1 Common Issues

**Issue: Database not persisting**
- **Cause**: Using tmpfs or ephemeral storage
- **Solution**: Ensure named volume is properly configured

**Issue: Permission denied accessing database**
- **Cause**: Incorrect volume permissions
- **Solution**: Run permission fix script or adjust user mapping

**Issue: WAL files growing too large**
- **Cause**: WAL checkpoint not running
- **Solution**: Manually run checkpoint or adjust WAL settings

**Issue: Database locked**
- **Cause**: Multiple processes accessing database without proper locking
- **Solution**: Ensure only one backend instance is running

### 9.2 Diagnostic Commands

**Check Database Connection:**
```bash
docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); console.log(wishlistStorage.getStats());"
```

**Check Volume Contents:**
```bash
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  ls -la /data
```

**Check Container Logs:**
```bash
docker-compose logs backend
```

**Check Docker Events:**
```bash
docker events --filter 'volume=hookah-wishlist-data'
```

---

## 10. Implementation Checklist

### 10.1 Pre-Implementation

- [ ] Backup existing data (if any)
- [ ] Review current docker-compose.yml configuration
- [ ] Verify SQLite storage implementation
- [ ] Test database initialization locally

### 10.2 Implementation Steps

- [ ] Update docker-compose.yml with named volume configuration
- [ ] Add DATABASE_PATH environment variable
- [ ] Fix STORAGE_TYPE to 'sqlite'
- [ ] Add healthchecks to backend and frontend
- [ ] Create docker-compose.dev.yml for development
- [ ] Create docker-compose.prod.yml for production
- [ ] Update .env.example with new variables
- [ ] Update backend Dockerfile with proper permissions
- [ ] Create backup service configuration
- [ ] Create backup and restore scripts
- [ ] Create permission fix script

### 10.3 Post-Implementation

- [ ] Test development environment with bind mounts
- [ ] Test production environment with named volumes
- [ ] Verify data persistence across container restarts
- [ ] Test backup and restore procedures
- [ ] Verify healthchecks are working
- [ ] Test migration from bind mount to named volume
- [ ] Update documentation (README.md)
- [ ] Update memory bank files

### 10.4 Monitoring Setup

- [ ] Set up volume monitoring
- [ ] Configure backup schedule
- [ ] Set up alerts for volume issues
- [ ] Document maintenance procedures

---

## 11. Summary

This architecture plan provides a comprehensive solution for persistent SQLite database storage using Docker volumes. The key recommendations are:

1. **Use named volumes** for production (portable, managed by Docker)
2. **Use bind mounts** for development (direct access, debugging)
3. **Explicitly set** `DATABASE_PATH=/app/data/wishlist.db` and `STORAGE_TYPE=sqlite`
4. **Implement automated backups** with retention policy
5. **Add healthchecks** for reliability
6. **Configure proper permissions** for volume access
7. **Provide migration strategy** from bind mounts to named volumes
8. **Document backup and restore procedures** for disaster recovery

The implementation ensures data persistence across container restarts and deployments while maintaining compatibility with the existing SQLite implementation with WAL mode.

---

## Appendix A: Complete docker-compose.yml

See section 3.1 for the complete production configuration.

## Appendix B: Scripts

See sections 4.1-4.4 and 6.4 for backup, restore, and permission fix scripts.

## Appendix C: Environment Variables

See section 3.3 for the complete .env.example file.
