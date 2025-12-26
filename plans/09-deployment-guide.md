# Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Hookah Wishlist System to production. It covers infrastructure setup, application deployment, monitoring, and maintenance procedures.

## Architecture Overview

```mermaid
graph TB
    subgraph "External"
        A[Telegram API]
        B[Users]
    end
    
    subgraph "VPS / Cloud"
        C[Nginx Reverse Proxy]
        D[PM2 Process Manager]
        E[API Server]
        F[Telegram Bot]
        G[Scraper]
        H[PostgreSQL Database]
        I[Mini App Static Files]
    end
    
    B --> A
    A <--> F
    B --> I
    C --> D
    D --> E
    D --> F
    D --> G
    E --> H
    F --> H
    G --> H
    C --> I
    
    style A fill:#0088cc
    style C fill:#009639
    style D fill:#009639
    style E fill:#68a063
    style F fill:#68a063
    style G fill:#e03535
    style H fill:#336791
    style I fill:#61dafb
```

## Infrastructure Requirements

### Minimum Requirements

**VPS / Cloud Instance**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 40 GB SSD
- OS: Ubuntu 22.04 LTS or 24.04 LTS

**Recommended Requirements** (for growth):
- CPU: 4 cores
- RAM: 8 GB
- Storage: 80 GB SSD
- OS: Ubuntu 24.04 LTS

### Cloud Providers

**Options**:
- DigitalOcean (Droplets)
- AWS EC2
- Google Cloud Compute Engine
- Linode
- Hetzner
- Vultr

**Recommended**: DigitalOcean for simplicity and cost-effectiveness

## Prerequisites

### Domain Name

- Registered domain (e.g., `yourdomain.com`)
- DNS configured to point to your VPS IP

### Telegram Bot

- Bot created via BotFather
- Bot token obtained
- Webhook URL configured

### SSL Certificate

- Let's Encrypt (free, recommended)
- Commercial SSL certificate

## Step-by-Step Deployment

### Step 1: Server Setup

#### 1.1 Connect to Server

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone Europe/Moscow
```

#### 1.2 Create Non-Root User

```bash
# Create user
adduser deployer

# Add to sudo group
usermod -aG sudo deployer

# Switch to new user
su - deployer
```

#### 1.3 Install Dependencies

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x

# Install PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Verify installation
sudo -u postgres psql --version

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Database Setup

#### 2.1 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE hookah_wishlist;
CREATE USER hookah_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hookah_wishlist TO hookah_user;
\q
```

#### 2.2 Configure PostgreSQL

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/16/main/postgresql.conf

# Add/modify these settings:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Application Setup

#### 3.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/hookah-wishlist
sudo chown deployer:deployer /var/www/hookah-wishlist

# Clone repository
cd /var/www/hookah-wishlist
git clone https://github.com/your-username/hookah-wishlist.git .
```

#### 3.2 Install Dependencies

```bash
# Install API dependencies
cd /var/www/hookah-wishlist/api
npm ci --only=production

# Install Bot dependencies
cd /var/www/hookah-wishlist/bot
npm ci --only=production

# Install Scraper dependencies
cd /var/www/hookah-wishlist/scraper
npm ci --only=production

# Build Mini App
cd /var/www/hookah-wishlist/mini-app
npm ci
npm run build
```

#### 3.3 Configure Environment Variables

```bash
# Create .env file for API
cd /var/www/hookah-wishlist/api
nano .env
```

```env
# API Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://hookah_user:your_secure_password@localhost:5432/hookah_wishlist"

# JWT Secret
JWT_SECRET="your_jwt_secret_here"

# Bot API Key (for bot authentication)
BOT_API_KEY="your_bot_api_key_here"

# Logging
LOG_LEVEL=info
```

```bash
# Create .env file for Bot
cd /var/www/hookah-wishlist/bot
nano .env
```

```env
# Bot Configuration
TELEGRAM_BOT_TOKEN="your_bot_token_here"
NODE_ENV=production

# API URL
API_URL="https://api.yourdomain.com/api/v1"
API_KEY="your_bot_api_key_here"

# Logging
LOG_LEVEL=info
```

```bash
# Create .env file for Scraper
cd /var/www/hookah-wishlist/scraper
nano .env
```

```env
# Scraper Configuration
SCRAPER_SCHEDULE="0 2 * * *"
SCRAPER_TIMEOUT=60000
SCRAPER_MAX_RETRIES=3
SCRAPER_DELAY_BRAND=2000
SCRAPER_DELAY_TOBACCO=1000

# Database
DATABASE_URL="postgresql://hookah_user:your_secure_password@localhost:5432/hookah_wishlist"

# Logging
LOG_LEVEL=info
```

#### 3.4 Run Database Migrations

```bash
cd /var/www/hookah-wishlist/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### Step 4: Nginx Configuration

#### 4.1 Configure API Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4.2 Configure Mini App Static Files

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/hookah-wishlist/mini-app/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.3 Enable Sites

```bash
# Create symbolic links
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: SSL Configuration

#### 5.1 Obtain SSL Certificates

```bash
# Obtain certificate for API
sudo certbot --nginx -d api.yourdomain.com

# Obtain certificate for Mini App
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 5.2 Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
# Verify cron job exists
sudo systemctl status certbot.timer
```

### Step 6: Application Deployment with PM2

#### 6.1 Create PM2 Ecosystem File

```bash
cd /var/www/hookah-wishlist
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'hookah-api',
      script: './api/dist/index.js',
      cwd: '/var/www/hookah-wishlist',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/hookah-api-error.log',
      out_file: '/var/log/pm2/hookah-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'hookah-bot',
      script: './bot/dist/index.js',
      cwd: '/var/www/hookah-wishlist',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/hookah-bot-error.log',
      out_file: '/var/log/pm2/hookah-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'hookah-scraper',
      script: './scraper/dist/index.js',
      cwd: '/var/www/hookah-wishlist',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/hookah-scraper-error.log',
      out_file: '/var/log/pm2/hookah-scraper-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

#### 6.2 Start Applications with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown deployer:deployer /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### 6.3 Monitor Applications

```bash
# View all processes
pm2 list

# View logs
pm2 logs

# Monitor in real-time
pm2 monit

# Restart specific app
pm2 restart hookah-api

# Restart all apps
pm2 restart all
```

### Step 7: Telegram Bot Configuration

#### 7.1 Set Webhook

```bash
# Use curl to set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.yourdomain.com/bot/webhook",
    "drop_pending_updates": true
  }'
```

#### 7.2 Configure Mini App in BotFather

1. Open BotFather in Telegram
2. Select your bot
3. Choose `/mybots` → Your Bot → `/setmenubutton`
4. Select "Web App"
5. Enter text: "📱 Открыть приложение"
6. Enter URL: `https://yourdomain.com`

#### 7.3 Verify Bot

```bash
# Get webhook info
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Get bot info
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

### Step 8: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

### Step 9: Monitoring Setup

#### 9.1 Log Rotation

```bash
sudo nano /etc/logrotate.d/pm2
```

```
/var/log/pm2/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 deployer deployer
  sharedscripts
  postrotate
    pm2 reloadLogs
  endscript
}
```

#### 9.2 Health Check Script

```bash
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$API_STATUS" -ne 200 ]; then
    echo "API is down, restarting..."
    pm2 restart hookah-api
fi

# Check Bot status
if ! pm2 status hookah-bot | grep -q "online"; then
    echo "Bot is down, restarting..."
    pm2 restart hookah-bot
fi
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/health-check.sh

# Add to cron (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -
```

## Deployment Workflow

### Automated Deployment Script

Create `deploy.sh` in project root:

```bash
#!/bin/bash

set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Build API
cd api
npm ci
npm run build
npx prisma generate
npx prisma migrate deploy

# Build Bot
cd ../bot
npm ci
npm run build

# Build Mini App
cd ../mini-app
npm ci
npm run build

# Restart applications
pm2 restart all

echo "Deployment completed successfully!"
```

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### CI/CD Pipeline (Optional)

#### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd api && npm ci
          cd ../bot && npm ci
          cd ../mini-app && npm ci
          
      - name: Run tests
        run: |
          cd api && npm test
          
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/hookah-wishlist
            git pull origin main
            ./deploy.sh
```

## Backup Strategy

### Database Backups

#### Automated Backup Script

```bash
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hookah_wishlist_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U hookah_user -h localhost hookah_wishlist > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "hookah_wishlist_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to cron (daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-db.sh") | crontab -
```

### Application Backups

```bash
# Backup application code and configuration
tar -czf /var/backups/app_$(date +%Y%m%d).tar.gz /var/www/hookah-wishlist

# Keep last 7 days
find /var/backups -name "app_*.tar.gz" -mtime +7 -delete
```

## Maintenance

### Update Dependencies

```bash
# Update API
cd /var/www/hookah-wishlist/api
npm update
npm run build
pm2 restart hookah-api

# Update Bot
cd /var/www/hookah-wishlist/bot
npm update
npm run build
pm2 restart hookah-bot

# Update Mini App
cd /var/www/hookah-wishlist/mini-app
npm update
npm run build
pm2 restart hookah-api  # No need to restart Mini App (static)
```

### Database Maintenance

```bash
# Connect to database
sudo -u postgres psql hookah_wishlist

# Analyze tables for query optimization
ANALYZE;

# Vacuum to reclaim space
VACUUM FULL;

# Reindex
REINDEX DATABASE hookah_wishlist;
```

### Log Management

```bash
# View PM2 logs
pm2 logs

# Clear old logs
pm2 flush

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues

#### Issue 1: API Not Responding

```bash
# Check if API is running
pm2 status

# Check API logs
pm2 logs hookah-api

# Check if port is listening
sudo netstat -tlnp | grep 3000

# Restart API
pm2 restart hookah-api
```

#### Issue 2: Bot Not Receiving Updates

```bash
# Check webhook status
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Check bot logs
pm2 logs hookah-bot

# Reset webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

#### Issue 3: Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Test connection
psql -U hookah_user -h localhost -d hookah_wishlist
```

#### Issue 4: Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

## Security Hardening

### 1. SSH Configuration

```bash
sudo nano /etc/ssh/sshd_config
```

```
# Disable root login
PermitRootLogin no

# Disable password authentication
PasswordAuthentication no

# Allow only specific user
AllowUsers deployer
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

### 2. Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

```
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 3. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny incoming
sudo ufw enable
```

## Performance Optimization

### 1. Nginx Caching

```nginx
# Add to server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location /api/v1/tobaccos {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://localhost:3000;
}
```

### 2. PostgreSQL Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_wishlist_items_user_purchased 
ON wishlist_items(wishlist_id, is_purchased);

CREATE INDEX idx_tobaccos_brand_name 
ON tobaccos(brand_id, name);
```

### 3. Application Optimization

```javascript
// Enable compression in API
fastify.register(require('@fastify/compress'), {
  encodings: ['gzip', 'deflate'],
});

// Enable caching headers
fastify.addHook('onSend', async (request, reply, payload) => {
  reply.header('Cache-Control', 'public, max-age=3600');
});
```

## Scaling Considerations

### Horizontal Scaling

When scaling to multiple API instances:

```javascript
// ecosystem.config.js
{
  instances: 'max', // or specific number
  exec_mode: 'cluster',
}
```

### Load Balancing

```nginx
upstream api_backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://api_backend;
    }
}
```

### Database Replication

For read-heavy workloads, set up PostgreSQL read replicas:

```bash
# Configure master for replication
# Configure replica to connect to master
# Update application to read from replicas
```

## Monitoring & Alerting

### PM2 Monitoring

```bash
# Install PM2 Plus (optional)
pm2 plus

# Or use built-in monitoring
pm2 monit
```

### Custom Metrics

```javascript
// Add to API server
fastify.get('/metrics', async (request, reply) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeConnections: activeConnections,
    requestsPerSecond: calculateRPS(),
  };
  return metrics;
});
```

### Alerting Setup

```bash
# Install monitoring tool (e.g., UptimeRobot, Pingdom)
# Configure to monitor:
# - https://api.yourdomain.com/health
# - https://yourdomain.com
# - Bot webhook endpoint
```

## Documentation

### Keep Documentation Updated

- Update deployment guide when infrastructure changes
- Document any custom configurations
- Maintain runbook for common operations
- Keep contact information for support

## Summary

This deployment guide provides:

✅ **Complete setup instructions** - From server to application deployment
✅ **Security best practices** - SSL, firewall, SSH hardening
✅ **Monitoring setup** - Health checks, logging, alerting
✅ **Backup strategy** - Automated database and application backups
✅ **Troubleshooting guide** - Common issues and solutions
✅ **Scaling considerations** - Horizontal scaling and load balancing
✅ **Maintenance procedures** - Updates, optimizations, log management

Following this guide will result in a production-ready deployment of the Hookah Wishlist System.
