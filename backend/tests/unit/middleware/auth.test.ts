/**
 * Unit tests for authentication middleware
 */

import { authenticateTelegramUser, TelegramUser } from '@/api/middleware/auth';
import { createMockRequest, createMockResponse, testMiddleware } from '../../mocks/mockExpress';
import crypto from 'crypto';

describe('Authentication Middleware', () => {
  let mockBotToken: string;

  beforeEach(() => {
    // Set up environment variable for tests
    mockBotToken = 'test_bot_token_1234567890:ABCDEFghijklmnopQRSTUVWXYZ1234567890';
    process.env.TELEGRAM_BOT_TOKEN = mockBotToken;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  /**
   * Helper function to create valid initData with HMAC signature
   * This matches exactly how middleware parses and verifies initData
   * IMPORTANT: Uses URL-decoded values in data-check-string (per Telegram documentation)
   */
  const createValidInitData = (user: TelegramUser, authDate?: number): string => {
    const timestamp = authDate || Math.floor(Date.now() / 1000);
    const userParam = encodeURIComponent(JSON.stringify(user));
    
    // Create data-check-string: all parameters except 'hash', sorted alphabetically
    // IMPORTANT: Use URL-decoded values (per Telegram documentation)
    // Reference: https://docs.telegram-mini-apps.com/platform/init-data
    const params = {
      user: userParam,
      auth_date: timestamp.toString(),
    };
    
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
      .join('\n');
    
    // Calculate secret key from bot token
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
    
    // Calculate HMAC-SHA256 from URL-decoded data-check-string
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return `user=${userParam}&auth_date=${timestamp}&hash=${hash}`;
  };

  /**
   * Helper function to create initData with invalid signature
   */
  const createInvalidSignatureInitData = (user: TelegramUser): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const userParam = encodeURIComponent(JSON.stringify(user));
    // Create a hash of same length as a real SHA256 hash (64 hex chars)
    const invalidHash = 'a'.repeat(64);
    return `user=${userParam}&auth_date=${timestamp}&hash=${invalidHash}`;
  };

  /**
   * Helper function to create initData with expired timestamp
   */
  const createExpiredInitData = (user: TelegramUser): string => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 86401; // 24 hours +1 second ago
    const userParam = encodeURIComponent(JSON.stringify(user));
    
    const params = {
      user: userParam,
      auth_date: expiredTimestamp.toString(),
    };
    
    // IMPORTANT: Use URL-decoded values (per Telegram documentation)
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return `user=${userParam}&auth_date=${expiredTimestamp}&hash=${hash}`;
  };

  /**
   * Helper function to create initData with future timestamp
   */
  const createFutureInitData = (user: TelegramUser): string => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const userParam = encodeURIComponent(JSON.stringify(user));
    
    const params = {
      user: userParam,
      auth_date: futureTimestamp.toString(),
    };
    
    // IMPORTANT: Use URL-decoded values (per Telegram documentation)
    const dataCheckString = Object.entries(params)
      .filter(([key, value]) => key !== 'hash' && value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return `user=${userParam}&auth_date=${futureTimestamp}&hash=${hash}`;
  };

  describe('Valid initData authentication', () => {
    it('should successfully authenticate with valid initData from header', async () => {
      const user: TelegramUser = {
        id: 123456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        language_code: 'en',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        headers: {
          'x-telegram-init-data': initData,
        },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.telegramUser).toBeDefined();
      expect(req.telegramUser?.userId).toBe(user.id);
      expect(req.telegramUser?.user).toEqual(user);
      expect(req.telegramUser?.initData).toBe(initData);
    });

    it('should successfully authenticate with valid initData from query parameters', async () => {
      const user: TelegramUser = {
        id: 987654321,
        username: 'testuser2',
        first_name: 'Test',
        last_name: 'User Two',
        language_code: 'ru',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        query: {
          initData: initData,
        },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.telegramUser).toBeDefined();
      expect(req.telegramUser?.userId).toBe(user.id);
      expect(req.telegramUser?.user).toEqual(user);
      expect(req.telegramUser?.initData).toBe(initData);
    });

    it('should prioritize header over query parameter when both are present', async () => {
      const user1: TelegramUser = { id: 111111111, username: 'user1' };
      const user2: TelegramUser = { id: 222222222, username: 'user2' };
      
      const headerInitData = createValidInitData(user1);
      const queryInitData = createValidInitData(user2);
      
      const req = createMockRequest({
        headers: {
          'x-telegram-init-data': headerInitData,
        },
        query: {
          initData: queryInitData,
        },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.telegramUser?.userId).toBe(user1.id);
    });
  });

  describe('HMAC-SHA256 verification', () => {
    it('should accept correct HMAC signature', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createValidInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject incorrect HMAC signature', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createInvalidSignatureInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid signature',
        code: 'INVALID_SIGNATURE',
      });
    });

    it('should reject initData without hash parameter', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const userParam = encodeURIComponent(JSON.stringify(user));
      const timestamp = Math.floor(Date.now() / 1000);
      const initData = `user=${userParam}&auth_date=${timestamp}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid signature',
        code: 'INVALID_SIGNATURE',
      });
    });
  });

  describe('Timestamp validation (replay attack prevention)', () => {
    it('should accept valid timestamp within 24 hours', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const recentTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const initData = createValidInitData(user, recentTimestamp);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept timestamp exactly at 24-hour boundary', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const boundaryTimestamp = Math.floor(Date.now() / 1000) - 86400; // Exactly 24 hours ago
      const initData = createValidInitData(user, boundaryTimestamp);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject expired timestamp older than 24 hours', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createExpiredInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Expired authentication data',
        code: 'EXPIRED_AUTH_DATA',
      });
    });

    it('should reject future timestamp', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createFutureInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Expired authentication data',
        code: 'EXPIRED_AUTH_DATA',
      });
    });

    it('should reject invalid timestamp format', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const userParam = encodeURIComponent(JSON.stringify(user));
      // Create a valid hash for this test data
      const params = {
        user: userParam,
        auth_date: 'invalid',
      };
      
      // IMPORTANT: Use URL-decoded values (per Telegram documentation)
      const dataCheckString = Object.entries(params)
        .filter(([key, value]) => key !== 'hash' && value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
        .join('\n');
      
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const initData = `user=${userParam}&auth_date=invalid&hash=${hash}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Expired authentication data',
        code: 'EXPIRED_AUTH_DATA',
      });
    });
  });

  describe('User_id extraction', () => {
    it('should correctly extract user_id from user data', async () => {
      const user: TelegramUser = {
        id: 999888777,
        username: 'extracteduser',
        first_name: 'Extracted',
        last_name: 'User',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.userId).toBe(user.id);
      expect(req.telegramUser?.user?.id).toBe(user.id);
    });

    it('should handle user_id as number type correctly', async () => {
      const user: TelegramUser = { id: 123456789 };
      const initData = createValidInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(typeof req.telegramUser?.userId).toBe('number');
      expect(req.telegramUser?.userId).toBe(123456789);
    });
  });

  describe('Missing initData', () => {
    it('should return 401 when initData is missing from both header and query', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA',
      });
    });

    it('should return 401 when initData header is empty string', async () => {
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': '' },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA',
      });
    });

    it('should return 401 when initData query parameter is empty string', async () => {
      const req = createMockRequest({
        query: { initData: '' },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA',
      });
    });
  });

  describe('Missing bot token', () => {
    it('should return 500 when TELEGRAM_BOT_TOKEN is not set', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createValidInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server configuration error',
        code: 'MISSING_BOT_TOKEN',
      });
    });
  });

  describe('Missing user data', () => {
    it('should return 401 when user parameter is missing from initData', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        auth_date: timestamp.toString(),
      };
      
      // IMPORTANT: Use URL-decoded values (per Telegram documentation)
      const dataCheckString = Object.entries(params)
        .filter(([key, value]) => key !== 'hash' && value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
        .join('\n');
      
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const initData = `auth_date=${timestamp}&hash=${hash}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing user data',
        code: 'MISSING_USER_DATA',
      });
    });

    it('should return 401 when user parameter is empty', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        user: '',
        auth_date: timestamp.toString(),
      };
      
      // IMPORTANT: Use URL-decoded values (per Telegram documentation)
      const dataCheckString = Object.entries(params)
        .filter(([key, value]) => key !== 'hash' && value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
        .join('\n');
      
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const initData = `user=&auth_date=${timestamp}&hash=${hash}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing user data',
        code: 'MISSING_USER_DATA',
      });
    });
  });

  describe('Invalid user data', () => {
    it('should return 401 when user data is malformed JSON', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        user: 'not_valid_json',
        auth_date: timestamp.toString(),
      };
      
      // IMPORTANT: Use URL-decoded values (per Telegram documentation)
      const dataCheckString = Object.entries(params)
        .filter(([key, value]) => key !== 'hash' && value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
        .join('\n');
      
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const initData = `user=${encodeURIComponent('not_valid_json')}&auth_date=${timestamp}&hash=${hash}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid user data',
        code: 'INVALID_USER_DATA',
      });
    });

    it('should return 401 when user data is missing id field', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const userWithoutId = { username: 'testuser', first_name: 'Test' };
      const userParam = encodeURIComponent(JSON.stringify(userWithoutId));
      
      const params = {
        user: userParam,
        auth_date: timestamp.toString(),
      };
      
      // IMPORTANT: Use URL-decoded values (per Telegram documentation)
      const dataCheckString = Object.entries(params)
        .filter(([key, value]) => key !== 'hash' && value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
        .join('\n');
      
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const initData = `user=${userParam}&auth_date=${timestamp}&hash=${hash}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid user data',
        code: 'INVALID_USER_DATA',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in user data', async () => {
      const user: TelegramUser = {
        id: 123456789,
        username: 'test@user#123',
        first_name: 'Test & User',
        last_name: 'O\'Connor',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.user).toEqual(user);
    });

    it('should handle unicode characters in user data', async () => {
      const user: TelegramUser = {
        id: 123456789,
        username: 'тестовый_пользователь',
        first_name: 'Тест',
        last_name: 'Пользователь',
        language_code: 'ru',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.user).toEqual(user);
    });

    it('should handle emojis in user data', async () => {
      const user: TelegramUser = {
        id: 123456789,
        username: 'user_🎉',
        first_name: 'Test 👋',
        last_name: 'User 🚀',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.user).toEqual(user);
    });

    it('should handle minimal user data with only id', async () => {
      const user: TelegramUser = { id: 123456789 };
      const initData = createValidInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.userId).toBe(user.id);
      expect(req.telegramUser?.user).toEqual(user);
    });

    it('should handle malformed initData with missing delimiters', async () => {
      const malformedInitData = 'user=123&auth_date=1234567890hash=abc123';
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': malformedInitData },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid signature',
        code: 'INVALID_SIGNATURE',
      });
    });

    it('should handle initData with extra parameters', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const timestamp = Math.floor(Date.now() / 1000);
      const userParam = encodeURIComponent(JSON.stringify(user));
      
      const params = {
        user: userParam,
        auth_date: timestamp.toString(),
        query_id: 'AAQBAgIAAAAB',
        start_param: 'referral_code',
      };
      
      // IMPORTANT: Use URL-decoded values (per Telegram documentation)
      const dataCheckString = Object.entries(params)
        .filter(([key, value]) => key !== 'hash' && value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${decodeURIComponent(value!)}`)
        .join('\n');
      
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      const initData = `user=${userParam}&auth_date=${timestamp}&query_id=AAQBAgIAAAAB&start_param=referral_code&hash=${hash}`;
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.userId).toBe(user.id);
    });
  });

  describe('req.telegramUser object structure', () => {
    it('should contain userId property', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createValidInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser).toBeDefined();
      expect(req.telegramUser?.userId).toBe(user.id);
    });

    it('should contain user object with Telegram user data', async () => {
      const user: TelegramUser = {
        id: 123456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        language_code: 'en',
        photo_url: 'https://example.com/photo.jpg',
      };
      
      const initData = createValidInitData(user);
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.user).toBeDefined();
      expect(req.telegramUser?.user).toEqual(user);
    });

    it('should contain initData string', async () => {
      const user: TelegramUser = { id: 123456789, username: 'testuser' };
      const initData = createValidInitData(user);
      
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': initData },
      });
      const res = createMockResponse();

      await testMiddleware(authenticateTelegramUser, req, res);

      expect(req.telegramUser?.initData).toBe(initData);
      expect(typeof req.telegramUser?.initData).toBe('string');
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Create a request that will cause an error
      const req = createMockRequest({
        headers: { 'x-telegram-init-data': undefined as any },
      });
      const res = createMockResponse();

      const { next } = await testMiddleware(authenticateTelegramUser, req, res);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA',
      });
    });
  });
});
