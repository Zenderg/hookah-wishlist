# HMAC-SHA256 Fix Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the HMAC-SHA256 authentication fix to production. The fix corrects the secret key calculation method for Telegram Web Apps authentication, changing from `SHA-256(bot_token)` to `HMAC-SHA256(bot_token, "WebAppData")` as specified in Telegram's official documentation.

**Fix Summary:**
- **Issue:** Incorrect secret key calculation causing authentication failures in production
- **Root Cause:** Using `SHA-256(bot_token)` instead of `HMAC-SHA256(bot_token, "WebAppData")`
- **Solution:** Updated secret key calculation in [`backend/src/api/middleware/auth.ts`](../backend/src/api/middleware/auth.ts:171)
- **Status:** Implementation complete, TypeScript compilation verified, test confirms correctness

**Related Documentation:**
- [HMAC-SHA256 Fix Summary](./HMAC_SHA256_FIX_SUMMARY.md) - Detailed explanation of the fix
- [HMAC-SHA256 Fix Test Results](./HMAC_SHA256_FIX_TEST_RESULTS.md) - Test verification results
- [Telegram Mini Apps Init Data Documentation](https://docs.telegram-mini-apps.com/platform/init-data) - Official Telegram documentation

---

## Pre-Deployment Checklist

### 1. Verify Environment Configuration

Before deploying, verify the following environment variables are set correctly:

```bash
# Check current environment variables
docker-compose config | grep -A 20 "environment:"
```

**Required Environment Variables:**
- `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather
- `TELEGRAM_WEBHOOK_URL` - Your webhook URL (e.g., https://your-domain.com/webhook)
- `HOOKEH_DB_API_KEY` - Your hookah-db API key
- `NODE_ENV` - Should be `production`
- `STORAGE_TYPE` - Should be `sqlite`
- `DATABASE_PATH` - Should be `/app/data/wishlist.db`

**Verification Command:**
```bash
# Check if .env file exists and has required variables
cat .env | grep -E "TELEGRAM_BOT_TOKEN|HOOKEH_DB_API_KEY|NODE_ENV|STORAGE_TYPE|DATABASE_PATH"
```

### 2. Document Current Deployment State

Capture the current state before deployment:

```bash
# Save current container status
docker-compose ps > /tmp/pre-deployment-container-status.txt

# Save current backend logs
docker-compose logs backend > /tmp/pre-deployment-backend-logs.txt

# Save current image versions
docker images | grep hookah-wishlist > /tmp/pre-deployment-images.txt

# Note the current timestamp
date > /tmp/pre-deployment-timestamp.txt
```

### 3. Backup Current Running Containers

Create a backup of the current backend container:

```bash
# Commit current backend container as an image
docker commit hookah-wishlist-backend hookah-wishlist-backend:backup-$(date +%Y%m%d-%H%M%S)

# Verify backup was created
docker images | grep hookah-wishlist-backend
```

### 4. Verify Code Changes

Verify the fix is present in the codebase:

```bash
# Check if the fix is present in auth.ts
grep -n "createHmac('sha256', 'WebAppData')" backend/src/api/middleware/auth.ts

# Expected output should show line 171:
# 171:     const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
```

### 5. Verify TypeScript Compilation

Ensure TypeScript compiles without errors:

```bash
# Navigate to backend directory
cd backend

# Run TypeScript compiler
npx tsc --noEmit

# Expected output: No errors
```

### 6. Run Tests (Optional but Recommended)

Run the test suite to ensure no regressions:

```bash
# Navigate to backend directory
cd backend

# Run all tests
npm test

# Expected: All tests pass (or minimal expected failures)
```

### 7. Check Docker Compose Configuration

Validate Docker Compose configuration:

```bash
# Validate docker-compose.yml
docker-compose config

# Expected: No errors, valid configuration
```

### 8. Review Recent Changes

Review the changes to be deployed:

```bash
# View the fix in auth.ts
git diff backend/src/api/middleware/auth.ts

# Review the HMAC-SHA256 verification function (lines 97-244)
# Verify secret key calculation at line 171
```

---

## Deployment Steps

### Step 1: Stop Backend Service

Stop the backend service gracefully:

```bash
# Stop backend service only
docker-compose stop backend

# Verify backend is stopped
docker-compose ps backend

# Expected output: backend service shows "Exit" status
```

### Step 2: Rebuild Backend Docker Image

Rebuild the backend Docker image with the new code:

```bash
# Rebuild backend image
docker-compose build backend

# Monitor build progress
# Expected: Build completes successfully with no errors
```

**Build Verification:**
```bash
# Verify new image was created
docker images | grep hookah-wishlist-backend

# Check image creation time
docker inspect hookah-wishlist-backend | grep Created
```

### Step 3: Start Backend Service

Start the backend service with the new image:

```bash
# Start backend service
docker-compose up -d backend

# Verify backend is running
docker-compose ps backend

# Expected output: backend service shows "Up" status
```

### Step 4: Verify Service Health

Check if the backend service is healthy:

```bash
# Check backend logs for startup messages
docker-compose logs backend | tail -50

# Expected: No errors, service started successfully

# Check health endpoint
curl http://localhost/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

**Health Check Script:**
```bash
# Wait for service to be healthy (max 30 seconds)
for i in {1..30}; do
  if curl -s http://localhost/api/health | grep -q "ok"; then
    echo "Backend service is healthy"
    break
  fi
  echo "Waiting for backend to be healthy... ($i/30)"
  sleep 1
done
```

### Step 5: Verify Authentication Logs

Check backend logs for authentication debug messages:

```bash
# View recent authentication logs
docker-compose logs backend | grep -A 5 "AUTH DEBUG"

# Expected: Debug logs showing HMAC-SHA256 verification process
```

**Expected Log Pattern (Successful Authentication):**
```
[AUTH DEBUG] ==================== Authentication Request ====================
[AUTH DEBUG] Request URL: /api/v1/wishlist
[AUTH DEBUG] Request method: GET
[AUTH DEBUG] Checking X-Telegram-Init-Data header: true
[AUTH DEBUG] initData found, length: [length]
[AUTH DEBUG] Checking TELEGRAM_BOT_TOKEN environment variable: true
[AUTH DEBUG] Bot token present, length: [length]
[AUTH DEBUG] ==================== Signature Verification Start ====================
[AUTH DEBUG] Verifying initData signature
[AUTH DEBUG] Has hash parameter: true
[AUTH DEBUG] Using HMAC-SHA256 signature verification (preferred method with bot token)
[AUTH DEBUG] ==================== HMAC-SHA256 Verification Start ====================
[AUTH DEBUG] Verifying initData signature using HMAC-SHA256 (preferred method)
[AUTH DEBUG] Hash present (HMAC-SHA256): [hash]
[AUTH DEBUG] Creating data-check-string...
[AUTH DEBUG] Calculating secret key from bot token...
[AUTH DEBUG] Using HMAC-SHA256 with "WebAppData" as key and bot token as message
[AUTH DEBUG] Secret key calculated successfully
[AUTH DEBUG] Calculating HMAC-SHA256 of data-check-string...
[AUTH DEBUG] HMAC calculated successfully
[AUTH DEBUG] Comparing calculated HMAC with expected hash...
[AUTH DEBUG] ==================== HMAC VERIFICATION SUCCESSFUL ====================
[AUTH DEBUG] HMAC signature verification successful
[AUTH DEBUG] ==================== HMAC-SHA256 Verification End ====================
[AUTH DEBUG] ==================== Authentication Successful ====================
[AUTH DEBUG] Successfully authenticated user [user_id] from Telegram WebApp
```

---

## Verification Steps

### 1. Test Mini-App in Telegram Environment

**Manual Testing Steps:**

1. **Open Mini-App in Telegram:**
   - Open your Telegram bot
   - Click on the mini-app button or menu
   - Verify the mini-app loads successfully

2. **Verify Authentication:**
   - The mini-app should load without authentication errors
   - You should see your wishlist (if you have items)
   - No "Authentication failed" messages should appear

3. **Test Protected Endpoints:**
   - Try to search for tobaccos
   - Try to add items to wishlist
   - Try to remove items from wishlist
   - All operations should work without authentication errors

**Expected Behavior:**
- Mini-app loads successfully
- Authentication succeeds automatically
- All protected endpoints work correctly
- No 401 Unauthorized errors

### 2. Verify Protected API Endpoints

Test the protected API endpoints directly:

```bash
# Test wishlist endpoint (requires authentication)
# Note: This requires valid initData from Telegram
curl -H "X-Telegram-Init-Data: [your_init_data]" \
  http://localhost/api/v1/wishlist

# Expected: JSON response with wishlist data (not 401 error)
```

**Alternative Verification (via Mini-App):**
- Use the mini-app to test all endpoints
- Check browser console for 401 errors
- Verify all API calls succeed

### 3. Monitor Authentication Logs

Monitor backend logs for authentication activity:

```bash
# Follow backend logs in real-time
docker-compose logs -f backend | grep "AUTH"

# Watch for successful authentication
# Expected: Multiple "HMAC VERIFICATION SUCCESSFUL" messages
```

**Log Patterns to Watch For:**

✅ **Success Indicators:**
```
[AUTH DEBUG] HMAC signature verification successful
[AUTH DEBUG] ==================== Authentication Successful ====================
[AUTH DEBUG] Successfully authenticated user [user_id] from Telegram WebApp
```

❌ **Failure Indicators:**
```
[AUTH ERROR] HMAC signature verification failed
[AUTH ERROR] Invalid Telegram init data signature
[401] Unauthorized: Invalid signature
```

### 4. Verify No Authentication Errors

Check for authentication errors in logs:

```bash
# Count authentication errors in last 100 lines
docker-compose logs backend --tail=100 | grep -c "Invalid signature"

# Expected: 0 (or very low if testing with invalid data)

# Count successful authentications in last 100 lines
docker-compose logs backend --tail=100 | grep -c "Authentication Successful"

# Expected: > 0 (if users are using the mini-app)
```

### 5. Test with Multiple Users

If possible, test with multiple users:

1. Have multiple users open the mini-app
2. Verify all users can authenticate successfully
3. Verify all users can access their own data
4. Verify no cross-user data access

### 6. Verify Data Persistence

Verify that data persists correctly:

```bash
# Check database file exists
ls -lh /app/data/wishlist.db

# Expected: File exists with reasonable size

# Check database is accessible
docker-compose exec backend sqlite3 /app/data/wishlist.db "SELECT COUNT(*) FROM wishlists;"

# Expected: Number of users with wishlists
```

### 7. Performance Verification

Verify performance is acceptable:

```bash
# Test API response time
time curl -s http://localhost/api/health

# Expected: Response time < 200ms

# Test mini-app load time
# Open mini-app and observe load time
# Expected: Mini-app loads within 2-3 seconds
```

---

## Rollback Procedures

### When to Rollback

Consider rollback if:
- Authentication fails for all users
- Mini-app is completely inaccessible
- Critical errors in backend logs
- Data corruption or loss
- Performance degradation

### Rollback Steps

#### Option 1: Rollback to Previous Docker Image

```bash
# Stop backend service
docker-compose stop backend

# Remove current backend container
docker-compose rm -f backend

# Restore previous backend image
docker run -d \
  --name hookah-wishlist-backend \
  --network hookah-wishlist_hookah-network \
  -v hookah-wishlist_hookah-wishlist-data:/app/data \
  -e TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN} \
  -e TELEGRAM_WEBHOOK_URL=${TELEGRAM_WEBHOOK_URL} \
  -e HOOKEH_DB_API_KEY=${HOOKEH_DB_API_KEY} \
  -e NODE_ENV=production \
  -e STORAGE_TYPE=sqlite \
  -e DATABASE_PATH=/app/data/wishlist.db \
  hookah-wishlist-backend:backup-[TIMESTAMP]

# Verify backend is running
docker ps | grep hookah-wishlist-backend

# Check logs
docker logs hookah-wishlist-backend | tail -50
```

#### Option 2: Revert Code Changes and Rebuild

```bash
# Revert code changes
git checkout HEAD~1 -- backend/src/api/middleware/auth.ts

# Rebuild backend
docker-compose down backend
docker-compose build backend
docker-compose up -d backend

# Verify backend is running
docker-compose ps backend
```

#### Option 3: Use Git Revert

```bash
# Find the commit hash of the fix
git log --oneline | grep "HMAC-SHA256"

# Revert the commit
git revert [commit_hash]

# Rebuild and deploy
docker-compose down backend
docker-compose build backend
docker-compose up -d backend

# Verify backend is running
docker-compose ps backend
```

### Rollback Verification

After rollback, verify:

```bash
# Check backend logs
docker-compose logs backend | tail -50

# Test health endpoint
curl http://localhost/api/health

# Test mini-app authentication
# Open mini-app in Telegram and verify it works
```

### Rollback Documentation

Document the rollback:

```bash
# Save rollback details
cat > /tmp/rollback-details.txt << EOF
Rollback Date: $(date)
Rollback Reason: [reason]
Rollback Method: [option 1/2/3]
Previous Image: [image-tag]
Current Image: [image-tag]
EOF
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Authentication Still Failing After Deployment

**Symptoms:**
- Mini-app shows "Authentication failed" error
- Backend logs show "HMAC signature verification failed"

**Possible Causes:**
1. Wrong bot token
2. initData is from a different bot
3. initData is corrupted or tampered with
4. Fix not properly deployed

**Solutions:**

1. **Verify Bot Token:**
```bash
# Check bot token in environment
docker-compose exec backend printenv | grep TELEGRAM_BOT_TOKEN

# Verify bot token is correct
# Compare with token from @BotFather
```

2. **Verify Fix is Deployed:**
```bash
# Check if fix is present in running container
docker-compose exec backend grep -n "createHmac('sha256', 'WebAppData')" /app/dist/api/middleware/auth.js

# Expected: Line containing the fix
```

3. **Check Logs for Details:**
```bash
# View detailed authentication logs
docker-compose logs backend | grep -A 20 "HMAC VERIFICATION FAILED"

# Look for specific error messages
```

4. **Test with Fresh initData:**
```bash
# Clear mini-app cache and reload
# Open mini-app in Telegram again
# Verify authentication works
```

#### Issue 2: Backend Service Won't Start

**Symptoms:**
- Backend container exits immediately
- Backend shows "Exit" status

**Possible Causes:**
1. TypeScript compilation error
2. Missing environment variables
3. Port conflict
4. Database connection issue

**Solutions:**

1. **Check Container Logs:**
```bash
# View backend logs
docker-compose logs backend

# Look for error messages
```

2. **Verify Environment Variables:**
```bash
# Check environment variables in container
docker-compose exec backend printenv | grep -E "TELEGRAM_BOT_TOKEN|NODE_ENV|STORAGE_TYPE|DATABASE_PATH"

# Ensure all required variables are set
```

3. **Check Port Availability:**
```bash
# Check if port 3000 is available
netstat -an | grep 3000

# Or use lsof
lsof -i :3000
```

4. **Verify Database:**
```bash
# Check database file exists
docker-compose exec backend ls -lh /app/data/wishlist.db

# Check database permissions
docker-compose exec backend ls -la /app/data/
```

#### Issue 3: Mini-App Loads but Can't Access Data

**Symptoms:**
- Mini-app loads successfully
- Authentication succeeds
- But can't access wishlist or search

**Possible Causes:**
1. API endpoint not responding
2. Network issue between mini-app and backend
3. Nginx routing issue

**Solutions:**

1. **Test API Directly:**
```bash
# Test API endpoint
curl http://localhost/api/v1/wishlist

# Expected: 401 Unauthorized (without authentication) or 200 OK (with authentication)
```

2. **Check Nginx Logs:**
```bash
# View Nginx logs
docker-compose logs nginx

# Look for routing errors
```

3. **Verify Nginx Configuration:**
```bash
# Check Nginx configuration
docker-compose exec nginx nginx -t

# Expected: Configuration file test is successful
```

4. **Check Network Connectivity:**
```bash
# Test connectivity from mini-app to backend
docker-compose exec frontend ping backend

# Expected: Ping succeeds
```

#### Issue 4: High Memory or CPU Usage

**Symptoms:**
- Backend container using excessive resources
- Slow response times

**Possible Causes:**
1. Memory leak
2. Infinite loop
3. Too many concurrent requests
4. Database query optimization needed

**Solutions:**

1. **Check Resource Usage:**
```bash
# Check container resource usage
docker stats hookah-wishlist-backend

# Look for high CPU or memory usage
```

2. **Check Database Performance:**
```bash
# Check database size
docker-compose exec backend sqlite3 /app/data/wishlist.db ".tables"

# Check database size
docker-compose exec backend du -sh /app/data/wishlist.db
```

3. **Review Logs for Errors:**
```bash
# Check for error messages
docker-compose logs backend | grep -i error

# Look for patterns
```

4. **Restart Backend:**
```bash
# Restart backend service
docker-compose restart backend

# Monitor logs after restart
docker-compose logs -f backend
```

### Log Patterns to Watch For

#### Success Patterns

✅ **Successful HMAC-SHA256 Verification:**
```
[AUTH DEBUG] ==================== HMAC-SHA256 Verification Start ====================
[AUTH DEBUG] Verifying initData signature using HMAC-SHA256 (preferred method)
[AUTH DEBUG] Hash present (HMAC-SHA256): [hash]
[AUTH DEBUG] Secret key calculated successfully
[AUTH DEBUG] Using HMAC-SHA256 with "WebAppData" as key and bot token as message
[AUTH DEBUG] HMAC calculated successfully
[AUTH DEBUG] ==================== HMAC VERIFICATION SUCCESSFUL ====================
[AUTH DEBUG] HMAC signature verification successful
```

✅ **Successful Authentication:**
```
[AUTH DEBUG] ==================== Authentication Successful ====================
[AUTH DEBUG] Successfully authenticated user [user_id] from Telegram WebApp
```

#### Warning Patterns

⚠️ **Using Ed25519 (Fallback):**
```
[AUTH DEBUG] Using Ed25519 signature verification (third-party validation)
[AUTH DEBUG] This is used for third-party validation when bot token is not available
```
**Note:** This is expected if only `signature` parameter is present, but if both `hash` and `signature` are present, HMAC-SHA256 should be used.

⚠️ **Old initData:**
```
[AUTH DEBUG] auth_date is too old: [age] seconds
```
**Note:** This is expected if initData is older than 24 hours.

#### Error Patterns

❌ **Missing Bot Token:**
```
[AUTH ERROR] TELEGRAM_BOT_TOKEN environment variable is not set
[AUTH ERROR] This is a critical configuration error - authentication cannot work without bot token
```
**Solution:** Set `TELEGRAM_BOT_TOKEN` environment variable.

❌ **HMAC Verification Failed:**
```
[AUTH ERROR] HMAC signature verification failed - signatures do not match
[AUTH ERROR] This could be due to:
[AUTH ERROR] 1. Incorrect bot token
[AUTH ERROR] 2. Incorrect data-check-string construction
[AUTH ERROR] 3. initData has been tampered with
[AUTH ERROR] 4. URL-decoding issue with parameter values
[AUTH ERROR] 5. Incorrect parameter sorting
[AUTH ERROR] 6. Missing or extra parameters in data-check-string
```
**Solution:** Check bot token, verify initData is not corrupted, ensure fix is deployed.

❌ **Missing Hash or Signature:**
```
[AUTH ERROR] Neither hash nor signature found in initData
[AUTH ERROR] This is unexpected - initData should contain at least one of these parameters
```
**Solution:** Verify initData is properly formatted and contains required parameters.

❌ **Expired Auth Data:**
```
[AUTH ERROR] auth_date is too old: [age] seconds
```
**Solution:** User needs to reload mini-app to get fresh initData.

### How to Verify the Fix is Working

#### 1. Check Secret Key Calculation

Verify the secret key is calculated correctly:

```bash
# View authentication logs
docker-compose logs backend | grep -A 5 "Calculating secret key from bot token"

# Expected output should include:
# [AUTH DEBUG] Using HMAC-SHA256 with "WebAppData" as key and bot token as message
```

#### 2. Verify URL Decoding

Verify URL decoding is working:

```bash
# View data-check-string construction logs
docker-compose logs backend | grep -A 10 "Creating data-check-string"

# Expected output should show decoded values:
# [AUTH DEBUG] Decoding user: %7B%22id%22%3A... -> {"id":...
```

#### 3. Verify HMAC Calculation

Verify HMAC is calculated correctly:

```bash
# View HMAC calculation logs
docker-compose logs backend | grep -A 5 "Calculating HMAC-SHA256 of data-check-string"

# Expected output should show:
# [AUTH DEBUG] HMAC calculated successfully
# [AUTH DEBUG] Calculated HMAC (full hex): [hash]
```

#### 4. Verify Signature Comparison

Verify signature comparison is working:

```bash
# View signature comparison logs
docker-compose logs backend | grep -A 10 "Comparing calculated HMAC with expected hash"

# Expected output should show:
# [AUTH DEBUG] Using constant-time comparison to prevent timing attacks
# [AUTH DEBUG] ==================== HMAC VERIFICATION SUCCESSFUL ====================
```

#### 5. Test with Production Data

Test with actual production initData:

1. Open mini-app in Telegram
2. Open browser developer tools (F12)
3. Go to Network tab
4. Find API requests
5. Copy `X-Telegram-Init-Data` header value
6. Test with curl:

```bash
# Test with production initData
curl -H "X-Telegram-Init-Data: [your_init_data]" \
  http://localhost/api/v1/wishlist

# Expected: 200 OK with wishlist data (not 401)
```

---

## Post-Deployment Checklist

### 1. Verify All Services are Running

```bash
# Check all services
docker-compose ps

# Expected: All services show "Up" status
```

### 2. Verify No Errors in Logs

```bash
# Check for errors in backend logs
docker-compose logs backend | grep -i error

# Expected: No errors (or only expected errors)
```

### 3. Verify Authentication Works

```bash
# Check for successful authentications
docker-compose logs backend | grep "Authentication Successful"

# Expected: Multiple successful authentication messages
```

### 4. Verify Mini-App is Accessible

```bash
# Test mini-app endpoint
curl -I http://localhost/mini-app/

# Expected: 200 OK response
```

### 5. Verify Database Persistence

```bash
# Check database file
docker-compose exec backend ls -lh /app/data/wishlist.db

# Expected: File exists with reasonable size
```

### 6. Document Deployment

Document the deployment:

```bash
# Save deployment details
cat > /tmp/deployment-details.txt << EOF
Deployment Date: $(date)
Deployment Type: HMAC-SHA256 Fix
Previous Image: [previous-image-tag]
New Image: [new-image-tag]
Deployment Status: Success
Verification Status: Success
Rollback Image: [backup-image-tag]
EOF
```

### 7. Monitor for Issues

Monitor the system for the first few hours after deployment:

```bash
# Follow backend logs
docker-compose logs -f backend

# Watch for authentication errors
docker-compose logs -f backend | grep -i "error\|failed"

# Monitor resource usage
docker stats hookah-wishlist-backend
```

### 8. Update Documentation

Update documentation if needed:

- Update deployment logs
- Document any issues encountered
- Update troubleshooting guide
- Update deployment procedures

---

## Environment-Specific Considerations

### Production Environment

**Considerations:**
- SSL/TLS should be configured for HTTPS
- Use actual production bot token
- Use actual production API keys
- Monitor authentication logs closely
- Have rollback plan ready

**Additional Steps:**
```bash
# Verify SSL/TLS is configured
curl -I https://your-domain.com/api/health

# Expected: 200 OK with HTTPS
```

### Staging Environment

**Considerations:**
- Use staging bot token
- Use staging API keys
- Test thoroughly before production deployment
- Monitor for any issues

**Additional Steps:**
```bash
# Test with staging bot token
# Verify all features work
# Document any issues
```

### Development Environment

**Considerations:**
- May use mock initData for testing
- May not have bot token configured
- May use development mode fallback

**Additional Steps:**
```bash
# Test with mock initData
# Verify development mode fallback works
# Test authentication with real initData
```

---

## Support and Resources

### Documentation

- [HMAC-SHA256 Fix Summary](./HMAC_SHA256_FIX_SUMMARY.md) - Detailed explanation of the fix
- [HMAC-SHA256 Fix Test Results](./HMAC_SHA256_FIX_TEST_RESULTS.md) - Test verification results
- [Telegram Mini Apps Init Data Documentation](https://docs.telegram-mini-apps.com/platform/init-data) - Official Telegram documentation
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md) - General production deployment guide
- [Docker Volumes Documentation](./DOCKER_VOLUMES.md) - Docker volumes and persistence

### Code References

- [`backend/src/api/middleware/auth.ts`](../backend/src/api/middleware/auth.ts) - Authentication middleware with HMAC-SHA256 fix
- [`backend/tests/integration/hmac-sha256-fix.test.ts`](../backend/tests/integration/hmac-sha256-fix.test.ts) - Test file for HMAC-SHA256 fix

### Troubleshooting Commands

```bash
# View backend logs
docker-compose logs -f backend

# View authentication logs
docker-compose logs backend | grep "AUTH"

# Check container status
docker-compose ps

# Check resource usage
docker stats

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

### Contact and Support

If you encounter issues during deployment:

1. Check this deployment guide first
2. Review the troubleshooting section
3. Check the authentication logs for details
4. Review the related documentation
5. Consider rollback if issues are critical

---

## Summary

This deployment guide provides comprehensive instructions for deploying the HMAC-SHA256 authentication fix to production. The fix corrects the secret key calculation method from `SHA-256(bot_token)` to `HMAC-SHA256(bot_token, "WebAppData")` as specified in Telegram's official documentation.

**Key Points:**
- ✅ Fix is implemented and verified
- ✅ TypeScript compilation successful
- ✅ Test confirms implementation is correct
- ✅ Ready for production deployment

**Deployment Steps:**
1. Pre-deployment checklist
2. Stop backend service
3. Rebuild backend Docker image
4. Start backend service
5. Verify service health
6. Test mini-app authentication
7. Monitor logs for issues

**Verification:**
- Mini-app loads successfully
- Authentication succeeds
- Protected endpoints work
- No authentication errors in logs

**Rollback:**
- Multiple rollback options available
- Document rollback procedures
- Verify rollback success

**Troubleshooting:**
- Common issues and solutions
- Log patterns to watch for
- How to verify fix is working

**Next Steps:**
1. Complete pre-deployment checklist
2. Deploy fix to production
3. Verify authentication works
4. Monitor for issues
5. Update documentation if needed

---

**Deployment Guide Version:** 1.0
**Last Updated:** 2026-01-19
**Fix Version:** HMAC-SHA256 Secret Key Fix
**Status:** Ready for Production Deployment
