import { Response, NextFunction } from 'express';
import { authenticateTelegramUser, AuthenticatedRequest } from '@/api/middleware/auth';

// Mock logger BEFORE importing auth module
jest.mock('@/utils/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Authentication Verification Method Tests', () => {
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
    jest.clearAllMocks();
  });

  describe('Verification Method Selection', () => {
    it('should use Ed25519 when both signature and hash are present', () => {
      const initDataWithBoth = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22Test%22%7D' +
        '&auth_date=' + Math.floor(Date.now() / 1000) +
        '&signature=test_signature' +
        '&hash=test_hash';

      mockRequest.headers = {
        'x-telegram-init-data': initDataWithBoth,
      };

      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

      authenticateTelegramUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Verify Ed25519 was used by checking debug logs
      const logger = require('@/utils/logger');
      const ed25519Calls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('Ed25519') && call[0].includes('third-party validation')
      );
      const hmacCalls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('HMAC-SHA256') && call[0].includes('preferred method')
      );

      expect(ed25519Calls.length).toBeGreaterThan(0);
      expect(hmacCalls.length).toBe(0);
      expect(mockResponse.status).toHaveBeenCalledWith(401); // Will fail because signature is invalid
    });

    it('should use HMAC-SHA256 when only hash is present', () => {
      const initDataWithHashOnly = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22Test%22%7D' +
        '&auth_date=' + Math.floor(Date.now() / 1000) +
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

      // Verify HMAC-SHA256 was used by checking debug logs
      const logger = require('@/utils/logger');
      const hmacCalls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('HMAC-SHA256') && call[0].includes('preferred method')
      );
      const ed25519Calls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('Ed25519') && call[0].includes('third-party validation')
      );

      expect(hmacCalls.length).toBeGreaterThan(0);
      expect(ed25519Calls.length).toBe(0);
      expect(mockResponse.status).toHaveBeenCalledWith(401); // Will fail because hash is invalid
    });

    it('should use Ed25519 when only signature is present', () => {
      const initDataWithSignatureOnly = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22Test%22%7D' +
        '&auth_date=' + Math.floor(Date.now() / 1000) +
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

      // Verify Ed25519 was used by checking debug logs
      const logger = require('@/utils/logger');
      const ed25519Calls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('Ed25519') && call[0].includes('third-party validation')
      );
      const hmacCalls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('HMAC-SHA256') && call[0].includes('preferred method')
      );

      expect(ed25519Calls.length).toBeGreaterThan(0);
      expect(hmacCalls.length).toBe(0);
      expect(mockResponse.status).toHaveBeenCalledWith(401); // Will fail because signature is invalid
    });
  });

  describe('Production Scenario', () => {
    it('should use Ed25519 for production initData with both signature and hash', () => {
      // This is exact format from production logs
      const productionInitData = 
        'user=%7B%22id%22%3A385787313%2C%22first_name%22%3A%22%D0%94%D0%B0%D0%BD%D0%B8%D0%BB%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Koshmarus%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F82YeSLG37ePM3uwUAcvN87Uo5EeLPE_iqPQzAML40MY.svg%22%7D' +
        '&chat_instance=7714732502496827171' +
        '&chat_type=private' +
        '&auth_date=' + Math.floor(Date.now() / 1000) +
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

      // Verify Ed25519 was used by checking debug logs
      const logger = require('@/utils/logger');
      const ed25519Calls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('Ed25519') && call[0].includes('third-party validation')
      );
      const hmacCalls = logger.debug.mock.calls.filter((call: any[]) =>
        call[0].includes('HMAC-SHA256') && call[0].includes('preferred method')
      );

      expect(ed25519Calls.length).toBeGreaterThan(0);
      expect(hmacCalls.length).toBe(0);
      expect(mockResponse.status).toHaveBeenCalledWith(401); // Will fail because signature is invalid with test bot token
    });
  });
});
