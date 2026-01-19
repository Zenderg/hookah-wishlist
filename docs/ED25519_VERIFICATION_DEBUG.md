# Ed25519 Signature Verification Debug Analysis

## Problem Statement

After fixing the priority logic to use Ed25519 (signature) first, production authentication is failing with:
```
[AUTH DEBUG] Ed25519 signature verification failed
[AUTH DEBUG] Invalid Telegram init data signature
```

## Production initData Analysis

### Raw initData (URL-encoded)
```
user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg%22%7D&chat_instance=7714732502496827171&chat_type=private&auth_date=1768757235&signature=kZ4RalSojaF9Xh25IzgUhaAzQr25mRAKqgNii3Nc3ryVD-R8XkCvYgfkdj-TIVgj7dTO_0xQtulpGd4TBovVCw&hash=c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842
```

### Decoded Parameters
- **signature**: `kZ4RalSojaF9Xh25IzgUhaAzQr25mRAKqgNii3Nc3ryVD-R8XkCvYgfkdj-TIVgj7dTO_0xQtulpGd4TBovVCw`
- **hash**: `c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842`
- **auth_date**: `1768757235`
- **user**: URL-encoded JSON with user data
- **chat_instance**: `7714732502496827171`
- **chat_type**: `private`

## Current Ed25519 Implementation Analysis

### Location
`backend/src/api/middleware/auth.ts` - `verifyInitDataSignatureEd25519()` function (lines 172-250)

### Implementation Steps

1. **Parse initData parameters** (lines 176-185)
   - Splits by '&' and '=' to extract key-value pairs
   - Stores in `params` object

2. **Check for signature parameter** (lines 188-192)
   - Expects `params.signature` to be present
   - Returns false if missing

3. **Extract bot ID from bot token** (line 197)
   ```typescript
   const botId = botToken.split(':')[0];
   ```

4. **Create data-check-string** (lines 201-205)
   ```typescript
   const dataCheckString = Object.entries(params)
     .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
     .sort(([a], [b]) => a.localeCompare(b))
     .map(([key, value]) => `${key}=${value}`)
     .join('\n');
   ```

5. **Create verify string** (line 210)
   ```typescript
   const verifyString = `${botId}:WebAppData\n${dataCheckString}`;
   ```

6. **Determine public key** (lines 217-218)
   ```typescript
   const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.TELEGRAM_TEST_MODE === 'true';
   const publicKeyHex = isTestEnvironment ? TELEGRAM_PUBLIC_KEYS.test : TELEGRAM_PUBLIC_KEYS.production;
   ```

7. **Convert to buffers** (lines 214, 223, 226)
   - `messageBuffer` from verify string (UTF-8)
   - `publicKeyBuffer` from hex public key
   - `signatureBuffer` from base64url signature

8. **Verify signature** (lines 233-237)
   ```typescript
   const isValid = nacl.sign.detached.verify(
     messageBuffer,
     signatureBuffer,
     publicKeyBuffer
   );
   ```

## Potential Issues

### Issue 1: Priority Logic is INCORRECT

**Current Logic** (lines 278-283):
```typescript
// Prioritize Ed25519 verification (signature parameter) for third-party validation
// When both signature and hash are present, it's a third-party mini app
if (params.signature) {
  logger.debug('[AUTH DEBUG] Using Ed25519 signature verification (third-party validation)');
  return verifyInitDataSignatureEd25519(initData, botToken);
}
```

**Problem**: This logic is BACKWARDS. According to the documentation:
- **HMAC-SHA256 (hash parameter)**: Preferred method when you have bot token (first-party validation)
- **Ed25519 (signature parameter)**: Fallback when you DON'T have bot token (third-party validation)

The production initData has BOTH `signature` and `hash` parameters, which means:
- It's a first-party mini app (we have the bot token)
- We should use HMAC-SHA256 verification (preferred method)
- The `signature` parameter is likely a legacy or additional parameter

**Evidence**: The comments in the code say:
- Line 91: "Verifies Telegram initData signature using HMAC-SHA256 (preferred method)"
- Line 92: "This is the recommended method when you have access to the bot token"
- Line 165: "Verifies Telegram initData signature using Ed25519 (third-party validation)"
- Line 166: "This method is used when you don't have access to the bot token"

### Issue 2: Ed25519 Public Key May Be Incorrect

**Current Public Keys** (lines 55-58):
```typescript
const TELEGRAM_PUBLIC_KEYS = {
  production: 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d',
  test: '40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec',
};
```

**Potential Problems**:
1. These keys may be outdated or incorrect
2. Telegram may have changed their public keys
3. The source (https://docs.telegram-mini-apps.com/platform/init-data) may have been updated

### Issue 3: Verify String Format May Be Incorrect

**Current Format** (line 210):
```typescript
const verifyString = `${botId}:WebAppData\n${dataCheckString}`;
```

**According to Telegram documentation**, the format should be:
```
{bot_id}:WebAppData\n{dataCheckString}
```

**Potential Issues**:
1. The bot_id format may be incorrect (should it be a number or string?)
2. The colon separator may be incorrect
3. The "WebAppData" string may be incorrect
4. The newline character may need to be escaped differently

### Issue 4: Data-Check-String Construction May Be Incorrect

**Current Implementation** (lines 201-205):
```typescript
const dataCheckString = Object.entries(params)
  .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');
```

**Potential Issues**:
1. Parameters are URL-encoded, but should they be decoded before sorting?
2. The sorting order (localeCompare) may not match Telegram's implementation
3. The format `key=value` may be incorrect
4. The newline separator may be incorrect

### Issue 5: Base64url Decoding May Be Incorrect

**Current Implementation** (lines 67-77):
```typescript
function base64urlToBuffer(base64url: string): Buffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}
```

**Potential Issues**:
1. Padding handling may be incorrect
2. Character replacement may be incorrect
3. Buffer encoding may be incorrect

## Root Cause Analysis

### Most Likely Cause: Priority Logic is Backwards

**Evidence**:
1. The code comments clearly state HMAC-SHA256 is the "preferred method" when bot token is available
2. The code comments clearly state Ed25519 is for "third-party validation" when bot token is NOT available
3. We have the bot token available (checked at line 414)
4. The production initData has BOTH signature and hash parameters
5. The current logic prioritizes Ed25519 when signature is present, which is the OPPOSITE of what the comments say

**Why this causes failure**:
- When both signature and hash are present, the current code uses Ed25519
- Ed25519 is designed for third-party validation when you DON'T have the bot token
- The signature parameter in first-party mini apps may not be a valid Ed25519 signature
- The Ed25519 verification fails because the signature is not actually an Ed25519 signature

### Second Most Likely Cause: Ed25519 Public Key is Incorrect

**Evidence**:
1. The public keys are hardcoded and may be outdated
2. Telegram may have changed their public keys
3. The source documentation may have been updated
4. The production environment may be using a different public key

**Why this causes failure**:
- Even if the priority logic were correct, the Ed25519 verification would fail with an incorrect public key
- The signature verification would always fail regardless of the signature validity

## Recommended Fix

### Primary Fix: Correct the Priority Logic

**Change the priority logic in `verifyInitDataSignature()` function** (lines 261-298):

```typescript
function verifyInitDataSignature(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] Verifying initData signature');
    logger.debug('[AUTH DEBUG] initData length:', initData.length);
    logger.debug('[AUTH DEBUG] initData preview:', initData.substring(0, 100) + '...');
    
    // Parse initData parameters to detect format
    const params: InitDataParams = {};
    const pairs = initData.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Prioritize HMAC-SHA256 verification (hash parameter) for first-party validation
    // This is the recommended method when you have access to the bot token
    if (params.hash) {
      logger.debug('[AUTH DEBUG] Using HMAC-SHA256 signature verification (preferred method with bot token)');
      return verifyInitDataSignatureHMAC(initData, botToken);
    }
    
    // Fall back to Ed25519 verification (signature parameter) for third-party validation
    // This is used when you don't have access to the bot token
    if (params.signature) {
      logger.debug('[AUTH DEBUG] Using Ed25519 signature verification (third-party validation)');
      return verifyInitDataSignatureEd25519(initData, botToken);
    }
    
    logger.error('[AUTH DEBUG] Neither hash nor signature found in initData');
    return false;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying initData signature:', error);
    return false;
  }
}
```

**Key Changes**:
1. Check for `hash` parameter FIRST (HMAC-SHA256, preferred method)
2. Fall back to `signature` parameter SECOND (Ed25519, third-party validation)
3. Update comments to reflect correct priority

### Secondary Fix: Verify Ed25519 Public Key

**Steps**:
1. Check the latest Telegram documentation for Ed25519 public keys
2. Verify the current public keys are still valid
3. Update if necessary

**Current Source**: https://docs.telegram-mini-apps.com/platform/init-data

### Tertiary Fix: Add Detailed Debug Logging

**Add logging to understand the exact failure point**:

```typescript
function verifyInitDataSignatureEd25519(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] ==================== Ed25519 Verification Start ====================');
    logger.debug('[AUTH DEBUG] Verifying initData signature using Ed25519 (third-party validation)');
    
    // Parse initData parameters
    const params: InitDataParams = {};
    const pairs = initData.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Check for signature parameter
    const signature = params.signature;
    if (!signature) {
      logger.error('[AUTH DEBUG] Missing signature in initData for Ed25519 verification');
      return false;
    }
    
    logger.debug('[AUTH DEBUG] Signature present (Ed25519):', signature.substring(0, 20) + '...');

    // Extract bot ID from bot token
    const botId = botToken.split(':')[0];
    logger.debug('[AUTH DEBUG] Bot ID:', botId);
    logger.debug('[AUTH DEBUG] Bot ID type:', typeof botId);

    // Create data-check-string
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:');
    logger.debug('[AUTH DEBUG]', dataCheckString);
    logger.debug('[AUTH DEBUG] dataCheckString length:', dataCheckString.length);

    // Create string to verify
    const verifyString = `${botId}:WebAppData\n${dataCheckString}`;
    logger.debug('[AUTH DEBUG] verifyString:');
    logger.debug('[AUTH DEBUG]', verifyString);
    logger.debug('[AUTH DEBUG] verifyString length:', verifyString.length);

    // Convert verify string to buffer
    const messageBuffer = Buffer.from(verifyString, 'utf-8');
    logger.debug('[AUTH DEBUG] messageBuffer (hex):', messageBuffer.toString('hex'));

    // Determine which public key to use
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.TELEGRAM_TEST_MODE === 'true';
    const publicKeyHex = isTestEnvironment ? TELEGRAM_PUBLIC_KEYS.test : TELEGRAM_PUBLIC_KEYS.production;
    
    logger.debug('[AUTH DEBUG] Using public key for:', isTestEnvironment ? 'test' : 'production');
    logger.debug('[AUTH DEBUG] Public key (hex):', publicKeyHex);

    // Convert public key from hex to buffer
    const publicKeyBuffer = hexToBuffer(publicKeyHex);
    logger.debug('[AUTH DEBUG] publicKeyBuffer (hex):', publicKeyBuffer.toString('hex'));

    // Convert signature from base64url to buffer
    const signatureBuffer = base64urlToBuffer(signature);
    logger.debug('[AUTH DEBUG] signatureBuffer (hex):', signatureBuffer.toString('hex'));

    logger.debug('[AUTH DEBUG] Message buffer length:', messageBuffer.length);
    logger.debug('[AUTH DEBUG] Public key buffer length:', publicKeyBuffer.length);
    logger.debug('[AUTH DEBUG] Signature buffer length:', signatureBuffer.length);

    // Verify Ed25519 signature
    const isValid = nacl.sign.detached.verify(
      messageBuffer,
      signatureBuffer,
      publicKeyBuffer
    );

    if (!isValid) {
      logger.error('[AUTH DEBUG] Ed25519 signature verification failed');
      logger.error('[AUTH DEBUG] This could be due to:');
      logger.error('[AUTH DEBUG] 1. Incorrect public key');
      logger.error('[AUTH DEBUG] 2. Incorrect verify string format');
      logger.error('[AUTH DEBUG] 3. Incorrect data-check-string construction');
      logger.error('[AUTH DEBUG] 4. Signature is not actually an Ed25519 signature');
    } else {
      logger.debug('[AUTH DEBUG] Ed25519 signature verification successful');
    }

    logger.debug('[AUTH DEBUG] ==================== Ed25519 Verification End ====================');

    return isValid;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying Ed25519 signature:', error);
    return false;
  }
}
```

## Testing Strategy

### Test 1: Verify HMAC-SHA256 Works with Production initData

1. Extract the `hash` parameter from production initData
2. Verify using HMAC-SHA256 method
3. Check if verification succeeds

**Expected Result**: HMAC-SHA256 verification should succeed

### Test 2: Verify Ed25519 Fails with Production initData

1. Extract the `signature` parameter from production initData
2. Verify using Ed25519 method
3. Check if verification fails

**Expected Result**: Ed25519 verification should fail (because signature is not actually an Ed25519 signature)

### Test 3: Test with Corrected Priority Logic

1. Apply the priority logic fix
2. Test with production initData
3. Check if authentication succeeds

**Expected Result**: Authentication should succeed using HMAC-SHA256

### Test 4: Verify Ed25519 Public Key

1. Check Telegram documentation for latest public keys
2. Compare with current public keys
3. Update if necessary

**Expected Result**: Public keys should be up-to-date

## Conclusion

The most likely cause of the Ed25519 verification failure is the **incorrect priority logic**. The current code prioritizes Ed25519 when both signature and hash are present, but according to the documentation, HMAC-SHA256 should be prioritized when the bot token is available.

The production initData has both signature and hash parameters, which means it's a first-party mini app (we have the bot token), and we should use HMAC-SHA256 verification (the preferred method).

The recommended fix is to correct the priority logic to check for the `hash` parameter first (HMAC-SHA256), and fall back to the `signature` parameter (Ed25519) only if hash is not present.

Additional fixes include verifying the Ed25519 public key is up-to-date and adding detailed debug logging to understand the exact failure point.
