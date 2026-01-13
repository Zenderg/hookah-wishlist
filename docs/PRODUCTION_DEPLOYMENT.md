# Production Deployment Guide

This guide provides step-by-step instructions for deploying the hookah-wishlist application to production, with special attention to CORS configuration and environment variable setup.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Understanding CORS in This Project](#understanding-cors-in-this-project)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Troubleshooting CORS Issues](#troubleshooting-cors-issues)
6. [Verification](#verification)

## Prerequisites

Before deploying to production, ensure you have:

- Docker and Docker Compose installed
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- A hookah-db API key from the hookah-db service provider
- A production domain (e.g., `https://your-app.coolify.domain.org`)
- Access to your deployment platform (Coolify, Railway, Render, etc.)

## Understanding CORS in This Project

### What is CORS?

CORS (Cross-Origin Resource Sharing) is a security mechanism that restricts which origins (domains, protocols, ports) can access resources from another origin.

### How CORS Works in This Project

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Deployment                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Mini-App)                                        │
│  https://your-app.coolify.domain.org/mini-app               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  User opens mini-app in Telegram                      │  │
│  │  Frontend makes API request to:                        │  │
│  │  https://your-app.coolify.domain.org/api/v1/wishlist │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Nginx Reverse Proxy (Port 80)                      │  │
│  │  Routes /api/* to backend service                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Backend API (Port 3000, internal)                   │  │
│  │  Validates Origin header against MINI_APP_URL         │  │
│  │  If match: Adds Access-Control-Allow-Origin header    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Common CORS Issues

#### Issue 1: "No 'Access-Control-Allow-Origin' header present"

**Cause:** Backend CORS configuration doesn't allow requests from the frontend origin.

**Solution:** Ensure `MINI_APP_URL` is set correctly in backend environment variables.

#### Issue 2: "Request blocked by CORS policy"

**Cause:** Frontend is accessing backend directly (bypassing Nginx) or origin doesn't match.

**Solution:** Ensure `API_URL` is set to production domain, not `localhost:3000`.

#### Issue 3: "Origin not allowed by CORS policy"

**Cause:** Frontend origin doesn't match `MINI_APP_URL` exactly.

**Solution:** Check that `MINI_APP_URL` matches your frontend domain exactly (including protocol and path).

## Environment Variables Configuration

### Required Environment Variables

For production deployment, you must set the following environment variables:

#### Backend Variables

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_URL=https://your-app.coolify.domain.org/webhook

# Server Configuration
PORT=3000
NODE_ENV=production

# hookah-db API Configuration
HOOKEH_DB_API_URL=https://hdb.coolify.dknas.org
HOOKEH_DB_API_KEY=your_actual_api_key_here
API_RATE_LIMIT=100

# Storage Configuration
STORAGE_TYPE=sqlite
DATABASE_PATH=/app/data/wishlist.db
STORAGE_PATH=/app/data

# CORS Configuration (CRITICAL FOR PRODUCTION)
MINI_APP_URL=https://your-app.coolify.domain.org/mini-app
```

#### Frontend Variables (Build-Time)

```bash
# API URL for frontend (Build-time variable for Vite)
# IMPORTANT: This must be set at build time, not runtime
API_URL=https://your-app.coolify.domain.org/api/v1
```

### Setting Environment Variables on Coolify

1. Go to your Coolify project
2. Navigate to "Environment Variables" section
3. Add the following variables:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-app.coolify.domain.org/webhook
HOOKEH_DB_API_KEY=your_hookah_db_api_key_here
MINI_APP_URL=https://your-app.coolify.domain.org/mini-app
API_URL=https://your-app.coolify.domain.org/api/v1
```

4. Save the variables
5. **IMPORTANT:** After changing `API_URL`, you must rebuild the frontend container because it's a build-time variable

### Setting Environment Variables Locally

For local testing with Docker Compose:

1. Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your actual values
nano .env
```

2. Add your production values:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_URL=https://your-app.coolify.domain.org/webhook
HOOKEH_DB_API_KEY=your_actual_api_key_here
MINI_APP_URL=https://your-app.coolify.domain.org/mini-app
API_URL=https://your-app.coolify.domain.org/api/v1
```

3. Deploy with Docker Compose:

```bash
docker-compose up -d --build
```

## Deployment Steps

### Step 1: Prepare Environment Variables

1. Get your Telegram Bot Token from [@BotFather](https://t.me/BotFather)
2. Get your hookah-db API key from the service provider
3. Determine your production domain (e.g., `https://eccg44w0w8s0ogs8swss4008.coolify.domain.org`)

### Step 2: Configure Environment Variables

Set the following environment variables in your deployment platform:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-app.coolify.domain.org/webhook
HOOKEH_DB_API_KEY=your_api_key
MINI_APP_URL=https://your-app.coolify.domain.org/mini-app
API_URL=https://your-app.coolify.domain.org/api/v1
```

**Critical Notes:**
- `MINI_APP_URL` must match your frontend domain exactly
- `API_URL` must include the `/api/v1` path
- `API_URL` is a build-time variable, so changes require rebuilding the frontend container

### Step 3: Deploy with Docker Compose

If deploying locally or on a VPS:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Step 4: Deploy on Coolify

If deploying on Coolify:

1. Create a new project in Coolify
2. Connect your Git repository
3. Configure the following:
   - **Build Context:** `/`
   - **Docker Compose File:** `docker-compose.yaml`
   - **Environment Variables:** Add all required variables (see above)
4. Deploy the project

### Step 5: Verify Deployment

After deployment, verify:

1. **Health Check:**
   ```bash
   curl https://your-app.coolify.domain.org/health
   ```

2. **Backend Health:**
   ```bash
   curl https://your-app.coolify.domain.org/api/health
   ```

3. **Frontend Access:**
   - Open `https://your-app.coolify.domain.org/mini-app` in a browser
   - Should see the mini-app interface

4. **CORS Configuration:**
   - Check backend health endpoint for CORS info:
   ```bash
   curl https://your-app.coolify.domain.org/api/health | jq
   ```
   - Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-13T12:00:00.000Z",
     "cors": {
       "miniAppUrl": "https://your-app.coolify.domain.org/mini-app",
       "nodeEnv": "production"
     }
   }
   ```

## Troubleshooting CORS Issues

### Issue: "No 'Access-Control-Allow-Origin' header present"

**Symptoms:**
- Frontend cannot make API requests
- Browser console shows CORS error
- Error message: "No 'Access-Control-Allow-Origin' header is present on the requested resource"

**Root Causes:**
1. `MINI_APP_URL` not set in backend environment variables
2. `MINI_APP_URL` doesn't match frontend origin exactly
3. Frontend accessing backend directly (bypassing Nginx)

**Solutions:**

1. **Check Backend CORS Configuration:**
   ```bash
   # Check backend logs for CORS warnings
   docker-compose logs backend | grep -i cors
   ```

2. **Verify MINI_APP_URL:**
   ```bash
   # Check if MINI_APP_URL is set
   docker-compose exec backend printenv | grep MINI_APP_URL
   ```

3. **Check Frontend API URL:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Make a request
   - Check the request URL
   - Should be: `https://your-app.coolify.domain.org/api/v1/...`
   - Should NOT be: `http://localhost:3000/api/v1/...`

4. **Rebuild Frontend Container:**
   ```bash
   # Rebuild frontend with correct API_URL
   docker-compose up -d --build frontend
   ```

5. **Restart Backend Container:**
   ```bash
   # Restart backend to pick up MINI_APP_URL changes
   docker-compose restart backend
   ```

### Issue: "Origin not allowed by CORS policy"

**Symptoms:**
- Frontend origin doesn't match `MINI_APP_URL`
- Browser console shows CORS error
- Error message: "Origin https://domain.com not allowed by CORS policy"

**Root Causes:**
1. `MINI_APP_URL` doesn't match frontend origin exactly
2. Protocol mismatch (http vs https)
3. Path mismatch (missing `/mini-app`)

**Solutions:**

1. **Compare Origins:**
   - Check frontend origin in browser DevTools
   - Check `MINI_APP_URL` in backend logs
   - Ensure they match exactly

2. **Fix MINI_APP_URL:**
   ```bash
   # Example correct MINI_APP_URL values:
   MINI_APP_URL=https://your-app.coolify.domain.org/mini-app
   MINI_APP_URL=https://your-app.coolify.domain.org
   MINI_APP_URL=https://*.coolify.domain.org  # Wildcard for subdomains
   ```

3. **Support Multiple Origins:**
   ```bash
   # Comma-separated list of allowed origins
   MINI_APP_URL=https://app1.domain.org,https://app2.domain.org
   ```

### Issue: Frontend Accessing Backend Directly

**Symptoms:**
- Request URL is `http://localhost:3000/api/v1/...`
- Bypasses Nginx reverse proxy
- CORS errors because origin doesn't match

**Root Causes:**
1. `API_URL` not set or set to `http://localhost:3000`
2. Frontend built with wrong `API_URL`

**Solutions:**

1. **Check Frontend Build:**
   ```bash
   # Check if API_URL was set during build
   docker-compose logs frontend | grep VITE_API_URL
   ```

2. **Rebuild Frontend:**
   ```bash
   # Rebuild with correct API_URL
   docker-compose up -d --build frontend
   ```

3. **Verify Request URLs:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Make a request
   - Verify request URL is: `https://your-app.coolify.domain.org/api/v1/...`

### Issue: Changes Not Taking Effect

**Symptoms:**
- Environment variables changed but CORS still failing
- Old configuration still in use

**Root Causes:**
1. Frontend not rebuilt after `API_URL` change
2. Backend not restarted after `MINI_APP_URL` change
3. Docker containers using cached environment variables

**Solutions:**

1. **Rebuild All Containers:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

2. **Clear Docker Cache:**
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up -d --build
   ```

3. **Verify Environment Variables:**
   ```bash
   # Check backend environment
   docker-compose exec backend printenv | grep -E "(MINI_APP_URL|API_URL|NODE_ENV)"

   # Check frontend environment
   docker-compose exec frontend printenv | grep -E "(VITE_API_URL|NODE_ENV)"
   ```

## Verification

### Complete Deployment Verification Checklist

- [ ] All environment variables are set correctly
- [ ] `MINI_APP_URL` matches frontend domain exactly
- [ ] `API_URL` is set to production domain with `/api/v1` path
- [ ] Backend container is running and healthy
- [ ] Frontend container is running and healthy
- [ ] Nginx container is running and healthy
- [ ] Health check endpoint returns 200 OK
- [ ] Frontend is accessible at `/mini-app`
- [ ] API is accessible at `/api/v1`
- [ ] CORS headers are present in API responses
- [ ] Frontend can make API requests without CORS errors
- [ ] Telegram bot can be started
- [ ] Bot commands work correctly
- [ ] Mini-app can be opened from Telegram

### Test API with CORS Headers

```bash
# Test API request with CORS headers
curl -H "Origin: https://your-app.coolify.domain.org/mini-app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: content-type" \
     -X OPTIONS \
     https://your-app.coolify.domain.org/api/v1/health \
     -v

# Should include Access-Control-Allow-Origin header
```

### Test Frontend API Request

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
fetch('https://your-app.coolify.domain.org/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

4. Should return health check data without CORS errors

## Additional Resources

- [README.md](../README.md) - Main project documentation
- [.env.example](../.env.example) - Environment variables template
- [docs/DOCKER_COMPOSE_TESTING.md](DOCKER_COMPOSE_TESTING.md) - Docker Compose testing results
- [docs/BACKEND_TEST_COVERAGE.md](BACKEND_TEST_COVERAGE.md) - Backend test coverage
- [mini-app/TELEGRAM_INTEGRATION.md](../mini-app/TELEGRAM_INTEGRATION.md) - Telegram integration guide

## Support

If you encounter issues not covered in this guide:

1. Check Docker logs: `docker-compose logs -f`
2. Check backend logs: `docker-compose logs -f backend`
3. Check frontend logs: `docker-compose logs -f frontend`
4. Check Nginx logs: `docker-compose logs -f nginx`
5. Verify environment variables: `docker-compose exec backend printenv`
6. Review CORS configuration in backend logs
7. Test API endpoints with curl
8. Check browser DevTools for detailed error messages
