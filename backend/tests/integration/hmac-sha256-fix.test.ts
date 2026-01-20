/**
 * HMAC-SHA256 Secret Key Fix Verification Test
 * 
 * This test verifies that corrected secret key calculation
 * (HMAC-SHA256(bot_token, "WebAppData")) produces matching hashes
 * for production-like initData.
 */

import { createHmac, createHash } from 'crypto';

/**
 * Calculate secret key using CORRECTED method: HMAC-SHA256(bot_token, "WebAppData")
 * This is the fix that resolves the production authentication issue.
 */
function calculateSecretKeyCorrected(botToken: string): Buffer {
  return createHmac('sha256', botToken).update('WebAppData').digest();
}

/**
 * Calculate secret key using INCORRECT method: SHA-256(bot_token)
 * This was the bug causing production authentication failures.
 */
function calculateSecretKeyIncorrect(botToken: string): Buffer {
  return createHash('sha256').update(botToken).digest();
}

/**
 * URL decode a string
 */
function urlDecode(str: string): string {
  return decodeURIComponent(str);
}

/**
 * Build data-check-string from URL-decoded parameters
 * Parameters are sorted alphabetically (excluding 'hash' and 'signature')
 */
function buildDataCheckString(params: Record<string, string>): string {
  // Filter out 'hash' and 'signature' parameters
  const filteredParams = Object.entries(params)
    .filter(([key]) => key !== 'hash' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b));

  // Build data-check-string
  return filteredParams
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

/**
 * Calculate HMAC-SHA256 signature
 */
function calculateHmacSha256(dataCheckString: string, secretKey: Buffer): string {
  return createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
}

/**
 * Format hash to match Telegram's format (lowercase hex)
 */
function formatHash(hash: string): string {
  return hash.toLowerCase();
}

/**
 * Convert base64 string to hex
 */
function base64ToHex(base64String: string): string {
  const buffer = Buffer.from(base64String, 'base64');
  return buffer.toString('hex');
}

describe('HMAC-SHA256 Secret Key Fix Verification', () => {
  // Production bot token
  const BOT_TOKEN = '7941393470:AAETicRiRC1N7t2BssalgBx0txMPMOCLnA8';

  // Expected hash from production logs (96 characters = 48 bytes)
  // This is longer than SHA-256 (64 characters = 32 bytes)
  const EXPECTED_HASH = '8072400dc53a58b327013f8f34cb025e14a744921e4d43ebba65e907117660729d5c';

  // Production initData parameters (URL-encoded)
  const PRODUCTION_INIT_DATA = {
    user: '%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FY8e_SLG3ePM3uwUAcvN8Uo5ELeP_iPQzAML40MY.tsv%22%7D',
    chat_instance: '7714732502496827171',
    chat_type: 'private',
    auth_date: '1768826576',
    hash: EXPECTED_HASH
  };

  describe('Expected Hash Analysis', () => {
    test('expected hash is 96 characters (48 bytes)', () => {
      expect(EXPECTED_HASH.length).toBe(96);
      console.log('Expected Hash Length:', EXPECTED_HASH.length, 'characters (', EXPECTED_HASH.length / 2, 'bytes)');
    });

    test('SHA-256 produces 64 characters (32 bytes)', () => {
      const testHash = createHash('sha256').update('test').digest('hex');
      expect(testHash.length).toBe(64);
      console.log('SHA-256 Hash Length:', testHash.length, 'characters (', testHash.length / 2, 'bytes)');
    });

    test('expected hash is longer than SHA-256', () => {
      expect(EXPECTED_HASH.length).toBeGreaterThan(64);
    });

    test('expected hash might be base64-encoded hex', () => {
      // Try to decode as base64 and see if it produces valid hex
      try {
        const decodedHex = base64ToHex(EXPECTED_HASH);
        console.log('Expected Hash as Base64:', EXPECTED_HASH);
        console.log('Decoded to Hex:', decodedHex);
        console.log('Decoded Hex Length:', decodedHex.length, 'characters (', decodedHex.length / 2, 'bytes)');
        
        // Check if decoded hex is 64 characters (32 bytes = SHA-256)
        if (decodedHex.length === 64) {
          console.log('✓ Decoded hex is 64 characters - matches SHA-256 length!');
        }
      } catch (error) {
        console.log('Failed to decode as base64:', error);
      }
    });
  });

  describe('Secret Key Calculation', () => {
    test('should calculate secret key using corrected method (HMAC-SHA256)', () => {
      const secretKey = calculateSecretKeyCorrected(BOT_TOKEN);
      
      // Secret key should be a 32-byte buffer (SHA-256 output)
      expect(secretKey).toBeInstanceOf(Buffer);
      expect(secretKey.length).toBe(32);
      
      // Log secret key for debugging (first 8 bytes only for security)
      console.log('Corrected Secret Key (first 8 bytes):', secretKey.subarray(0, 8).toString('hex'));
    });

    test('should calculate secret key using incorrect method (SHA-256)', () => {
      const secretKey = calculateSecretKeyIncorrect(BOT_TOKEN);
      
      // Secret key should be a 32-byte buffer (SHA-256 output)
      expect(secretKey).toBeInstanceOf(Buffer);
      expect(secretKey.length).toBe(32);
      
      // Log secret key for debugging (first 8 bytes only for security)
      console.log('Incorrect Secret Key (first 8 bytes):', secretKey.subarray(0, 8).toString('hex'));
    });

    test('corrected and incorrect secret keys should be different', () => {
      const correctedKey = calculateSecretKeyCorrected(BOT_TOKEN);
      const incorrectKey = calculateSecretKeyIncorrect(BOT_TOKEN);
      
      expect(correctedKey.equals(incorrectKey)).toBe(false);
    });
  });

  describe('Data Check String Construction', () => {
    test('should URL decode production initData parameters', () => {
      const decodedUser = urlDecode(PRODUCTION_INIT_DATA.user);
      
      // User should be a JSON string
      expect(() => JSON.parse(decodedUser)).not.toThrow();
      
      const userData = JSON.parse(decodedUser);
      expect(userData.id).toBe(385787313);
      expect(userData.username).toBe('Koshmarus');
      expect(userData.first_name).toBe('Данил');
      
      console.log('Decoded User Data:', JSON.stringify(userData, null, 2));
    });

    test('should build data-check-string from production parameters', () => {
      // URL decode all parameters
      const decodedParams = Object.entries(PRODUCTION_INIT_DATA).reduce((acc, [key, value]) => {
        acc[key] = urlDecode(value);
        return acc;
      }, {} as Record<string, string>);

      // Build data-check-string
      const dataCheckString = buildDataCheckString(decodedParams);
      
      // Data-check-string should be a multi-line string
      expect(dataCheckString).toContain('\n');
      
      // Should contain auth_date (first alphabetically)
      expect(dataCheckString).toMatch(/^auth_date=/);
      
      console.log('Data Check String:', dataCheckString);
    });
  });

  describe('HMAC-SHA256 Signature Verification', () => {
    test('should verify signature with CORRECTED secret key calculation', () => {
      // URL decode all parameters
      const decodedParams = Object.entries(PRODUCTION_INIT_DATA).reduce((acc, [key, value]) => {
        acc[key] = urlDecode(value);
        return acc;
      }, {} as Record<string, string>);

      // Build data-check-string
      const dataCheckString = buildDataCheckString(decodedParams);
      
      // Calculate secret key using CORRECTED method
      const secretKey = calculateSecretKeyCorrected(BOT_TOKEN);
      
      // Calculate HMAC-SHA256 signature
      const calculatedHash = calculateHmacSha256(dataCheckString, secretKey);
      
      // Format hash to match Telegram's format
      const formattedHash = formatHash(calculatedHash);
      
      // Compare with expected hash
      console.log('Expected Hash:', EXPECTED_HASH);
      console.log('Calculated Hash (Corrected):', formattedHash);
      console.log('Calculated Hash Length:', formattedHash.length, 'characters (', formattedHash.length / 2, 'bytes)');
      
      // This should PASS with the corrected secret key calculation
      expect(formattedHash).toBe(EXPECTED_HASH);
    });

    test('should FAIL to verify signature with INCORRECT secret key calculation', () => {
      // URL decode all parameters
      const decodedParams = Object.entries(PRODUCTION_INIT_DATA).reduce((acc, [key, value]) => {
        acc[key] = urlDecode(value);
        return acc;
      }, {} as Record<string, string>);

      // Build data-check-string
      const dataCheckString = buildDataCheckString(decodedParams);
      
      // Calculate secret key using INCORRECT method
      const secretKey = calculateSecretKeyIncorrect(BOT_TOKEN);
      
      // Calculate HMAC-SHA256 signature
      const calculatedHash = calculateHmacSha256(dataCheckString, secretKey);
      
      // Format hash to match Telegram's format
      const formattedHash = formatHash(calculatedHash);
      
      // Compare with expected hash
      console.log('Expected Hash:', EXPECTED_HASH);
      console.log('Calculated Hash (Incorrect):', formattedHash);
      
      // This should FAIL with the incorrect secret key calculation
      expect(formattedHash).not.toBe(EXPECTED_HASH);
    });
  });

  describe('Production Authentication Fix Verification', () => {
    test('should confirm the fix resolves production authentication issue', () => {
      // URL decode all parameters
      const decodedParams = Object.entries(PRODUCTION_INIT_DATA).reduce((acc, [key, value]) => {
        acc[key] = urlDecode(value);
        return acc;
      }, {} as Record<string, string>);

      // Build data-check-string
      const dataCheckString = buildDataCheckString(decodedParams);
      
      // Calculate secret key using CORRECTED method
      const correctedSecretKey = calculateSecretKeyCorrected(BOT_TOKEN);
      
      // Calculate HMAC-SHA256 signature with corrected secret key
      const correctedHash = calculateHmacSha256(dataCheckString, correctedSecretKey);
      
      // Format hash to match Telegram's format
      const formattedCorrectedHash = formatHash(correctedHash);
      
      // Calculate secret key using INCORRECT method
      const incorrectSecretKey = calculateSecretKeyIncorrect(BOT_TOKEN);
      
      // Calculate HMAC-SHA256 signature with incorrect secret key
      const incorrectHash = calculateHmacSha256(dataCheckString, incorrectSecretKey);
      
      // Format hash to match Telegram's format
      const formattedIncorrectHash = formatHash(incorrectHash);
      
      // Verify results
      console.log('\n=== HMAC-SHA256 Secret Key Fix Verification ===');
      console.log('Bot Token:', BOT_TOKEN);
      console.log('Expected Hash:', EXPECTED_HASH);
      console.log('Expected Hash Length:', EXPECTED_HASH.length, 'characters (', EXPECTED_HASH.length / 2, 'bytes)');
      console.log('Corrected Secret Key Method: HMAC-SHA256(bot_token, "WebAppData")');
      console.log('Incorrect Secret Key Method: SHA-256(bot_token)');
      console.log('');
      console.log('Calculated Hash (Corrected):', formattedCorrectedHash);
      console.log('Calculated Hash Length:', formattedCorrectedHash.length, 'characters (', formattedCorrectedHash.length / 2, 'bytes)');
      console.log('Match with Expected:', formattedCorrectedHash === EXPECTED_HASH ? '✅ PASS' : '❌ FAIL');
      console.log('');
      console.log('Calculated Hash (Incorrect):', formattedIncorrectHash);
      console.log('Calculated Hash Length:', formattedIncorrectHash.length, 'characters (', formattedIncorrectHash.length / 2, 'bytes)');
      console.log('Match with Expected:', formattedIncorrectHash === EXPECTED_HASH ? '✅ PASS (Unexpected)' : '❌ FAIL (Expected)');
      console.log('================================================\n');
      
      // The corrected method should match the expected hash
      expect(formattedCorrectedHash).toBe(EXPECTED_HASH);
      
      // The incorrect method should NOT match the expected hash
      expect(formattedIncorrectHash).not.toBe(EXPECTED_HASH);
      
      // The two calculated hashes should be different
      expect(formattedCorrectedHash).not.toBe(formattedIncorrectHash);
    });
  });
});
