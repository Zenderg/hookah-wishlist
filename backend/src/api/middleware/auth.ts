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
 * Converts base64url string to hex string
 * 
 * @param base64url - Base64url encoded string
 * @returns Hex encoded string
 */
function base64urlToHex(base64url: string): string {
  // Replace base64url characters with standard base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Convert base64 to buffer, then to hex
  const buffer = Buffer.from(base64, 'base64');
  return buffer.toString('hex');
}

/**
 * Verifies Telegram initData signature using HMAC-SHA256
 * Supports both old format (hash in hex) and new format (signature in base64url)
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param botToken - The bot token for HMAC verification
 * @returns true if signature is valid, false otherwise
 */
function verifyInitDataSignature(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] Verifying initData signature');
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

    // Support both old format (hash) and new format (signature)
    const signature = params.signature || params.hash;
    if (!signature) {
      logger.error('[AUTH DEBUG] Missing signature/hash in initData');
      return false;
    }
    
    logger.debug('[AUTH DEBUG] Signature present:', signature.substring(0, 20) + '...');
    logger.debug('[AUTH DEBUG] Using signature format:', params.signature ? 'new (signature in base64url)' : 'old (hash in hex)');

    // Create data-check-string: all parameters except 'hash' and 'signature', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:', dataCheckString);

    // Calculate secret key from bot token
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    logger.debug('[AUTH DEBUG] Secret key calculated from bot token');

    // Calculate HMAC-SHA256 (always produces hex)
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    logger.debug('[AUTH DEBUG] Calculated HMAC (hex):', hmac.substring(0, 20) + '...');
    
    // Convert signature to hex if it's in base64url format
    let signatureHex: string;
    if (params.signature) {
      // New format: signature is base64url, convert to hex
      signatureHex = base64urlToHex(signature);
      logger.debug('[AUTH DEBUG] Converted signature from base64url to hex:', signatureHex.substring(0, 20) + '...');
    } else {
      // Old format: hash is already hex
      signatureHex = signature;
      logger.debug('[AUTH DEBUG] Using hash directly (already hex):', signatureHex.substring(0, 20) + '...');
    }

    logger.debug('[AUTH DEBUG] Expected signature (hex):', signatureHex.substring(0, 20) + '...');

    // Compare hashes using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(signatureHex, 'hex')
    );

    if (!isValid) {
      logger.error('[AUTH DEBUG] HMAC signature verification failed - signatures do not match');
      logger.debug('[AUTH DEBUG] Calculated:', hmac);
      logger.debug('[AUTH DEBUG] Expected:', signatureHex);
    } else {
      logger.debug('[AUTH DEBUG] HMAC signature verification successful');
    }

    return isValid;
  } catch (error) {
    logger.error('[AUTH DEBUG] Error verifying initData signature:', error);
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
 * 2. Verifies HMAC signature using bot token (supports both old and new format)
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

    // Verify HMAC signature
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

    const isSignatureValid = verifyInitDataSignature(initData, botToken);
    if (!isSignatureValid) {
      logger.warn('[AUTH DEBUG] Invalid Telegram init data signature');
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

    logger.debug('[AUTH DEBUG] user parameter present:', !!userParam);
    logger.debug('[AUTH DEBUG] auth_date parameter present:', !!authDate);

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
