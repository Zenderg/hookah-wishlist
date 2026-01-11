/**
 * Test helper functions for backend testing
 */

/**
 * Generate a random test ID (number)
 */
export const generateTestId = (): number => {
  return Math.floor(Math.random() * 1000000000) + 100000000;
};

/**
 * Generate a random test ID (string)
 */
export const generateTestIdString = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Generate a random test string
 */
export const generateTestString = (prefix: string = 'test', length: number = 10): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a random test email
 */
export const generateTestEmail = (): string => {
  const username = generateTestString('user', 8);
  const domain = generateTestString('test', 6);
  return `${username}@${domain}.com`;
};

/**
 * Generate a random test date
 */
export const generateTestDate = (daysOffset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

/**
 * Generate a random test date in the past
 */
export const generatePastDate = (daysAgo: number = 1): string => {
  return generateTestDate(-daysAgo);
};

/**
 * Generate a random test date in the future
 */
export const generateFutureDate = (daysFromNow: number = 1): string => {
  return generateTestDate(daysFromNow);
};

/**
 * Generate a random test timestamp (Unix timestamp in seconds)
 */
export const generateTestTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * Generate a random test timestamp in the past
 */
export const generatePastTimestamp = (secondsAgo: number = 3600): number => {
  return generateTestTimestamp() - secondsAgo;
};

/**
 * Generate a random test timestamp in the future
 */
export const generateFutureTimestamp = (secondsFromNow: number = 3600): number => {
  return generateTestTimestamp() + secondsFromNow;
};

/**
 * Setup test environment variables
 */
export const setupTestEnv = (): void => {
  // Set default test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.TELEGRAM_BOT_TOKEN = 'test_bot_token_1234567890';
  process.env.TELEGRAM_WEBHOOK_URL = 'http://localhost:3000/webhook';
  process.env.HOOKEH_DB_API_URL = 'http://localhost:4000';
  process.env.HOOKEH_DB_API_KEY = 'test_api_key_1234567890';
  process.env.API_RATE_LIMIT = '100';
  process.env.STORAGE_TYPE = 'sqlite';
  process.env.DATABASE_PATH = ':memory:';
  process.env.MINI_APP_URL = 'http://localhost:3000/mini-app';
};

/**
 * Reset test environment variables
 */
export const resetTestEnv = (): void => {
  // Clear all environment variables
  delete process.env.NODE_ENV;
  delete process.env.PORT;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_WEBHOOK_URL;
  delete process.env.HOOKEH_DB_API_URL;
  delete process.env.HOOKEH_DB_API_KEY;
  delete process.env.API_RATE_LIMIT;
  delete process.env.STORAGE_TYPE;
  delete process.env.DATABASE_PATH;
  delete process.env.MINI_APP_URL;
};

/**
 * Setup test environment with custom variables
 */
export const setupCustomTestEnv = (customVars: Record<string, string>): void => {
  setupTestEnv();
  Object.entries(customVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

/**
 * Create a delay for testing async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wait for a condition to be true
 */
export const waitFor = (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(checkCondition, interval);
      }
    };

    checkCondition();
  });
};

/**
 * Create a mock function that resolves with a value
 */
export const mockResolvedValue = <T>(value: T): jest.Mock<Promise<T>, []> => {
  return jest.fn().mockResolvedValue(value);
};

/**
 * Create a mock function that rejects with an error
 */
export const mockRejectedValue = (error: Error): jest.Mock<Promise<never>, []> => {
  return jest.fn().mockRejectedValue(error);
};

/**
 * Create a mock function that resolves after a delay
 */
export const mockDelayedResolvedValue = <T>(value: T, delayMs: number = 100): jest.Mock<Promise<T>, []> => {
  return jest.fn().mockImplementation(() => delay(delayMs).then(() => value));
};

/**
 * Create a mock function that rejects after a delay
 */
export const mockDelayedRejectedValue = (error: Error, delayMs: number = 100): jest.Mock<Promise<never>, []> => {
  return jest.fn().mockImplementation(() => delay(delayMs).then(() => Promise.reject(error)));
};

/**
 * Assert that a promise rejects with a specific error
 */
export const expectToReject = async (
  promise: Promise<any>,
  errorMessage?: string
): Promise<void> => {
  await expect(promise).rejects.toThrow(errorMessage);
};

/**
 * Assert that a promise resolves with a specific value
 */
export const expectToResolve = async <T>(
  promise: Promise<T>,
  expectedValue: T
): Promise<void> => {
  const result = await promise;
  expect(result).toEqual(expectedValue);
};

/**
 * Create a spy on an object method
 */
export const spyOnMethod = (obj: any, method: string): jest.SpyInstance => {
  return jest.spyOn(obj, method);
};

/**
 * Restore all mocked methods
 */
export const restoreAllMocks = (): void => {
  jest.restoreAllMocks();
};

/**
 * Clear all mocks
 */
export const clearAllMocks = (): void => {
  jest.clearAllMocks();
};

/**
 * Reset all mocks
 */
export const resetAllMocks = (): void => {
  jest.resetAllMocks();
};

/**
 * Setup and teardown helper for test database
 */
export const withTestDatabase = async <T>(
  callback: (db: any) => Promise<T>
): Promise<T> => {
  const { createTestDatabase } = await import('./testDatabase');
  const testDb = createTestDatabase();

  try {
    return await callback(testDb);
  } finally {
    testDb.close();
  }
};

/**
 * Setup and teardown helper for test environment
 */
export const withTestEnv = async <T>(
  callback: () => Promise<T>
): Promise<T> => {
  setupTestEnv();

  try {
    return await callback();
  } finally {
    resetTestEnv();
  }
};

/**
 * Setup and teardown helper for mocked modules
 */
export const withMockedModule = async <T>(
  modulePath: string,
  mockImplementation: any,
  callback: () => Promise<T>
): Promise<T> => {
  jest.mock(modulePath, () => mockImplementation);

  try {
    return await callback();
  } finally {
    jest.unmock(modulePath);
  }
};

/**
 * Helper to create a test suite with setup and teardown
 */
export const createTestSuite = (
  name: string,
  setupFn?: () => void | Promise<void>,
  teardownFn?: () => void | Promise<void>
) => {
  describe(name, () => {
    beforeAll(async () => {
      await setupFn?.();
    });

    afterAll(async () => {
      await teardownFn?.();
    });

    beforeEach(() => {
      // Clear all mocks before each test
      clearAllMocks();
    });

    afterEach(() => {
      // Reset all mocks after each test
      resetAllMocks();
    });
  });
};

/**
 * Helper to create a test case with timeout
 */
export const createTestCase = (
  name: string,
  testFn: () => void | Promise<void>,
  timeout: number = 5000
) => {
  it(name, testFn as any, timeout);
};
