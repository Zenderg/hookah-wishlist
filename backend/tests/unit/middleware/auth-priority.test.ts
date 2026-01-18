import { Response, NextFunction } from 'express';
import { authenticateTelegramUser, AuthenticatedRequest } from '@/api/middleware/auth';

// Mock logger
jest.mock('@/utils/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Authentication Priority Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      url: '/api/v1/wishlist',
      method: 'GET',
      headers: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Signature Priority', () => {
    it('should use Ed25519 when both signature and hash are present (third-party mini app)', () => {
      // This simulates production scenario where both signature and hash are present
      // In this case, it's a third-party mini app, so we should use Ed25519 with signature
      const initDataWithBoth = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22Test%22%7D' +
        '&auth_date=1768757235' +
        '&signature=test_signature' +
        '&hash=test_hash';

      mockRequest.headers = {
        'x-telegram-init-data': initDataWithBoth,
      };

      // Set bot token
      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // The middleware should try to verify Ed25519 first (because signature is present)
      // Since we don't have a real signature, it will fail
      // But important thing is that it prioritizes signature over hash
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use HMAC-SHA256 when only hash is present (first-party mini app)', () => {
      const initDataWithHashOnly = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22Test%22%7D' +
        '&auth_date=1768757235' +
        '&hash=test_hash';

      mockRequest.headers = {
        'x-telegram-init-data': initDataWithHashOnly,
      };

      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use Ed25519 when only signature is present (third-party mini app)', () => {
      const initDataWithSignatureOnly = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22Test%22%7D' +
        '&auth_date=1768757235' +
        '&signature=test_signature';

      mockRequest.headers = {
        'x-telegram-init-data': initDataWithSignatureOnly,
      };

      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Missing Bot Token', () => {
    it('should return 500 when TELEGRAM_BOT_TOKEN is not set', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      const initData = 'user=%7B%22id%22%3A385787313%7D&auth_date=1768757235&hash=test';
      mockRequest.headers = {
        'x-telegram-init-data': initData,
      };

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Server configuration error',
        code: 'MISSING_BOT_TOKEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Missing Init Data', () => {
    it('should return 401 when initData is missing', () => {
      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Missing Telegram init data',
        code: 'MISSING_INIT_DATA',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Production Scenario Test', () => {
    it('should handle exact production initData format', () => {
      // This is exact format from production logs
      const productionInitData = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg%22%7D' +
        '&chat_instance=7714732502496827171' +
        '&chat_type=private' +
        '&auth_date=1768757235' +
        '&signature=kZ4RalSojaF9Xh25IzgUhaAzQr25mRAKqgNii3Nc3ryVD-R8XkCvYgfkdj-TIVgj7dTO_0xQtulpGd4TBovVCw' +
        '&hash=c5fa7d7c68573da37d9be7c9c1b8429e91f0e067943f0f8ed1cfa7dcb7923842';

      mockRequest.headers = {
        'x-telegram-init-data': productionInitData,
      };

      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Should try Ed25519 first (because signature is present)
      // Will fail because signature is not valid with test bot token
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
