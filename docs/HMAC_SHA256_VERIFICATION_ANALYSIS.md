# HMAC-SHA256 Signature Verification Analysis

## Problem Statement

After fixing the priority logic to use HMAC-SHA256 (hash) first, production authentication is failing with:
```
[AUTH DEBUG] HMAC signature verification failed - signatures do not match
[AUTH DEBUG] This could be due to:
[AUTH DEBUG] 1. Incorrect bot token
[AUTH DEBUG] 2. Incorrect data-check-string construction
[AUTH DEBUG] 3. initData has been tampered with
```

## Production initData

```
user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg%22%7D&chat_instance=7714732502496827171&chat_type=private&auth_date=1768757235&signature=kZ4RalSojaF9Xh25IzgUhaAzQr25mRAKqgNii3Nc3ryVD-R8XkCvYgfkdj-TIVgj7dTO_0xQtulpGd4TBovVCw&hash=c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842
```

### Key Parameters

- **hash**: `c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842`
- **auth_date**: `1768757235`
- **signature**: `kZ4RalSojaF9Xh25IzgUhaAzQr25mRAKqgNii3Nc3ryVD-R8XkCvYgfkdj-TIVgj7dTO_0xQtulpGd4TBovVCw`
- **user**: URL-encoded JSON string
- **chat_instance**: `7714732502496827171`
- **chat_type**: `private`

## Current Implementation Analysis

### HMAC-SHA256 Verification Function

Location: [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:97-173)

```typescript
function verifyInitDataSignatureHMAC(initData: string, botToken: string): boolean {
  try {
    // Parse initData parameters
    const params: InitDataParams = {};
    const pairs = initData.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Check for hash parameter
    const hash = params.hash;
    if (!hash) {
      logger.error('[AUTH DEBUG] Missing hash in initData for HMAC verification');
      return false;
    }

    // Create data-check-string: all parameters except 'hash', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)  // ❌ BUG: Not decoding URL-encoded values
      .join('\n');

    // Calculate secret key from bot token using HMAC-SHA256 with "WebAppData" as key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    // Calculate HMAC-SHA256 of data-check-string using the secret key
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes using constant-time comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );

    return isValid;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying HMAC signature:', error);
    return false;
  }
}
```

## Root Cause Identified

### Critical Bug: URL Encoding Not Decoded

**Current Behavior (INCORRECT):**
The implementation keeps URL-encoded values in the data-check-string:
```typescript
.map(([key, value]) => `${key}=${value}`)
```

**Example of Current Data-Check-String (INCORRECT):**
```
auth_date=1768757235
chat_instance=7714732502496827171
chat_type=private
user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg%22%7D
```

**Expected Behavior (CORRECT):**
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

### Why This Causes Signature Mismatch

The HMAC-SHA256 signature is calculated by Telegram using the **URL-decoded** values. When our implementation uses URL-encoded values, the hash calculation produces a completely different result, causing the signature verification to fail.

**Example:**
- Telegram calculates HMAC-SHA256 of: `user={"id":385787313,...}` (decoded)
- Our implementation calculates HMAC-SHA256 of: `user=%7B%22id%22%3A385787313,...}` (encoded)
- Result: Different hashes → Signature verification fails

## Solution

### Fix: Decode URL-Encoded Values

Change line 127 in [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:127):

**BEFORE (INCORRECT):**
```typescript
.map(([key, value]) => `${key}=${value}`)
```

**AFTER (CORRECT):**
```typescript
.map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
```

### Complete Fixed Function

```typescript
function verifyInitDataSignatureHMAC(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] ==================== HMAC-SHA256 Verification Start ====================');
    logger.debug('[AUTH DEBUG] Verifying initData signature using HMAC-SHA256 (preferred method)');

    // Parse initData parameters
    const params: InitDataParams = {};
    const pairs = initData.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Check for hash parameter
    const hash = params.hash;
    if (!hash) {
      logger.error('[AUTH DEBUG] Missing hash in initData for HMAC verification');
      return false;
    }

    logger.debug('[AUTH DEBUG] Hash present (HMAC-SHA256):', hash.substring(0, 20) + '...');
    logger.debug('[AUTH DEBUG] Full hash (hex):', hash);

    // Create data-check-string: all parameters except 'hash', sorted alphabetically
    // IMPORTANT: URL-decode values before creating the string (per Telegram documentation)
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${decodeURIComponent(value)}`)  // ✅ FIX: Decode URL-encoded values
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:');
    logger.debug('[AUTH DEBUG]', dataCheckString);
    logger.debug('[AUTH DEBUG] dataCheckString length:', dataCheckString.length);

    // Calculate secret key from bot token using HMAC-SHA256 with "WebAppData" as key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    logger.debug('[AUTH DEBUG] Secret key calculated from bot token');
    logger.debug('[AUTH DEBUG] Secret key (hex):', secretKey.toString('hex'));

    // Calculate HMAC-SHA256 of data-check-string using the secret key
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    logger.debug('[AUTH DEBUG] Calculated HMAC (hex):', hmac);
    logger.debug('[AUTH DEBUG] Expected hash (hex):', hash);

    // Compare hashes using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isValid) {
      logger.error('[AUTH DEBUG] HMAC signature verification failed - signatures do not match');
      logger.error('[AUTH DEBUG] This could be due to:');
      logger.error('[AUTH DEBUG] 1. Incorrect bot token');
      logger.error('[AUTH DEBUG] 2. Incorrect data-check-string construction');
      logger.error('[AUTH DEBUG] 3. initData has been tampered with');
      logger.debug('[AUTH DEBUG] Calculated HMAC:', hmac);
      logger.debug('[AUTH DEBUG] Expected hash:', hash);
    } else {
      logger.debug('[AUTH DEBUG] HMAC signature verification successful');
    }

    logger.debug('[AUTH DEBUG] ==================== HMAC-SHA256 Verification End ====================');

    return isValid;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying HMAC signature:', error);
    return false;
  }
}
```

## Verification Steps

After applying the fix:

1. **Rebuild Docker containers** to apply the code change
2. **Restart services** to load the new code
3. **Test mini-app** in Telegram environment
4. **Check logs** to verify HMAC-SHA256 verification succeeds
5. **Verify authentication** works correctly

## Additional Considerations

### Bot Token Configuration

While the URL encoding issue is the primary cause, also verify:

- `TELEGRAM_BOT_TOKEN` environment variable is set in production
- Bot token is correct for this bot
- Bot token hasn't been regenerated or changed

### Ed25519 Verification

The Ed25519 verification function also needs the same fix. The data-check-string should use URL-decoded values.

**Update line 218 in [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:218):**

**BEFORE (INCORRECT):**
```typescript
.map(([key, value]) => `${key}=${value}`)
```

**AFTER (CORRECT):**
```typescript
.map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
```

## Summary

**Root Cause:** The HMAC-SHA256 verification function was using URL-encoded values in the data-check-string instead of URL-decoded values, as required by Telegram's official documentation.

**Impact:** This caused the calculated HMAC to differ from the expected hash, resulting in signature verification failure.

**Fix:** Add `decodeURIComponent()` to decode URL-encoded values before creating the data-check-string.

**Files to Modify:**
- [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:127) - HMAC-SHA256 function
- [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts:218) - Ed25519 function

**Expected Result:** After applying the fix, HMAC-SHA256 signature verification should succeed, and production authentication should work correctly.
