import crypto from 'node:crypto';
import logger from './logger.js';

export interface TelegramInitData {
  query_id?: string;
  user?: string;
  auth_date: string;
  hash: string;
  [key: string]: string | undefined;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
}

/**
 * Parse URL-encoded initData string into key-value pairs
 */
export function parseInitData(initData: string): Record<string, string> {
  logger.info('[TELEGRAM UTILS] parseInitData called', {
    initDataLength: initData.length,
  });

  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  logger.info('[TELEGRAM UTILS] Parsed initData', {
    keys: Object.keys(result),
    hasUser: !!result.user,
    hasHash: !!result.hash,
    hasAuthDate: !!result.auth_date,
  });

  return result;
}

/**
 * Validate HMAC-SHA256 hash using bot token
 * @throws Error if hash validation fails due to crypto errors
 */
export function validateHash(initData: Record<string, string>, botToken: string): boolean {
  logger.info('[TELEGRAM UTILS] validateHash called', {
    keys: Object.keys(initData),
    hasHash: !!initData.hash,
  });

  const { hash, ...data } = initData;

  // Create data check string by sorting keys alphabetically
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  logger.debug('[TELEGRAM UTILS] Data check string created', {
    length: dataCheckString.length,
    preview: dataCheckString.substring(0, 100) + '...',
  });

  try {
    // Create secret key from bot token
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    logger.debug('[TELEGRAM UTILS] Secret key created from bot token');

    // Calculate HMAC-SHA256 hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    logger.info('[TELEGRAM UTILS] Hash validation result', {
      providedHash: hash.substring(0, 20) + '...',
      calculatedHash: calculatedHash.substring(0, 20) + '...',
      matches: hash === calculatedHash,
    });

    return hash === calculatedHash;
  } catch (error) {
    // Re-throw crypto errors with context
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[TELEGRAM UTILS] Crypto error during hash validation', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Hash validation failed: ${errorMessage}`);
  }
}

/**
 * Check if auth_date is within acceptable time window (24 hours)
 * @throws Error if auth_date parsing fails
 */
export function validateAuthDate(authDate: string): boolean {
  logger.info('[TELEGRAM UTILS] validateAuthDate called', { authDate });

  try {
    const authTimestamp = parseInt(authDate, 10);

    if (isNaN(authTimestamp)) {
      throw new Error(`Invalid auth_date format: ${authDate}`);
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 hours in seconds
    const age = currentTimestamp - authTimestamp;

    logger.info('[TELEGRAM UTILS] Auth date validation', {
      authTimestamp,
      currentTimestamp,
      age,
      maxAge,
      valid: age <= maxAge,
    });

    return age <= maxAge;
  } catch (error) {
    // Re-throw parsing errors with context
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[TELEGRAM UTILS] Error validating auth_date', {
      error: errorMessage,
      authDate,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Auth date validation failed: ${errorMessage}`);
  }
}

/**
 * Parse and validate user data from initData
 * @throws Error if user data parsing fails
 */
export function parseAndValidateUser(userString: string): TelegramUser {
  logger.info('[TELEGRAM UTILS] parseAndValidateUser called', {
    userStringLength: userString.length,
  });

  try {
    const user: TelegramUser = JSON.parse(userString);

    logger.info('[TELEGRAM UTILS] Parsed user data', {
      id: user.id,
      firstName: user.first_name,
      username: user.username,
    });

    // Validate required fields
    if (!user.id || !user.first_name) {
      const error = new Error('Missing required fields in user data');
      logger.warn('[TELEGRAM UTILS] Invalid user data: missing required fields', {
        hasId: !!user.id,
        hasFirstName: !!user.first_name,
      });
      throw error;
    }

    logger.info('[TELEGRAM UTILS] User data validation passed');
    return user;
  } catch (error) {
    // Re-throw parsing errors with context
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[TELEGRAM UTILS] Error parsing user data', {
      error: errorMessage,
      userString: userString.substring(0, 100) + '...',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`User data parsing failed: ${errorMessage}`);
  }
}

/**
 * Complete validation of Telegram initData
 * @throws Error if any validation step fails
 */
export function validateInitData(
  initData: string,
  botToken: string
): { valid: boolean; user?: TelegramUser; error?: string } {
  logger.info('[TELEGRAM UTILS] validateInitData called', {
    initDataLength: initData.length,
  });

  try {
    // Parse initData
    const data = parseInitData(initData);

    // Check required fields
    if (!data.hash || !data.auth_date) {
      logger.warn('[TELEGRAM UTILS] Missing required fields', {
        hasHash: !!data.hash,
        hasAuthDate: !!data.auth_date,
      });
      return {
        valid: false,
        error: 'Missing required fields: hash or auth_date',
      };
    }

    logger.info('[TELEGRAM UTILS] Required fields present, validating auth_date');

    // Validate auth_date (will throw if parsing fails)
    if (!validateAuthDate(data.auth_date)) {
      logger.warn('[TELEGRAM UTILS] auth_date validation failed');
      return {
        valid: false,
        error: 'auth_date is too old (must be within 24 hours)',
      };
    }

    logger.info('[TELEGRAM UTILS] auth_date valid, validating hash');

    // Validate hash (will throw if crypto error occurs)
    if (!validateHash(data, botToken)) {
      logger.warn('[TELEGRAM UTILS] Hash validation failed');
      return {
        valid: false,
        error: 'Invalid hash signature',
      };
    }

    logger.info('[TELEGRAM UTILS] Hash valid, checking user data');

    // Parse and validate user data (will throw if parsing fails)
    if (!data.user) {
      logger.warn('[TELEGRAM UTILS] Missing user data');
      return {
        valid: false,
        error: 'Missing user data',
      };
    }

    const user = parseAndValidateUser(data.user);

    logger.info('[TELEGRAM UTILS] All validations passed', {
      userId: user.id,
      username: user.username,
    });

    return { valid: true, user };
  } catch (error) {
    // Catch and log any thrown errors from validation functions
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[TELEGRAM UTILS] Error validating initData', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      valid: false,
      error: errorMessage,
    };
  }
}
