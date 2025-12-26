# Deployment Guide

## Overview

This document provides comprehensive instructions for deploying Hookah Wishlist System to production using Coolify platform with GitHub Webhooks automation. The system runs entirely in Docker containers with PostgreSQL, eliminating the need for local database installation. Deployment is automated through GitHub push events.

## Architecture Overview

```mermaid
graph TB
    subgraph "GitHub"
        A[GitHub Repository]
        B[GitHub Webhook]
    end
    
    subgraph "Coolify Platform"
        C[Coolify Dashboard]
        D[Traefik Load Balancer]
        E[Docker Runtime]
    end
    
    subgraph "Docker Services"
        F[API Server]
        G[Telegram Bot]
        H[Scraper]
        I[PostgreSQL Database]
        J[Mini App Static Files]
    end
    
    subgraph "External"
        K[Telegram API]
        L[htreviews.org]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    F --> K
    G --> K
    H --> L
    
    style A fill:#2088ff
    style B fill:#2088ff
    style C fill:#6b4fbb
    style D fill:#6b4fbb
    style E fill:#2496ed
    style F fill:#68a063
    style G fill:#0088cc
    style H fill:#e03535
    style I fill:#336791
    style J fill:#61dafb
    style K fill:#0088cc
    style L fill:#ff6b6b
```

## Prerequisites

### Required Accounts

1. **GitHub Account**
   - Repository for project code
   - Access to create webhooks

2. **Coolify Account**
   - Sign up at https://coolify.io
   - Free tier sufficient for MVP
   - GitHub integration enabled

3. **Telegram Account**
   - Bot created via BotFather
   - Bot token obtained
   - Bot configured with Mini App URL

### Required Domains

1. **API Domain** (optional but recommended)
   - Example: `api.yourdomain.com`
   - Configured in Coolify for API service

2. **Mini App Domain** (optional but recommended)
   - Example: `yourdomain.com`
   - Configured in Coolify for static files

### Required Tokens

1. **Telegram Bot Token**
   - Obtained from @BotFather
   - Stored in Coolify environment variables

2. **Coolify GitHub Token**
   - Generated in Coolify dashboard
   - Used for GitHub repository connection

## Step-by-Step Deployment

### Step 1: Prepare GitHub Repository

#### 1.1 Initialize Repository (if not exists)

```bash
# Create new repository on GitHub
# Clone repository locally
git clone https://github.com/your-username/hookah-wishlist.git
cd hookah-wishlist
```

#### 1.2 Create .gitignore

```bash
cat > .gitignore << EOF
node_modules/
dist/
.env
*.log
.DS_Store
.env.example
EOF
```

#### 1.3 Commit Initial Code

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### Step 2: Set Up Coolify Account

#### 2.1 Create Coolify Account

1. Go to https://coolify.io
2. Click "Sign Up" or "Get Started"
3. Sign up using GitHub account (recommended)
4. Complete onboarding process

#### 2.2 Create New Application

1. In Coolify dashboard, click "New Application"
2. Fill in application details:
   - **Name**: `hookah-wishlist-api`
   - **Type**: `Dockerfile / Docker Compose`
   - **Repository**: Select your GitHub repository
   - **Branch**: `main`
   - **Build Path**: `/api` (for API service)
3. Click "Create Application"

#### 2.3 Create Bot Application

1. Create another application for Telegram Bot:
   - **Name**: `hookah-wishlist-bot`
   - **Type**: `Dockerfile / Docker Compose`
   - **Repository**: Same repository
   - **Branch**: `main`
   - **Build Path**: `/bot` (for bot service)
2. Click "Create Application"

#### 2.4 Create Scraper Application

1. Create another application for Scraper:
   - **Name**: `hookah-wishlist-scraper`
   - **Type**: `Dockerfile / Docker Compose`
   - **Repository**: Same repository
   - **Branch**: `main`
   - **Build Path**: `/scraper` (for scraper service)
2. Click "Create Application"

#### 2.5 Create Mini App Application

1. Create application for Mini App static files:
   - **Name**: `hookah-wishlist-mini-app`
   - **Type**: `Static Site`
   - **Repository**: Same repository
   - **Branch**: `main`
   - **Build Path**: `/mini-app/dist` (for Mini App)
2. Click "Create Application"

### Step 3: Configure Environment Variables

#### 3.1 API Application Environment Variables

In Coolify dashboard for `hookah-wishlist-api` application, add:

```env
# Database
DATABASE_URL=postgresql://hookah_user:secure_password@postgres:5432/hookah_wishlist

# API Configuration
PORT=3000
NODE_ENV=production

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_here

# Bot API Key (for bot authentication)
BOT_API_KEY=your_secure_bot_api_key_here

# Logging
LOG_LEVEL=info
```

#### 3.2 Bot Application Environment Variables

In Coolify dashboard for `hookah-wishlist-bot` application, add:

```env
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
NODE_ENV=production

# API URL (Coolify internal URL)
API_URL=http://hookah-wishlist-api:3000/api/v1
API_KEY=your_secure_bot_api_key_here

# Logging
LOG_LEVEL=info
```

#### 3.3 Scraper Application Environment Variables

In Coolify dashboard for `hookah-wishlist-scraper` application, add:

```env
# Scraper Configuration
SCRAPER_SCHEDULE="0 2 * * *"
SCRAPER_TIMEOUT=60000
SCRAPER_MAX_RETRIES=3
SCRAPER_DELAY_BRAND=2000
SCRAPER_DELAY_TOBACCO=1000

# Database
DATABASE_URL=postgresql://hookah_user:secure_password@postgres:5432/hookah_wishlist

# Logging
LOG_LEVEL=info
```

#### 3.4 Mini App Application Environment Variables

In Coolify dashboard for `hookah-wishlist-mini-app` application, add:

```env
# API URL (Coolify internal URL)
VITE_API_URL=http://hookah-wishlist-api:3000/api/v1

# Telegram Bot Username
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

### Step 4: Configure GitHub Webhook

#### 4.1 Enable Webhook in Coolify

1. In Coolify dashboard for `hookah-wishlist-api` application:
   - Go to "Resources" tab
   - Click "GitHub Webhook"
   - Toggle "Enable Webhook" to ON

2. Configure webhook settings:
   - **Repository**: Already selected during app creation
   - **Branch**: `main`
   - **Build Command**: `npm run build && cd api && npx prisma generate && npx prisma migrate deploy`
   - **Events**: `push` (only trigger on push to main branch)
   - **Active**: ON

3. Click "Save Changes"

4. Coolify will provide a webhook URL like:
   ```
   https://webhook.coolify.io/your-unique-id
   ```

#### 4.2 Configure GitHub Repository Webhook

1. Go to your GitHub repository settings
2. Navigate to "Webhooks" section
3. Click "Add webhook"
4. Configure webhook:
   - **Payload URL**: The webhook URL from Coolify
   - **Content type**: `application/json`
   - **Secret**: Create a secure secret (optional but recommended)
   - **Events**: Select `push` event
   - **Branch**: `main`
   - **Active**: ON
5. Click "Add webhook"

### Step 5: Configure Docker Compose for Coolify

#### 5.1 Create coolify.yml

Create `coolify.yml` file in project root:

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
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hookah_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: hookah-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://hookah_user:${POSTGRES_PASSWORD}@postgres:5432/hookah_wishlist
      PORT: 3000
      NODE_ENV: production
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

  bot:
    build:
      context: ./bot
      dockerfile: Dockerfile
    container_name: hookah-bot
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      API_URL: http://api:3000/api/v1
      API_KEY: ${BOT_API_KEY}
      LOG_LEVEL: info
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
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
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('healthy')"]
      interval: 60s
      timeout: 10s
      retries: 3

  mini-app:
    build:
      context: ./mini-app
      dockerfile: Dockerfile
    container_name: hookah-mini-app
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://api:3000/api/v1
      VITE_TELEGRAM_BOT_USERNAME: ${TELEGRAM_BOT_USERNAME}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

#### 5.2 Create .env.example File

Create `.env.example` file in project root:

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

### Step 6: Configure Telegram Bot

#### 6.1 Set Bot Webhook

```bash
# Use curl to set webhook to Coolify API URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-coolify-domain.com/bot/webhook",
    "drop_pending_updates": true
  }'
```

#### 6.2 Configure Mini App in BotFather

1. Open BotFather in Telegram
2. Select your bot
3. Choose `/mybots` → Your Bot → `/setmenubutton`
4. Select "Web App"
5. Enter text: "📱 Открыть приложение"
6. Enter URL: `https://your-coolify-domain.com`
7. Click "Save"

### Step 7: Deploy to Coolify

#### 7.1 Initial Deployment

1. Push code to GitHub (triggers automatic deployment):
```bash
git add .
git commit -m "Ready for Coolify deployment"
git push origin main
```

2. Coolify will automatically:
   - Pull latest code from GitHub
   - Build Docker images
   - Deploy all services
   - Start containers
   - Run health checks

3. Monitor deployment in Coolify dashboard:
   - Check "Logs" tab for each service
   - Check "Resources" tab for CPU/memory usage
   - Verify all services are running

#### 7.2 Verify Deployment

```bash
# Test API health
curl https://your-coolify-domain.com/health

# Test bot webhook
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo

# Test Mini App
curl https://your-coolify-domain.com/

# Test bot command (via Telegram)
/start
```

## Deployment Workflow

### Automated Deployment Process

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant GH as GitHub
    participant CF as Coolify
    participant APP as Application
    
    DEV->>GH: git push origin main
    GH->>CF: Webhook triggered
    CF->>CF: Pull latest code
    CF->>CF: Build Docker images
    CF->>CF: Deploy services
    CF->>APP: Start containers
    CF->>APP: Health checks
    CF-->>DEV: Deployment success
    APP->>DEV: Application running
```

### Manual Deployment

If automatic deployment fails or you need to deploy manually:

1. In Coolify dashboard, go to application
2. Click "Deploy" button
3. Select branch: `main`
4. Click "Deploy"
5. Monitor deployment progress in "Logs" tab

## Monitoring & Maintenance

### Coolify Monitoring

#### 1. Application Logs

- Navigate to application in Coolify dashboard
- Click "Logs" tab
- View real-time logs from all containers
- Filter logs by service, time, or search term
- Download logs for analysis

#### 2. Resource Monitoring

- Navigate to "Resources" tab
- Monitor CPU usage per service
- Monitor memory usage per service
- Monitor disk usage
- Set up alerts for resource limits

#### 3. Health Checks

All services include health checks:

```yaml
# Health check endpoints
GET /health - API health check
GET /bot/health - Bot health check
HTTP 200 from / - Mini App health check
```

Coolify automatically restarts unhealthy services.

### Database Backups

Coolify provides automated backups:

1. **Database Volume Backups**
   - PostgreSQL data stored in Docker volume
   - Configure automatic volume snapshots in Coolify
   - Retain backups for 30 days

2. **Manual Backup Script**

Create backup script in project root:

```bash
#!/bin/bash

# backup-db.sh
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup via Docker Compose
docker-compose exec -T postgres pg_dump -U hookah_user hookah_wishlist > $BACKUP_DIR/hookah_wishlist_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/hookah_wishlist_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "hookah_wishlist_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/hookah_wishlist_$DATE.sql.gz"
```

Make it executable:

```bash
chmod +x backup-db.sh
```

Run backup:

```bash
./backup-db.sh
```

## Troubleshooting

### Common Issues

#### Issue 1: Deployment Failed

**Symptoms**:
- GitHub webhook triggered but deployment failed
- Coolify shows deployment error in logs

**Solutions**:
1. Check Coolify logs for error messages
2. Verify build command is correct
3. Check environment variables are set
4. Verify Docker Compose file is valid
5. Try manual deployment from Coolify dashboard

#### Issue 2: Service Not Starting

**Symptoms**:
- Service shows as "Stopped" in Coolify
- Health checks failing

**Solutions**:
1. Check service logs for errors
2. Verify environment variables
3. Check Docker Compose configuration
4. Verify dependencies between services (e.g., API depends on PostgreSQL)
5. Restart service from Coolify dashboard

#### Issue 3: Database Connection Failed

**Symptoms**:
- API/Bot/Scraper cannot connect to PostgreSQL
- Logs show connection errors

**Solutions**:
1. Verify PostgreSQL is running and healthy
2. Check DATABASE_URL environment variable
3. Verify PostgreSQL password is correct
4. Check Docker network connectivity
5. Verify service dependencies in docker-compose.yml

#### Issue 4: Bot Not Receiving Updates

**Symptoms**:
- Bot commands not working
- Webhook not receiving updates

**Solutions**:
1. Verify webhook URL is correct
2. Check bot token is correct
3. Test webhook via curl:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   ```
4. Check Coolify API logs for webhook errors
5. Verify Coolify domain is accessible from Telegram

#### Issue 5: Mini App Not Loading

**Symptoms**:
- Mini App shows blank or error
- Cannot authenticate

**Solutions**:
1. Verify VITE_API_URL is correct
2. Check API is accessible from Mini App
3. Check Mini App logs in Coolify
4. Verify Telegram initData is being passed correctly
5. Test API authentication endpoint manually

#### Issue 6: Scraper Not Running

**Symptoms**:
- Scraper not updating database
- No new tobaccos appearing

**Solutions**:
1. Check scraper logs for errors
2. Verify SCRAPER_SCHEDULE is correct
3. Check database connection
4. Verify htreviews.org is accessible
5. Test scraper manually:
   ```bash
   docker-compose exec scraper node dist/index.js --manual
   ```

## Scaling Considerations

### Horizontal Scaling

Coolify makes horizontal scaling easy:

1. **Scale API Service**
   - In Coolify dashboard, go to API application
   - Click "Resources" tab
   - Increase "Instances" count
   - Coolify will automatically load balance across instances

2. **Scale Bot Service**
   - Bot typically runs as single instance
   - Can scale if needed (multiple bot instances with different tokens)

3. **Database Scaling**
   - PostgreSQL can be scaled vertically (increase resources)
   - Coolify supports PostgreSQL resource scaling

### Resource Optimization

1. **API Service**
   - Start with 1 instance (256MB RAM)
   - Scale to 2 instances (512MB RAM) if needed
   - Maximum: 4 instances (1GB RAM)

2. **Bot Service**
   - Start with 128MB RAM
   - Increase to 256MB if needed

3. **Scraper Service**
   - Start with 256MB RAM
   - Increase to 512MB if scraping large amounts of data

4. **Mini App Service**
   - Static files require minimal resources
   - Start with 64MB RAM
   - Scale if high traffic

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` file to Git
- Use `.env.example` as template
- Generate secure secrets for production
- Use Coolify's secure environment variable storage

### 2. Secrets Management

- Rotate secrets regularly
- Use strong, unique passwords
- Don't reuse secrets across services
- Monitor for leaked secrets

### 3. Container Security

- All services run in isolated containers
- No root access inside containers
- Read-only file systems where possible
- Network access restricted to Docker network

### 4. API Security

- Enable HTTPS via Coolify (automatic)
- Implement rate limiting
- Validate all inputs
- Use parameterized queries (Prisma)

### 5. Bot Security

- Validate Telegram initData
- Use API key for bot authentication
- Implement rate limiting per user
- Log suspicious activities

## Cost Optimization

### Coolify Pricing

**Free Tier** (sufficient for MVP):
- 2 applications (API + Bot)
- 2GB RAM total
- 10GB storage
- 1GB bandwidth per month
- Automatic SSL/TLS
- Health monitoring

**Estimated Monthly Cost**: $0 (free tier)

### When to Upgrade

- **CPU usage consistently > 80%**: Consider upgrading resources
- **Memory usage consistently > 80%**: Consider upgrading resources
- **Storage > 80% full**: Consider upgrading plan
- **Bandwidth > 80%**: Consider upgrading plan

## Maintenance Procedures

### Daily Tasks

1. **Monitor Logs**
   - Check Coolify logs for errors
   - Review resource usage
   - Verify all services are healthy

2. **Check Backups**
   - Verify backups completed successfully
   - Monitor backup storage usage

### Weekly Tasks

1. **Review Metrics**
   - Analyze usage patterns
   - Identify performance bottlenecks
   - Plan scaling if needed

2. **Security Audit**
   - Review access logs
   - Verify secrets are secure
   - Check for vulnerabilities

### Monthly Tasks

1. **Dependency Updates**
   - Update dependencies via GitHub
   - Coolify will automatically redeploy
   - Test after deployment

2. **Database Maintenance**
   - Analyze database performance
   - Run VACUUM if needed
   - Review and optimize indexes

## Rollback Procedures

### Rollback to Previous Version

If deployment causes issues:

1. **Identify Problematic Commit**
   ```bash
   git log --oneline -10
   ```

2. **Revert to Previous Commit**
   ```bash
   git revert <commit-hash>
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   ```

4. **Coolify Will Automatically Redeploy**
   - Monitor deployment in Coolify dashboard
   - Verify rollback was successful

### Rollback to Specific Version

```bash
# Checkout specific version
git checkout <tag-or-commit>

# Push to GitHub
git push origin main --force

# Coolify will deploy this version
```

## Documentation

### Keep Documentation Updated

- Update deployment guide when infrastructure changes
- Document any custom configurations
- Maintain runbook for common operations
- Keep contact information for support

### Deployment Checklist

- [ ] GitHub repository created and configured
- [ ] Coolify account created
- [ ] All applications created in Coolify
- [ ] Environment variables configured
- [ ] GitHub webhook configured
- [ ] Docker Compose file created
- [ ] Bot webhook configured
- [ ] Mini App URL configured in BotFather
- [ ] Initial deployment successful
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup procedures documented

## Summary

This deployment guide provides:

✅ **Complete Coolify setup** - Step-by-step Coolify configuration
✅ **GitHub Webhooks** - Automated deployment on push
✅ **Docker Compose** - All services in containers
✅ **No local PostgreSQL** - Database runs in Docker
✅ **Environment management** - Coolify handles secrets
✅ **Monitoring** - Built-in logging and health checks
✅ **Scaling** - Easy horizontal scaling in Coolify
✅ **Security** - HTTPS, secrets management, container isolation
✅ **Cost optimization** - Free tier sufficient for MVP
✅ **Rollback procedures** - Easy version control rollback
✅ **Troubleshooting** - Common issues and solutions

Following this guide will result in a production-ready deployment of Hookah Wishlist System with automated deployments via Coolify and GitHub Webhooks, eliminating manual server management and local database installation.
