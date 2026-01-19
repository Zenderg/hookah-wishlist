# HMAC-SHA256 Signature Verification Fix Summary

## Issue

After fixing the priority logic to use HMAC-SHA256 (hash) first, production authentication was failing with:
```
[AUTH DEBUG] HMAC signature verification failed - signatures do not match
[AUTH DEBUG] This could be due to:
[AUTH DEBUG] 1. Incorrect bot token
[AUTH DEBUG] 2. Incorrect data-check-string construction
[AUTH DEBUG] 3. initData has been tampered with
```

## Root Cause

The HMAC-SHA256 verification function was using **URL-encoded values** in the data-check-string instead of **URL-decoded values**, as required by Telegram's official documentation.

### Current Behavior (INCORRECT)

The implementation kept URL-encoded values in the data-check-string:
```typescript
.map(([key, value]) => `${key}=${value}`)
```

**Example of Incorrect Data-Check-String:**
```
auth_date=1768757235
chat_instance=7714732502496827171
chat_type=private
user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg%22%7D
```

### Expected Behavior (CORRECT)

According to Telegram's official documentation, the data-check-string MUST use URL-decoded values:
```
auth_date=1768757235
chat_instance=7714732502496827171
chat_type=private
user={"id":385787313,"first_name":"Данил","last_name":"","username":"Koshmarus","language_code":"en","allows_write_to_pm":true,"photo_url":"https:\/\/t.me\/i\/userpic\/320\/82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg"}
```

### Evidence from Telegram Official Documentation

From [Telegram Mini Apps Init Data Documentation](https://docs.telegram-mini-apps.com/platform/init-data):

**Example from Telegram:**

**Input initData:**
```
query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2
```

**Expected Data-Check-String (from Telegram):**
```
auth_date=1662771648
query_id=AAHdF6IQAAAAAN0XohDhrOrc
user={"id":279058397,"first_name":"Vladislav","last_name":"Kibenko","username":"vdkfrost","language_code":"ru","is_premium":true}
```

**Notice:** The `user` parameter is **URL-decoded** in the data-check-string, even though it's URL-encoded in the initData.

### Why This Caused Signature Mismatch

The HMAC-SHA256 signature is calculated by Telegram using **URL-decoded** values. When our implementation used URL-encoded values, the hash calculation produced a completely different result, causing signature verification to fail.

**Example:**
- Telegram calculates HMAC-SHA256 of: `user={"id":385787313,...}` (decoded)
- Our implementation calculated HMAC-SHA256 of: `user=%7B%22id%22%3A385787313,...}` (encoded)
- Result: Different hashes → Signature verification fails

## Solution

### Fix Applied

Added `decodeURIComponent()` to decode URL-encoded values before creating the data-check-string in both HMAC-SHA256 and Ed25519 verification functions.

### Files Modified

**File:** [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts)

**Changes:**

1. **HMAC-SHA256 Verification Function** (line 127):
   ```typescript
   // BEFORE (INCORRECT):
   .map(([key, value]) => `${key}=${value}`)
   
   // AFTER (CORRECT):
   .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
   ```

2. **Ed25519 Verification Function** (line 222):
   ```typescript
   // BEFORE (INCORRECT):
   .map(([key, value]) => `${key}=${value}`)
   
   // AFTER (CORRECT):
   .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
   ```

3. **Added Comments** to reference Telegram documentation:
   ```typescript
   // IMPORTANT: URL-decode values before creating the string (per Telegram documentation)
   // Reference: https://docs.telegram-mini-apps.com/platform/init-data
   ```

### TypeScript Compilation

✅ TypeScript compilation successful (no errors)

## Verification Steps

To verify the fix works in production:

1. **Rebuild Docker containers** to apply the code change:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

2. **Check logs** to verify HMAC-SHA256 verification succeeds:
   ```bash
   docker-compose logs -f backend
   ```

3. **Test mini-app** in Telegram environment:
   - Open the mini-app in Telegram
   - Verify authentication succeeds
   - Check that you can access protected endpoints

4. **Verify authentication** works correctly:
   - Check that user can search for tobaccos
   - Check that user can manage wishlist
   - Verify no authentication errors in logs

## Expected Result

After applying the fix, HMAC-SHA256 signature verification should succeed, and production authentication should work correctly. The debug logs should show:

```
[AUTH DEBUG] ==================== HMAC-SHA256 Verification Start ====================
[AUTH DEBUG] Verifying initData signature using HMAC-SHA256 (preferred method)
[AUTH DEBUG] Hash present (HMAC-SHA256): c5fa7d7c68573da37d9be...
[AUTH DEBUG] Full hash (hex): c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842
[AUTH DEBUG] dataCheckString:
[AUTH DEBUG] auth_date=1768757235
[AUTH DEBUG] chat_instance=7714732502496827171
[AUTH DEBUG] chat_type=private
[AUTH DEBUG] user={"id":385787313,"first_name":"Данил",...}
[AUTH DEBUG] dataCheckString length: [length]
[AUTH DEBUG] Secret key calculated from bot token
[AUTH DEBUG] Secret key (hex): [hex value]
[AUTH DEBUG] Calculated HMAC (hex): c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842
[AUTH DEBUG] Expected hash (hex): c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842
[AUTH DEBUG] HMAC signature verification successful
[AUTH DEBUG] ==================== HMAC-SHA256 Verification End ====================
```

## Additional Considerations

### Bot Token Configuration

While the URL encoding issue is the primary cause, also verify:

- `TELEGRAM_BOT_TOKEN` environment variable is set in production
- Bot token is correct for this bot
- Bot token hasn't been regenerated or changed

### Both hash and signature Parameters

The production initData contains BOTH `hash` and `signature` parameters. This is unusual but valid. The priority-based verification ensures we use HMAC-SHA256 (hash) when available, which is the correct method for first-party mini apps.

### Security

The fix maintains all security measures:
- HMAC-SHA256 signature verification (preferred method)
- Ed25519 signature verification (fallback for third-party validation)
- Constant-time comparison to prevent timing attacks
- Timestamp validation to prevent replay attacks (24-hour max age)

## Documentation

For more details, see:
- [HMAC-SHA256 Verification Analysis](./HMAC_SHA256_VERIFICATION_ANALYSIS.md) - Detailed analysis of the issue
- [Telegram Mini Apps Init Data Documentation](https://docs.telegram-mini-apps.com/platform/init-data) - Official Telegram documentation

## Summary

**Root Cause:** The HMAC-SHA256 verification function was using URL-encoded values in the data-check-string instead of URL-decoded values, as required by Telegram's official documentation.

**Impact:** This caused the calculated HMAC to differ from the expected hash, resulting in signature verification failure.

**Fix:** Added `decodeURIComponent()` to decode URL-encoded values before creating the data-check-string in both HMAC-SHA256 and Ed25519 verification functions.

**Files Modified:**
- [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:127) - HMAC-SHA256 function
- [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:222) - Ed25519 function

**Expected Result:** After applying the fix, HMAC-SHA256 signature verification should succeed, and production authentication should work correctly.

**Next Steps:**
1. Rebuild Docker containers
2. Restart services
3. Test mini-app in Telegram environment
4. Verify authentication works correctly
