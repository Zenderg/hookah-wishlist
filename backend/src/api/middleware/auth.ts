import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as nacl from 'tweetnacl';
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
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: string;
}

/**
 * Maximum age for auth_date in seconds (24 hours)
 */
const MAX_AUTH_AGE = 86400;

/**
 * Telegram Ed25519 public keys
 * Source: https://docs.telegram-mini-apps.com/platform/init-data
 */
const TELEGRAM_PUBLIC_KEYS = {
  production: 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d',
  test: '40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec',
};

/**
 * Converts base64url string to buffer
 * Handles padding as per Telegram documentation
 * 
 * @param base64url - Base64url encoded string
 * @returns Buffer
 */
function base64urlToBuffer(base64url: string): Buffer {
  // Replace base64url characters with standard base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed (Telegram may send invalid base64 without padding)
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return Buffer.from(base64, 'base64');
}

/**
 * Converts hex string to buffer
 * 
 * @param hex - Hex encoded string
 * @returns Buffer
 */
function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

/**
 * Verifies Telegram initData signature using Ed25519 (new format)
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param botToken - The bot token (used to extract bot ID)
 * @returns true if signature is valid, false otherwise
 */
function verifyInitDataSignatureEd25519(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] Verifying initData signature using Ed25519 (new format)');
    
    // Parse initData parameters
    const params: InitDataParams = {};
    const pairs = initData.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Check for signature parameter (new format)
    const signature = params.signature;
    if (!signature) {
      logger.error('[AUTH DEBUG] Missing signature in initData for Ed25519 verification');
      return false;
    }
    
    logger.debug('[AUTH DEBUG] Signature present (Ed25519):', signature.substring(0, 20) + '...');

    // Extract bot ID from bot token
    const botId = botToken.split(':')[0];
    logger.debug('[AUTH DEBUG] Bot ID:', botId);

    // Create data-check-string: all parameters except 'hash' and 'signature', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:', dataCheckString);

    // Create string to verify: "{bot_id}:WebAppData\n{dataCheckString}"
    const verifyString = `${botId}:WebAppData\n${dataCheckString}`;
    logger.debug('[AUTH DEBUG] verifyString:', verifyString);

    // Convert verify string to buffer
    const messageBuffer = Buffer.from(verifyString, 'utf-8');

    // Determine which public key to use
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.TELEGRAM_TEST_MODE === 'true';
    const publicKeyHex = isTestEnvironment ? TELEGRAM_PUBLIC_KEYS.test : TELEGRAM_PUBLIC_KEYS.production;
    
    logger.debug('[AUTH DEBUG] Using public key for:', isTestEnvironment ? 'test' : 'production');

    // Convert public key from hex to buffer
    const publicKeyBuffer = hexToBuffer(publicKeyHex);

    // Convert signature from base64url to buffer
    const signatureBuffer = base64urlToBuffer(signature);

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
function verifyInitDataSignatureHMAC(initData: string, botToken: string): boolean {
  try {
    logger.debug('[AUTH DEBUG] Verifying initData signature using HMAC-SHA256 (old format)');
    
    // Parse initData parameters
    const params: InitDataParams = {};
    const pairs = initData.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }

    // Check for hash parameter (old format)
    const hash = params.hash;
    if (!hash) {
      logger.error('[AUTH DEBUG] Missing hash in initData for HMAC verification');
      return false;
    }
    
    logger.debug('[AUTH DEBUG] Hash present (HMAC-SHA256):', hash.substring(0, 20) + '...');

    // Create data-check-string: all parameters except 'hash', sorted alphabetically
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && key !== 'signature' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    logger.debug('[AUTH DEBUG] dataCheckString:', dataCheckString);

    // Calculate secret key from bot token using HMAC-SHA256 with "WebAppData" as key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    logger.debug('[AUTH DEBUG] Secret key calculated from bot token');

    // Calculate HMAC-SHA256 of data-check-string using the secret key
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    logger.debug('[AUTH DEBUG] Calculated HMAC (hex):', hmac.substring(0, 20) + '...');
    logger.debug('[AUTH DEBUG] Expected hash (hex):', hash.substring(0, 20) + '...');

    // Compare hashes using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isValid) {
      logger.error('[AUTH DEBUG] HMAC signature verification failed - signatures do not match');
      logger.debug('[AUTH DEBUG] Calculated:', hmac);
      logger.debug('[AUTH DEBUG] Expected:', hash);
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
 * Verifies Telegram initData signature
 * Automatically detects and supports both old format (HMAC-SHA256 with hash) 
 * and new format (Ed25519 with signature)
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param botToken - The bot token for verification
 * @returns true if signature is valid, false otherwise
 */
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

    // Detect which verification method to use
    // New format: has 'signature' parameter (Ed25519)
    // Old format: has 'hash' parameter (HMAC-SHA256)
    if (params.signature) {
      logger.debug('[AUTH DEBUG] Detected new format: using Ed25519 signature verification');
      return verifyInitDataSignatureEd25519(initData, botToken);
    } else if (params.hash) {
      logger.debug('[AUTH DEBUG] Detected old format: using HMAC-SHA256 signature verification');
      return verifyInitDataSignatureHMAC(initData, botToken);
    } else {
      logger.error('[AUTH DEBUG] Neither signature nor hash found in initData');
      return false;
    }
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
 * 2. Verifies signature (supports both old HMAC-SHA256 and new Ed25519 formats)
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

    // Verify signature
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
