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
  signature?: string;
  user?: string;
  auth_date?: string;
  query_id?: string;
}

/**
 * Maximum age for auth_date in seconds (24 hours)
 */
const MAX_AUTH_AGE = 86400;

/**
 * Telegram Ed25519 public keys for signature verification
 * Source: https://docs.telegram-mini-apps.com/platform/init-data
 */
const TELEGRAM_PUBLIC_KEYS = {
  production: 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d',
  test: '40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec'
};

/**
 * Detects if we're in test environment
 */
const isTestEnvironment = process.env.NODE_ENV === 'development' || 
                           process.env.TELEGRAM_BOT_TOKEN?.startsWith('test') ||
                           process.env.TELEGRAM_BOT_TOKEN === 'test';

/**
 * Verifies Telegram initData signature using Ed25519 (new format)
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param signature - The base64url-encoded Ed25519 signature
 * @returns true if signature is valid, false otherwise
 */
function verifyEd25519Signature(initData: string, signature: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] Verifying Ed25519 signature (new format)');
    
    // Parse initData parameters
    const params: InitDataParams = {};
    const pairs = initData.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Create data-check-string: all parameters except 'hash' and 'signature', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:', dataCheckString);

    // Get the appropriate public key based on environment
    const publicKeyHex = isTestEnvironment ? TELEGRAM_PUBLIC_KEYS.test : TELEGRAM_PUBLIC_KEYS.production;
    
    // Convert hex public key to Buffer
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    logger.debug('[AUTH DEBUG] Using public key (first 40 chars):', publicKeyHex.substring(0, 40) + '...');

    // Decode base64url signature to Buffer
    const signatureBuffer = Buffer.from(signature, 'base64url');
    logger.debug('[AUTH DEBUG] Signature buffer length:', signatureBuffer.length);

    // Convert data-check-string to Buffer
    const dataBuffer = Buffer.from(dataCheckString, 'utf-8');
    logger.debug('[AUTH DEBUG] Data buffer length:', dataBuffer.length);

    // Verify Ed25519 signature
    // Note: Node.js crypto module doesn't have built-in Ed25519 support
    // We need to use the 'ed25519' package that was just installed
    const ed25519 = require('ed25519');
    
    const isValid = ed25519.verify(
      dataBuffer,
      signatureBuffer,
      publicKey
    );

    if (!isValid) {
      logger.error('[AUTH DEBUG] Ed25519 signature verification failed');
    } else {
      logger.debug('[AUTH DEBUG] Ed25519 signature verification successful');
    }

    return isValid;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying Ed25519 signature:', error);
    return false;
  }
}

/**
 * Verifies Telegram initData signature using HMAC-SHA256 (old format)
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param botToken - The bot token for HMAC verification
 * @returns true if signature is valid, false otherwise
 */
function verifyHmacSha256Signature(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] Verifying HMAC-SHA256 signature (old format)');
    logger.debug('[AUTH DEBUG] initData length:', initData.length);
    logger.debug('[AUTH DEBUG] initData preview:', initData.substring(0, 100) + '...');
    
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
      logger.error('[AUTH DEBUG] Missing hash in initData');
      return false;
    }
    
    logger.debug('[AUTH DEBUG] Hash present:', hash.substring(0, 20) + '...');

    // Create data-check-string: all parameters except 'hash', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:', dataCheckString);

    // Calculate secret key from bot token
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    logger.debug('[AUTH DEBUG] Secret key calculated from bot token');

    // Calculate HMAC-SHA256
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    logger.debug('[AUTH DEBUG] Calculated HMAC:', hmac.substring(0, 20) + '...');
    logger.debug('[AUTH DEBUG] Expected hash:', hash.substring(0, 20) + '...');

    // Compare hashes using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isValid) {
      logger.error('[AUTH DEBUG] HMAC signature verification failed - hashes do not match');
    } else {
      logger.debug('[AUTH DEBUG] HMAC signature verification successful');
    }

    return isValid;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying HMAC signature:', error);
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
    logger.debug('[AUTH DEBUG] Validating auth_date:', authDate);
    
    const timestamp = parseInt(authDate, 10);
    if (isNaN(timestamp)) {
      logger.error('[AUTH DEBUG] Invalid auth_date format');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;

    logger.debug('[AUTH DEBUG] Current timestamp:', now);
    logger.debug('[AUTH DEBUG] Auth timestamp:', timestamp);
    logger.debug('[AUTH DEBUG] Age:', age, 'seconds');
    logger.debug('[AUTH DEBUG] Max age:', MAX_AUTH_AGE, 'seconds');

    if (age < 0) {
      logger.error('[AUTH DEBUG] auth_date is in the future');
      return false;
    }

    if (age > MAX_AUTH_AGE) {
      logger.error(`[AUTH DEBUG] auth_date is too old: ${age} seconds`);
      return false;
    }

    logger.debug('[AUTH DEBUG] auth_date validation successful');
    return true;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error validating auth_date:', error);
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
    logger.debug('[AUTH DEBUG] Parsing user data');
    
    const decoded = decodeURIComponent(userParam);
    const user: TelegramUser = JSON.parse(decoded);
    
    logger.debug('[AUTH DEBUG] Parsed user:', JSON.stringify(user, null, 2));
    
    if (!user.id) {
      logger.error('[AUTH DEBUG] Missing user.id in user data');
      return null;
    }

    logger.debug('[AUTH DEBUG] User data parsed successfully, user.id:', user.id);
    return user;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error parsing user data:', error);
    return null;
  }
}

/**
 * Middleware to authenticate Telegram users using initData verification
 * 
 * This middleware:
 * 1. Extracts initData from headers or query parameters
 * 2. Verifies signature using Ed25519 (new) or HMAC-SHA256 (old)
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
    logger.debug('[AUTH DEBUG] ==================== Authentication Request ====================');
    logger.debug('[AUTH DEBUG] Request URL:', req.url);
    logger.debug('[AUTH DEBUG] Request method:', req.method);
    logger.debug('[AUTH DEBUG] Environment:', process.env.NODE_ENV);
    
    // Extract initData from headers or query parameters
    let initData = req.headers['x-telegram-init-data'] as string;
    
    logger.debug('[AUTH DEBUG] Checking X-Telegram-Init-Data header:', !!initData);
    
    if (!initData) {
      initData = req.query.initData as string;
      logger.debug('[AUTH DEBUG] Checking initData query param:', !!initData);
    }

    if (!initData) {
      logger.warn('[AUTH DEBUG] Missing Telegram init data in request');
      logger.warn('[AUTH DEBUG] Available headers:', Object.keys(req.headers));
      logger.warn('[AUTH DEBUG] Available query params:', Object.keys(req.query));
      res.status(401).json({ 
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA'
      });
      return;
    }
    
    logger.debug('[AUTH DEBUG] initData found, length:', initData.length);

    // Parse initData parameters
    const params = new URLSearchParams(initData);
    const signature = params.get('signature');
    const hash = params.get('hash');
    const userParam = params.get('user');
    const authDate = params.get('auth_date');

    logger.debug('[AUTH DEBUG] signature parameter present:', !!signature);
    logger.debug('[AUTH DEBUG] hash parameter present:', !!hash);
    logger.debug('[AUTH DEBUG] user parameter present:', !!userParam);
    logger.debug('[AUTH DEBUG] auth_date parameter present:', !!authDate);

    // Verify signature based on format
    let isSignatureValid = false;
    
    if (signature) {
      // New format: Ed25519 signature
      logger.debug('[AUTH DEBUG] Using Ed25519 signature verification (new format)');
      isSignatureValid = verifyEd25519Signature(initData, signature);
    } else if (hash) {
      // Old format: HMAC-SHA256 signature
      logger.debug('[AUTH DEBUG] Using HMAC-SHA256 signature verification (old format)');
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      logger.debug('[AUTH DEBUG] Checking TELEGRAM_BOT_TOKEN environment variable:', !!botToken);
      
      if (!botToken) {
        logger.error('[AUTH DEBUG] TELEGRAM_BOT_TOKEN environment variable is not set');
        logger.error('[AUTH DEBUG] This is a critical configuration error - authentication cannot work without bot token');
        res.status(500).json({ 
          error: 'Server configuration error',
          code: 'MISSING_BOT_TOKEN'
        });
        return;
      }
      
      logger.debug('[AUTH DEBUG] Bot token present, length:', botToken.length);
      isSignatureValid = verifyHmacSha256Signature(initData, botToken);
    } else {
      logger.error('[AUTH DEBUG] Missing both signature and hash parameters');
      res.status(401).json({ 
        error: 'Unauthorized: Missing signature',
        code: 'MISSING_SIGNATURE'
      });
      return;
    }

    if (!isSignatureValid) {
      logger.warn('[AUTH DEBUG] Invalid Telegram init data signature');
      res.status(401).json({ 
        error: 'Unauthorized: Invalid signature',
        code: 'INVALID_SIGNATURE'
      });
      return;
    }

    // Validate auth_date to prevent replay attacks
    if (authDate) {
      const isAuthDateValid = validateAuthDate(authDate);
      if (!isAuthDateValid) {
        logger.warn('[AUTH DEBUG] Invalid or expired auth_date in init data');
        res.status(401).json({ 
          error: 'Unauthorized: Expired authentication data',
          code: 'EXPIRED_AUTH_DATA'
        });
        return;
      }
    }

    // Parse user data
    if (!userParam) {
      logger.warn('[AUTH DEBUG] Missing user parameter in init data');
      logger.warn('[AUTH DEBUG] Available parameters:', Array.from(params.keys()));
      res.status(401).json({ 
        error: 'Unauthorized: Missing user data',
        code: 'MISSING_USER_DATA'
      });
      return;
    }

    const user = parseUserData(userParam);
    if (!user) {
      logger.warn('[AUTH DEBUG] Invalid user data in init data');
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

    logger.debug('[AUTH DEBUG] ==================== Authentication Successful ====================');
    logger.debug(`[AUTH DEBUG] Successfully authenticated user ${user.id} from Telegram WebApp`);
    logger.debug('[AUTH DEBUG] User details:', JSON.stringify(user, null, 2));
    next();
  } catch (error) {
    logger.error('[AUTH DEBUG] Authentication error:', error);
    res.status(401).json({ 
      error: 'Unauthorized: Authentication failed',
      code: 'AUTHENTICATION_FAILED'
    });
  }
}
