# Coolify Deployment - Port Conflict Solution

## Problem
You're getting this error when deploying to Coolify:
```
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint ...: Bind for 0.0.0.0:8080 failed: port is already allocated
```

## Root Cause
Your `docker-compose.yml` file maps port `8080:80` for the mini-app service:
```yaml
mini-app:
  ports:
    - "8080:80"
```

In Coolify, port 8080 is already occupied by another service or Coolify itself.

## Solution

### Option 1: Use the Coolify-specific compose file (Recommended)

I've created `docker-compose.coolify.yml` which removes all port mappings since Coolify handles routing automatically via domains.

**In Coolify dashboard:**
1. Go to your mini-app application
2. In "Docker Compose" section, change the file path from `docker-compose.yml` to `docker-compose.coolify.yml`
3. Redeploy

### Option 2: Change the port mapping

Edit your current `docker-compose.yml` and change:
```yaml
mini-app:
  ports:
    - "8080:80"
```

To any of these:
```yaml
ports:
  - "8081:80"  # Use port 8081
  - "8082:80"  # Use port 8082
  - "3001:80"  # Use port 3001
```

### Option 3: Remove port mapping entirely for Coolify

Since Coolify provides automatic domains, you can simply remove the `ports` section for mini-app when deploying to Coolify.

## Coolify Domain Access

After deployment, Coolify will provide automatic domains:
- **Mini App**: `https://mini-app.your-instance.coolify.io`
- **API**: `https://api.your-instance.coolify.io`

You don't need to specify ports when using these domains.

## Quick Fix Steps

1. **In Coolify Dashboard:**
   - Go to your mini-app application
   - Navigate to "Resources" → "Docker Compose"
   - Change compose file path to: `docker-compose.coolify.yml`
   - Click "Save" and "Deploy"

2. **Or modify existing compose:**
   - Edit `docker-compose.yml`
   - Change `8080:80` to `8081:80` (or another free port)
   - Commit and push to GitHub
   - Coolify will auto-deploy

## Verification

After deployment, check:
1. All services show "Running" in Coolify dashboard
2. Health checks pass
3. Mini App is accessible via Coolify domain
4. API is accessible via Coolify domain

## Additional Notes

- The `docker-compose.coolify.yml` file is optimized for Coolify deployment
- It removes port conflicts and uses Coolify's internal networking
- All services can still communicate with each other via Docker network
- Health checks and dependencies remain the same