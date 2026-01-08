import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '@/utils/logger';

/**
 * Telegram user data structure from initData
 */
export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * Extended request interface with Telegram authentication data
 */
export interface AuthenticatedRequest extends Request {
  telegramUser?: {
    userId: number;
    user?: TelegramUser;
    initData: string;
  };
}

/**
 * Parsed initData parameters
 */
interface InitDataParams {
  [key: string]: string | undefined;
  hash?: string;
  user?: string;
  auth_date?: string;
  query_id?: string;
}

/**
 * Maximum age for auth_date in seconds (24 hours)
 */
const MAX_AUTH_AGE = 86400;

/**
 * Verifies Telegram initData signature using HMAC-SHA256
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param botToken - The bot token for HMAC verification
 * @returns true if signature is valid, false otherwise
 */
function verifyInitDataSignature(initData: string, botToken: string): boolean {
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

    const hash = params.hash;
    if (!hash) {
      logger.error('Missing hash in initData');
      return false;
    }

    // Create data-check-string: all parameters except 'hash', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Calculate secret key from bot token
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // Calculate HMAC-SHA256
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isValid) {
      logger.error('HMAC signature verification failed');
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying initData signature:', error);
    return false;
  }
}

/**
 * Validates auth_date to prevent replay attacks
 * 
 * @param authDate - Unix timestamp from initData
 * @returns true if timestamp is valid, false otherwise
 */
function validateAuthDate(authDate: string): boolean {
  try {
    const timestamp = parseInt(authDate, 10);
    if (isNaN(timestamp)) {
      logger.error('Invalid auth_date format');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;

    if (age < 0) {
      logger.error('auth_date is in the future');
      return false;
    }

    if (age > MAX_AUTH_AGE) {
      logger.error(`auth_date is too old: ${age} seconds`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating auth_date:', error);
    return false;
  }
}

/**
 * Parses user data from initData
 * 
 * @param userParam - URL-encoded JSON string of user data
 * @returns Parsed TelegramUser object or null if invalid
 */
function parseUserData(userParam: string): TelegramUser | null {
  try {
    const decoded = decodeURIComponent(userParam);
    const user: TelegramUser = JSON.parse(decoded);
    
    if (!user.id) {
      logger.error('Missing user.id in user data');
      return null;
    }

    return user;
  } catch (error) {
    logger.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Middleware to authenticate Telegram users using initData verification
 * 
 * This middleware:
 * 1. Extracts initData from headers or query parameters
 * 2. Verifies HMAC signature using bot token
 * 3. Validates timestamp to prevent replay attacks
 * 4. Extracts user_id and user data
 * 5. Adds authentication data to req.telegramUser
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function authenticateTelegramUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Extract initData from headers or query parameters
    let initData = req.headers['x-telegram-init-data'] as string;
    
    if (!initData) {
      initData = req.query.initData as string;
    }

    if (!initData) {
      logger.warn('Missing Telegram init data in request');
      res.status(401).json({ 
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA'
      });
      return;
    }

    // Verify HMAC signature
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      logger.error('TELEGRAM_BOT_TOKEN environment variable is not set');
      res.status(500).json({ 
        error: 'Server configuration error',
        code: 'MISSING_BOT_TOKEN'
      });
      return;
    }

    const isSignatureValid = verifyInitDataSignature(initData, botToken);
    if (!isSignatureValid) {
      logger.warn('Invalid Telegram init data signature');
      res.status(401).json({ 
        error: 'Unauthorized: Invalid signature',
        code: 'INVALID_SIGNATURE'
      });
      return;
    }

    // Parse initData parameters
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const authDate = params.get('auth_date');

    // Validate auth_date to prevent replay attacks
    if (authDate) {
      const isAuthDateValid = validateAuthDate(authDate);
      if (!isAuthDateValid) {
        logger.warn('Invalid or expired auth_date in init data');
        res.status(401).json({ 
          error: 'Unauthorized: Expired authentication data',
          code: 'EXPIRED_AUTH_DATA'
        });
        return;
      }
    }

    // Parse user data
    if (!userParam) {
      logger.warn('Missing user parameter in init data');
      res.status(401).json({ 
        error: 'Unauthorized: Missing user data',
        code: 'MISSING_USER_DATA'
      });
      return;
    }

    const user = parseUserData(userParam);
    if (!user) {
      logger.warn('Invalid user data in init data');
      res.status(401).json({ 
        error: 'Unauthorized: Invalid user data',
        code: 'INVALID_USER_DATA'
      });
      return;
    }

    // Add authentication data to request
    req.telegramUser = {
      userId: user.id,
      user,
      initData
    };

    logger.debug(`Successfully authenticated user ${user.id} from Telegram WebApp`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Unauthorized: Authentication failed',
      code: 'AUTHENTICATION_FAILED'
    });
  }
}
