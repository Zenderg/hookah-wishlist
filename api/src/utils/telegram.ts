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
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

/**
 * Validate HMAC-SHA256 hash using bot token
 */
export function validateHash(initData: Record<string, string>, botToken: string): boolean {
  try {
    const { hash, ...data } = initData;

    // Create data check string by sorting keys alphabetically
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    // Calculate HMAC-SHA256 hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hash === calculatedHash;
  } catch (error) {
    logger.error('Error validating Telegram hash', { error });
    return false;
  }
}

/**
 * Check if auth_date is within acceptable time window (24 hours)
 */
export function validateAuthDate(authDate: string): boolean {
  try {
    const authTimestamp = parseInt(authDate, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    return currentTimestamp - authTimestamp <= maxAge;
  } catch (error) {
    logger.error('Error validating auth_date', { error });
    return false;
  }
}

/**
 * Parse and validate user data from initData
 */
export function parseAndValidateUser(userString: string): TelegramUser | null {
  try {
    const user: TelegramUser = JSON.parse(userString);

    // Validate required fields
    if (!user.id || !user.first_name) {
      logger.warn('Invalid user data: missing required fields');
      return null;
    }

    return user;
  } catch (error) {
    logger.error('Error parsing user data', { error });
    return null;
  }
}

/**
 * Complete validation of Telegram initData
 */
export function validateInitData(
  initData: string,
  botToken: string
): { valid: boolean; user?: TelegramUser; error?: string } {
  try {
    // Parse initData
    const data = parseInitData(initData);

    // Check required fields
    if (!data.hash || !data.auth_date) {
      return {
        valid: false,
        error: 'Missing required fields: hash or auth_date',
      };
    }

    // Validate auth_date
    if (!validateAuthDate(data.auth_date)) {
      return {
        valid: false,
        error: 'auth_date is too old (must be within 24 hours)',
      };
    }

    // Validate hash
    if (!validateHash(data, botToken)) {
      return {
        valid: false,
        error: 'Invalid hash signature',
      };
    }

    // Parse and validate user data
    if (!data.user) {
      return {
        valid: false,
        error: 'Missing user data',
      };
    }

    const user = parseAndValidateUser(data.user);
    if (!user) {
      return {
        valid: false,
        error: 'Invalid user data format',
      };
    }

    return { valid: true, user };
  } catch (error) {
    logger.error('Error validating initData', { error });
    return {
      valid: false,
      error: 'Failed to validate initData',
    };
  }
}
