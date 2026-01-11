/**
 * Mock objects for Express.js testing
 */

import { AuthenticatedRequest, TelegramUser } from '@/api/middleware/auth';

export interface MockRequestOptions {
  method?: string;
  url?: string;
  path?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  params?: Record<string, any>;
  telegramUser?: {
    userId: number;
    user?: TelegramUser;
    initData: string;
  };
}

export interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  status: jest.Mock<MockResponse, [number]>;
  json: jest.Mock<MockResponse, [any]>;
  send: jest.Mock<MockResponse, [any]>;
  set: jest.Mock<MockResponse, [string, string]>;
  header: jest.Mock<MockResponse, [string, string]>;
  end: jest.Mock<MockResponse, []>;
}

/**
 * Create a mock Express request object
 */
export const createMockRequest = (options: MockRequestOptions = {}): Partial<AuthenticatedRequest> => {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    path: options.path || options.url || '/',
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {},
    params: options.params || {},
    telegramUser: options.telegramUser,
  };
};

/**
 * Create a mock Express response object
 */
export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    status: jest.fn().mockImplementation(function(this: MockResponse, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn().mockImplementation(function(this: MockResponse, data: any) {
      this.body = data;
      return this;
    }),
    send: jest.fn().mockImplementation(function(this: MockResponse, data: any) {
      this.body = data;
      return this;
    }),
    set: jest.fn().mockImplementation(function(this: MockResponse, key: string, value: string) {
      this.headers[key] = value;
      return this;
    }),
    header: jest.fn().mockImplementation(function(this: MockResponse, key: string, value: string) {
      this.headers[key] = value;
      return this;
    }),
    end: jest.fn().mockImplementation(function(this: MockResponse) {
      return this;
    }),
  };
  return res;
};

/**
 * Create a mock Express next function
 */
export const createMockNext = (): jest.Mock => {
  return jest.fn();
};

/**
 * Create an authenticated request with Telegram user data
 */
export const createAuthenticatedRequest = (
  userId: number = 123456789,
  options: Omit<MockRequestOptions, 'telegramUser'> = {}
): Partial<AuthenticatedRequest> => {
  const telegramUser: TelegramUser = {
    id: userId,
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    language_code: 'en',
  };

  return createMockRequest({
    ...options,
    telegramUser: {
      userId,
      user: telegramUser,
      initData: `user=${encodeURIComponent(JSON.stringify(telegramUser))}&auth_date=${Math.floor(Date.now() / 1000)}`,
    },
  });
};

/**
 * Create a request with Telegram init data header
 */
export const createRequestWithInitData = (
  initData: string,
  options: Omit<MockRequestOptions, 'telegramUser'> = {}
): Partial<AuthenticatedRequest> => {
  return createMockRequest({
    ...options,
    headers: {
      'x-telegram-init-data': initData,
      ...options.headers,
    },
  });
};

/**
 * Helper to test middleware
 */
export const testMiddleware = async (
  middleware: (req: any, res: any, next: any) => void,
  req: Partial<AuthenticatedRequest>,
  res?: MockResponse
): Promise<{ req: Partial<AuthenticatedRequest>; res: MockResponse; next: jest.Mock }> => {
  const mockRes = res || createMockResponse();
  const mockNext = createMockNext();

  await new Promise<void>((resolve) => {
    middleware(req as any, mockRes as any, mockNext);
    resolve();
  });

  return { req, res: mockRes, next: mockNext };
};

/**
 * Helper to test controller
 */
export const testController = async (
  controller: (req: any, res: any) => Promise<void>,
  req: Partial<AuthenticatedRequest>,
  res?: MockResponse
): Promise<{ req: Partial<AuthenticatedRequest>; res: MockResponse }> => {
  const mockRes = res || createMockResponse();

  await controller(req as any, mockRes as any);

  return { req, res: mockRes };
};
