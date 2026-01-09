# Docker Volumes Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Volume Configuration](#volume-configuration)
4. [Development vs Production](#development-vs-production)
5. [Volume Lifecycle Management](#volume-lifecycle-management)
6. [Common Commands Reference](#common-commands-reference)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Best Practices](#best-practices)
9. [FAQ](#faq)

---

## Overview

This document provides comprehensive documentation for Docker volumes setup and usage in hookah-wishlist project. Docker volumes ensure persistent SQLite database storage across container restarts and deployments.

### Key Benefits

- **Data Persistence**: Database data survives container restarts and deployments
- **Portability**: Named volumes are host-independent and easy to move
- **Performance**: Optimized by Docker for better I/O performance
- **Security**: Managed by Docker with proper permissions

### Volume Structure

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

---

## Architecture

### Named Volumes vs Bind Mounts

The project uses a hybrid approach:

| Aspect | Named Volumes | Bind Mounts |
|--------|--------------|-------------|
| **Portability** | ✅ Host-independent | ❌ Host-dependent |
| **Performance** | ✅ Optimized by Docker | ⚠️ Depends on host FS |
| **Development** | ⚠️ Less convenient | ✅ Direct file access |
| **Production** | ✅ Best practice | ❌ Not recommended |

**Recommendation:**
- **Production**: Named volumes (portable, managed)
- **Development**: Bind mounts (direct access, debugging)

### Volume Naming Conventions

**Named Volumes:**
- `hookah-wishlist-data` - Primary database storage

**Mount Points:**
- `/app/data` - Database files in backend container

**Environment Variables:**
- `DATABASE_PATH=/app/data/wishlist.db` - Explicit database path
- `STORAGE_TYPE=sqlite` - Storage type
- `STORAGE_PATH=/app/data` - Storage directory path

### SQLite WAL Mode

The project uses SQLite with Write-Ahead Logging (WAL) mode for better performance and concurrency:

**WAL Mode Benefits:**
- Better concurrency (readers don't block writers)
- Faster write performance
- Reduced disk I/O
- Better durability

**WAL Files:**
- `wishlist.db` - Main database file
- `wishlist.db-wal` - Write-Ahead Log file
- `wishlist.db-shm` - Shared memory file

**Important:** All three files must be in same volume for proper WAL operation.

---

## Volume Configuration

### Docker Compose Configuration

The volume configuration is defined in [`docker-compose.yml`](../docker-compose.yml):

```yaml
services:
  backend:
    volumes:
      - hookah-wishlist-data:/app/data
    environment:
      - STORAGE_TYPE=sqlite
      - DATABASE_PATH=/app/data/wishlist.db
      - STORAGE_PATH=/app/data

volumes:
  hookah-wishlist-data:
    driver: local
```

### Environment Variables

Configure these variables in your `.env` file:

```bash
# Storage Configuration
STORAGE_TYPE=sqlite
DATABASE_PATH=/app/data/wishlist.db
STORAGE_PATH=/app/data
```

### Volume Permissions

The backend Dockerfile creates data directory with proper permissions:

```dockerfile
# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app/data

USER node
```

---

## Development vs Production

### Development Setup

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
    healthcheck: disable  # Faster startup
```

**Usage:**
```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use npm script
npm run dev:docker
```

### Production Setup

**Configuration:**
- Use named volumes for portability
- Enable healthchecks for reliability
- Use production environment variables
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
```

**Usage:**
```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use npm script
npm run start:prod
```

### Migration Strategy

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

## Volume Lifecycle Management

### Creating Volumes

```bash
# Create named volume
docker volume create hookah-wishlist-data

# Create volume with specific driver options
docker volume create \
  --driver local \
  --opt type=none \
  --opt device=/path/to/host/dir \
  --opt o=bind \
  hookah-wishlist-data
```

### Listing Volumes

```bash
# List all volumes
docker volume ls

# List volumes with filters
docker volume ls --filter "name=hookah-wishlist*"

# List volumes with dangling filter
docker volume ls --filter "dangling=true"
```

### Inspecting Volumes

```bash
# Inspect volume details
docker volume inspect hookah-wishlist-data

# Get volume mount point
docker volume inspect hookah-wishlist-data --format '{{.Mountpoint}}'
```

### Removing Volumes

```bash
# Remove a volume
docker volume rm hookah-wishlist-data

# Remove multiple volumes
docker volume rm hookah-wishlist-data hookah-wishlist-backups

# Remove all unused volumes
docker volume prune

# Remove unused volumes with force
docker volume prune -f
```

### Backing Up Volumes

```bash
# Manual backup using Docker
docker run --rm \
  -v hookah-wishlist-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine:latest \
  tar czf /backup/wishlist-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

### Restoring Volumes

```bash
# Restore from backup
docker run --rm \
  -v hookah-wishlist-data:/data \
  -v $(pwd)/backups:/backup:ro \
  alpine:latest \
  tar xzf /backup/wishlist-backup-YYYYMMDD-HHMMSS.tar.gz -C /data
```

---

## Common Commands Reference

### Volume Management

| Command | Description |
|---------|-------------|
| `docker volume ls` | List all volumes |
| `docker volume inspect <name>` | Inspect volume details |
| `docker volume create <name>` | Create a new volume |
| `docker volume rm <name>` | Remove a volume |
| `docker volume prune` | Remove all unused volumes |

### Volume Inspection

```bash
# Check volume contents
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  ls -la /data

# Check volume size
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  du -sh /data

# Check volume usage
docker system df -v | grep hookah-wishlist
```

### Container Operations

```bash
# Stop containers using volume
docker-compose down

# Start containers with volume
docker-compose up -d

# View container logs
docker-compose logs backend

# Execute command in container
docker-compose exec backend sh
```

### Database Operations

```bash
# Check database connection
docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); console.log(wishlistStorage.getStats());"

# Perform WAL checkpoint
docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); wishlistStorage.checkpoint();"

# Vacuum database
docker-compose exec backend node -e "const Database = require('better-sqlite3'); const db = new Database('/app/data/wishlist.db'); db.exec('VACUUM'); db.close();"
```

### Backup Operations

```bash
# Manual backup using Docker
docker run --rm \
  -v hookah-wishlist-data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine:latest \
  tar czf /backup/wishlist-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# Restore from backup
docker run --rm \
  -v hookah-wishlist-data:/data \
  -v $(pwd)/backups:/backup:ro \
  alpine:latest \
  tar xzf /backup/wishlist-backup-YYYYMMDD-HHMMSS.tar.gz -C /data
```

---

## Troubleshooting Guide

### Common Issues

#### Issue: Database not persisting

**Symptoms:**
- Data is lost after container restart
- Wishlist appears empty after deployment

**Causes:**
- Using tmpfs or ephemeral storage
- Volume not properly mounted
- Incorrect volume configuration

**Solutions:**

1. **Verify volume is mounted:**
   ```bash
   docker-compose exec backend ls -la /app/data
   ```

2. **Check volume configuration:**
   ```bash
   docker volume inspect hookah-wishlist-data
   ```

3. **Verify environment variables:**
   ```bash
   docker-compose exec backend env | grep DATABASE
   ```

4. **Ensure volume is created:**
   ```bash
   docker volume ls | grep hookah-wishlist-data
   ```

#### Issue: Permission denied accessing database

**Symptoms:**
- Container fails to start
- Database connection errors
- Permission denied messages in logs

**Causes:**
- Incorrect volume permissions
- Running as wrong user
- File ownership issues

**Solutions:**

1. **Check volume permissions:**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data \
     alpine:latest \
     ls -la /data
   ```

2. **Fix permissions:**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data \
     alpine:latest \
     sh -c "chown -R 1000:1000 /data"
   ```

3. **Verify user in container:**
   ```bash
   docker-compose exec backend whoami
   ```

4. **Check Dockerfile user configuration:**
   ```dockerfile
   USER node  # Should match volume permissions
   ```

#### Issue: WAL files growing too large

**Symptoms:**
- `wishlist.db-wal` file is very large
- Disk space usage increasing
- Performance degradation

**Causes:**
- WAL checkpoint not running
- Long-running transactions
- High write frequency

**Solutions:**

1. **Perform manual checkpoint:**
   ```bash
   docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); wishlistStorage.checkpoint();"
   ```

2. **Adjust WAL settings:**
   In [`backend/src/storage/sqlite.storage.ts`](../backend/src/storage/sqlite.storage.ts):
   ```typescript
   db.pragma('wal_autocheckpoint = 1000'); // Checkpoint every 1000 pages
   ```

3. **Monitor WAL file size:**
   ```bash
   docker-compose exec backend ls -lh /app/data/wishlist.db-wal
   ```

#### Issue: Database locked

**Symptoms:**
- Database connection errors
- "database is locked" messages
- Transactions failing

**Causes:**
- Multiple processes accessing database
- Long-running transactions
- Insufficient WAL mode configuration

**Solutions:**

1. **Check for multiple backend instances:**
   ```bash
   docker-compose ps
   ```

2. **Stop all containers:**
   ```bash
   docker-compose down
   ```

3. **Remove lock files:**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data \
     alpine:latest \
     sh -c "rm -f /data/wishlist.db-shm /data/wishlist.db-wal"
   ```

4. **Restart containers:**
   ```bash
   docker-compose up -d
   ```

#### Issue: Volume not found

**Symptoms:**
- Container fails to start
- "no such volume" error
- Volume missing after restart

**Causes:**
- Volume was deleted
- Volume name mismatch
- Using wrong Docker Compose file

**Solutions:**

1. **List all volumes:**
   ```bash
   docker volume ls
   ```

2. **Create missing volume:**
   ```bash
   docker volume create hookah-wishlist-data
   ```

3. **Restore from backup:**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data \
     -v $(pwd)/backups:/backup:ro \
     alpine:latest \
     tar xzf /backup/wishlist-backup-YYYYMMDD-HHMMSS.tar.gz -C /data
   ```

4. **Verify docker-compose.yml:**
   ```bash
   docker-compose config
   ```

### Diagnostic Commands

**Check Docker status:**
```bash
docker info
docker version
```

**Check container status:**
```bash
docker-compose ps
docker-compose logs backend
```

**Check volume status:**
```bash
docker volume ls
docker volume inspect hookah-wishlist-data
```

**Check network status:**
```bash
docker network ls
docker network inspect hookah-network
```

**Check system resources:**
```bash
docker system df
docker system events
```

### Getting Help

If you encounter issues not covered here:

1. Check [Troubleshooting section](#troubleshooting-guide) in this document
2. Check container logs: `docker-compose logs -f`
3. Verify environment variables: `docker-compose exec backend env`
4. Check Docker documentation: https://docs.docker.com/storage/volumes/

---

## Best Practices

### Volume Management

1. **Always backup before major changes**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data:ro \
     -v $(pwd)/backups:/backup \
     alpine:latest \
     tar czf /backup/pre-change-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
   ```

2. **Use named volumes in production**
   - More portable than bind mounts
   - Managed by Docker
   - Better performance

3. **Monitor volume size**
   ```bash
   docker run --rm \
     -v hookah-wishlist-data:/data \
     alpine:latest \
     du -sh /data
   ```

4. **Document volume changes**
   - Keep track of volume schema changes
   - Document migration procedures
   - Maintain backup schedules

### Security

1. **Use read-only mounts where possible**
   ```yaml
   volumes:
     - hookah-wishlist-data:/data:ro  # Read-only for backup service
   ```

2. **Restrict volume access**
   - Only mount volumes to necessary services
   - Use non-root users in containers
   - Set proper file permissions

3. **Encrypt sensitive data**
   - Consider encryption for production
   - Use secure backup storage
   - Protect backup files

4. **Never commit sensitive data**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   backups/
   data/
   ```

### Performance

1. **Use WAL mode for SQLite**
   - Better concurrency
   - Faster writes
   - Reduced disk I/O

2. **Optimize database regularly**
   ```bash
   # Vacuum database
   docker-compose exec backend node -e "const Database = require('better-sqlite3'); const db = new Database('/app/data/wishlist.db'); db.exec('VACUUM'); db.close();"
   ```

3. **Monitor WAL file size**
   - Perform regular checkpoints
   - Adjust WAL settings if needed
   - Monitor disk usage

4. **Use appropriate volume driver**
   - `local` driver for most use cases
   - Consider cloud-specific drivers for cloud deployments

### Development Workflow

1. **Use bind mounts for development**
   - Direct file access for debugging
   - Hot reload for faster development
   - Easier database inspection

2. **Separate development and production configs**
   - Use `docker-compose.dev.yml` for development
   - Use `docker-compose.prod.yml` for production
   - Keep environment-specific settings separate

3. **Test production setup locally**
   - Use named volumes in staging
   - Verify data persistence
   - Test backup/restore procedures

4. **Document development procedures**
   - Keep setup instructions updated
   - Document common development tasks
   - Share troubleshooting tips

---

## FAQ

### General Questions

**Q: What is difference between named volumes and bind mounts?**

A: Named volumes are managed by Docker and are host-independent, making them ideal for production. Bind mounts map a host directory to a container, providing direct file access but are host-dependent, making them better for development.

**Q: Why does SQLite create multiple files?**

A: SQLite with WAL mode creates three files:
- `wishlist.db` - Main database file
- `wishlist.db-wal` - Write-Ahead Log file
- `wishlist.db-shm` - Shared memory file

All three files must be in same volume for proper operation.

**Q: Can I access database directly on host?**

A: With named volumes, you cannot access files directly on host. Use Docker commands to inspect or backup volumes:
```bash
docker run --rm -v hookah-wishlist-data:/data alpine:latest ls -la /data
```

**Q: How do I migrate data from bind mount to named volume?**

A: Follow to migration strategy in [Development vs Production](#development-vs-production) section. The key steps are:
1. Backup existing data
2. Create named volume
3. Restore data to named volume
4. Update docker-compose.yml
5. Verify data integrity

### Troubleshooting Questions

**Q: My data is lost after container restart. What should I do?**

A: Check that:
1. Volume is properly mounted in docker-compose.yml
2. Volume exists: `docker volume ls`
3. Environment variables are correct: `DATABASE_PATH=/app/data/wishlist.db`
4. Restore from backup if needed

**Q: I'm getting "permission denied" errors. How do I fix this?**

A: Fix volume permissions:
```bash
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  sh -c "chown -R 1000:1000 /data"
```

**Q: The WAL file is growing too large. What should I do?**

A: Perform a manual checkpoint:
```bash
docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); wishlistStorage.checkpoint();"
```

**Q: How do I check if my database is healthy?**

A: Check database stats:
```bash
docker-compose exec backend node -e "const { wishlistStorage } = require('./dist/storage'); console.log(wishlistStorage.getStats());"
```

### Performance Questions

**Q: How can I improve database performance?**

A: Several options:
1. Use WAL mode (already enabled)
2. Optimize database regularly: `VACUUM`
3. Adjust cache size in SQLite configuration
4. Monitor and optimize slow queries

**Q: How much disk space do I need?**

A: Monitor current usage:
```bash
docker run --rm \
  -v hookah-wishlist-data:/data \
  alpine:latest \
  du -sh /data
```

Space requirements depend on:
- Number of users
- Wishlist size per user
- WAL file size

**Q: Can I use a different database instead of SQLite?**

A: Yes, architecture supports migration to PostgreSQL or MongoDB for production scaling. See architecture documentation for details on database migration.

### Security Questions

**Q: Are my database files secure?**

A: Security measures:
1. Use named volumes (managed by Docker)
2. Set proper file permissions (600 or 640)
3. Use non-root users in containers
4. Encrypt volumes at rest (for production)
5. Never commit sensitive data to version control

**Q: How do I protect my environment variables?**

A: Best practices:
1. Never commit `.env` files
2. Use `.env.example` as template
3. Use Docker secrets for production
4. Rotate sensitive credentials regularly

---

## Additional Resources

- [Docker Volumes Documentation](https://docs.docker.com/storage/volumes/)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Architecture Documentation](../plans/docker-volumes-architecture.md)

---

## Appendix A: Complete docker-compose.yml

See [`docker-compose.yml`](../docker-compose.yml) for complete configuration.

## Appendix B: Environment Variables

See [`.env.example`](../.env.example) for complete list of environment variables.
