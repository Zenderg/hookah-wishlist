/**
 * Mock Axios for Testing
 * 
 * This file provides a comprehensive mock for axios to test API calls.
 * Following javascript-testing-patterns skill best practices for mocking external dependencies.
 */

import { vi, expect } from 'vitest';
import type { AxiosRequestConfig } from 'axios';

/**
 * Mock Axios Response Interface
 */
export interface MockAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
}

/**
 * Mock Axios Error Interface
 */
export interface MockAxiosError extends Error {
  response?: {
    data: any;
    status: number;
    statusText: string;
    headers: any;
    config: AxiosRequestConfig;
  };
  request?: any;
  code?: string;
}

/**
 * Create a mock axios response
 */
export function createMockResponse<T = any>(
  data: T,
  status: number = 200,
  statusText: string = 'OK'
): MockAxiosResponse<T> {
  return {
    data,
    status,
    statusText,
    headers: {
      'content-type': 'application/json',
    },
    config: {} as AxiosRequestConfig,
  };
}

/**
 * Create a mock axios error
 */
export function createMockError(
  message: string,
  status: number = 500,
  code?: string
): MockAxiosError {
  const error = new Error(message) as MockAxiosError;
  error.name = 'AxiosError';
  error.message = message;
  error.code = code;
  
  error.response = {
    data: {
      success: false,
      error: message,
      code: code || 'ERROR',
    },
    status,
    statusText: status === 401 ? 'Unauthorized' : 
               status === 403 ? 'Forbidden' :
               status === 404 ? 'Not Found' :
               status === 429 ? 'Too Many Requests' :
               'Internal Server Error',
    headers: {
      'content-type': 'application/json',
    },
    config: {} as AxiosRequestConfig,
  };
  
  error.request = {};
  
  return error;
}

/**
 * Create a mock network error (no response)
 */
export function createMockNetworkError(message: string = 'Network Error'): MockAxiosError {
  const error = new Error(message) as MockAxiosError;
  error.name = 'AxiosError';
  error.message = message;
  error.code = 'ERR_NETWORK';
  
  // Network errors don't have a response
  error.response = undefined;
  error.request = {};
  
  return error;
}

/**
 * Mock Axios Instance
 * This provides a complete mock of axios with all common methods
 */
export const mockAxios = {
  /**
   * Mock GET request
   */
  get: vi.fn(),

  /**
   * Mock POST request
   */
  post: vi.fn(),

  /**
   * Mock PUT request
   */
  put: vi.fn(),

  /**
   * Mock PATCH request
   */
  patch: vi.fn(),

  /**
   * Mock DELETE request
   */
  delete: vi.fn(),

  /**
   * Mock HEAD request
   */
  head: vi.fn(),

  /**
   * Mock OPTIONS request
   */
  options: vi.fn(),

  /**
   * Mock request with custom config
   */
  request: vi.fn(),

  /**
   * Mock axios.create for creating instances
   */
  create: vi.fn(() => mockAxios),

  /**
   * Mock interceptors
   */
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
      clear: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
      clear: vi.fn(),
    },
  },

  /**
   * Mock default config
   */
  defaults: {
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
  },

  /**
   * Mock CancelToken
   */
  CancelToken: {
    source: vi.fn(() => ({
      token: 'mock-cancel-token',
      cancel: vi.fn(),
    })),
  },

  /**
   * Mock isCancel
   */
  isCancel: vi.fn(() => false),

  /**
   * Mock all method
   */
  all: vi.fn(),

  /**
   * Mock spread method
   */
  spread: vi.fn(),

  /**
   * Mock toFormData method
   */
  toFormData: vi.fn(),
};

/**
 * Helper function to mock successful GET request
 */
export function mockSuccessfulGet<T = any>(
  url: string,
  data: T,
  status: number = 200
): void {
  mockAxios.get.mockResolvedValueOnce(createMockResponse(data, status));
}

/**
 * Helper function to mock failed GET request
 */
export function mockFailedGet(
  url: string,
  message: string,
  status: number = 500,
  code?: string
): void {
  mockAxios.get.mockRejectedValueOnce(createMockError(message, status, code));
}

/**
 * Helper function to mock network error on GET
 */
export function mockNetworkErrorGet(url: string, message?: string): void {
  mockAxios.get.mockRejectedValueOnce(createMockNetworkError(message));
}

/**
 * Helper function to mock successful POST request
 */
export function mockSuccessfulPost<T = any>(
  url: string,
  data: T,
  status: number = 201
): void {
  mockAxios.post.mockResolvedValueOnce(createMockResponse(data, status));
}

/**
 * Helper function to mock failed POST request
 */
export function mockFailedPost(
  url: string,
  message: string,
  status: number = 500,
  code?: string
): void {
  mockAxios.post.mockRejectedValueOnce(createMockError(message, status, code));
}

/**
 * Helper function to mock network error on POST
 */
export function mockNetworkErrorPost(url: string, message?: string): void {
  mockAxios.post.mockRejectedValueOnce(createMockNetworkError(message));
}

/**
 * Helper function to mock successful DELETE request
 */
export function mockSuccessfulDelete<T = any>(
  url: string,
  data: T,
  status: number = 200
): void {
  mockAxios.delete.mockResolvedValueOnce(createMockResponse(data, status));
}

/**
 * Helper function to mock failed DELETE request
 */
export function mockFailedDelete(
  url: string,
  message: string,
  status: number = 500,
  code?: string
): void {
  mockAxios.delete.mockRejectedValueOnce(createMockError(message, status, code));
}

/**
 * Helper function to mock network error on DELETE
 */
export function mockNetworkErrorDelete(url: string, message?: string): void {
  mockAxios.delete.mockRejectedValueOnce(createMockNetworkError(message));
}

/**
 * Helper function to mock successful PUT request
 */
export function mockSuccessfulPut<T = any>(
  url: string,
  data: T,
  status: number = 200
): void {
  mockAxios.put.mockResolvedValueOnce(createMockResponse(data, status));
}

/**
 * Helper function to mock failed PUT request
 */
export function mockFailedPut(
  url: string,
  message: string,
  status: number = 500,
  code?: string
): void {
  mockAxios.put.mockRejectedValueOnce(createMockError(message, status, code));
}

/**
 * Helper function to mock successful PATCH request
 */
export function mockSuccessfulPatch<T = any>(
  url: string,
  data: T,
  status: number = 200
): void {
  mockAxios.patch.mockResolvedValueOnce(createMockResponse(data, status));
}

/**
 * Helper function to mock failed PATCH request
 */
export function mockFailedPatch(
  url: string,
  message: string,
  status: number = 500,
  code?: string
): void {
  mockAxios.patch.mockRejectedValueOnce(createMockError(message, status, code));
}

/**
 * Helper function to reset all axios mocks
 */
export function resetAxiosMocks(): void {
  mockAxios.get.mockReset();
  mockAxios.post.mockReset();
  mockAxios.put.mockReset();
  mockAxios.patch.mockReset();
  mockAxios.delete.mockReset();
  mockAxios.head.mockReset();
  mockAxios.options.mockReset();
  mockAxios.request.mockReset();
  mockAxios.create.mockReset();
  mockAxios.interceptors.request.use.mockReset();
  mockAxios.interceptors.request.eject.mockReset();
  mockAxios.interceptors.request.clear.mockReset();
  mockAxios.interceptors.response.use.mockReset();
  mockAxios.interceptors.response.eject.mockReset();
  mockAxios.interceptors.response.clear.mockReset();
}

/**
 * Helper function to clear all axios mocks
 */
export function clearAxiosMocks(): void {
  mockAxios.get.mockClear();
  mockAxios.post.mockClear();
  mockAxios.put.mockClear();
  mockAxios.patch.mockClear();
  mockAxios.delete.mockClear();
  mockAxios.head.mockClear();
  mockAxios.options.mockClear();
  mockAxios.request.mockClear();
  mockAxios.create.mockClear();
  mockAxios.interceptors.request.use.mockClear();
  mockAxios.interceptors.request.eject.mockClear();
  mockAxios.interceptors.request.clear.mockClear();
  mockAxios.interceptors.response.use.mockClear();
  mockAxios.interceptors.response.eject.mockClear();
  mockAxios.interceptors.response.clear.mockClear();
}

/**
 * Helper function to verify axios was called with specific URL
 */
export function expectAxiosCalledWith(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: any,
  params?: any
): void {
  const mockFn = mockAxios[method];
  
  if (method === 'get' || method === 'delete') {
    expect(mockFn).toHaveBeenCalledWith(
      url,
      params ? { params } : undefined
    );
  } else {
    expect(mockFn).toHaveBeenCalledWith(
      url,
      data,
      params ? { params } : undefined
    );
  }
}

/**
 * Helper function to verify axios was called with specific config
 */
export function expectAxiosCalledWithConfig(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  config?: AxiosRequestConfig
): void {
  const mockFn = mockAxios[method];
  expect(mockFn).toHaveBeenCalledWith(url, config);
}

/**
 * Helper function to mock authentication error (401)
 */
export function mockAuthError(url: string): void {
  mockFailedGet(
    url,
    'Authentication failed. Please open this app from Telegram.',
    401,
    'AUTH_FAILED'
  );
}

/**
 * Helper function to mock not found error (404)
 */
export function mockNotFoundError(url: string): void {
  mockFailedGet(
    url,
    'The requested resource was not found.',
    404,
    'NOT_FOUND'
  );
}

/**
 * Helper function to mock rate limit error (429)
 */
export function mockRateLimitError(url: string): void {
  mockFailedGet(
    url,
    'Too many requests. Please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
}

/**
 * Helper function to mock server error (500)
 */
export function mockServerError(url: string): void {
  mockFailedGet(
    url,
    'Server error. Please try again later.',
    500,
    'SERVER_ERROR'
  );
}

/**
 * Helper function to mock forbidden error (403)
 */
export function mockForbiddenError(url: string): void {
  mockFailedGet(
    url,
    'Access denied. You do not have permission to perform this action.',
    403,
    'FORBIDDEN'
  );
}

/**
 * Helper function to mock bad request error (400)
 */
export function mockBadRequestError(url: string): void {
  mockFailedGet(
    url,
    'Bad request. Please check your input.',
    400,
    'BAD_REQUEST'
  );
}

/**
 * Helper function to verify request headers
 */
export function expectHeadersContain(
  callIndex: number = 0,
  headers: Record<string, string>
): void {
  const calls = mockAxios.get.mock.calls || mockAxios.post.mock.calls;
  const config = calls[callIndex]?.[1] as AxiosRequestConfig | undefined;
  
  if (!config) {
    throw new Error(`No axios call found at index ${callIndex}`);
  }
  
  for (const [key, value] of Object.entries(headers)) {
    expect(config.headers?.[key]).toBe(value);
  }
}

/**
 * Helper function to verify Telegram init data header
 */
export function expectTelegramInitDataHeader(
  callIndex: number = 0,
  initData?: string
): void {
  const calls = mockAxios.get.mock.calls || mockAxios.post.mock.calls;
  const config = calls[callIndex]?.[1] as AxiosRequestConfig | undefined;
  
  if (!config) {
    throw new Error(`No axios call found at index ${callIndex}`);
  }
  
  expect(config.headers?.['X-Telegram-Init-Data']).toBeDefined();
  if (initData) {
    expect(config.headers?.['X-Telegram-Init-Data']).toBe(initData);
  }
}

/**
 * Helper function to get the number of times axios was called
 */
export function getAxiosCallCount(method?: keyof typeof mockAxios): number {
  if (method && typeof mockAxios[method] === 'function') {
    return (mockAxios[method] as any).mock.calls.length;
  }
  
  // Count all method calls
  let total = 0;
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'request'];
  for (const m of methods) {
    total += (mockAxios[m as keyof typeof mockAxios] as any).mock.calls.length;
  }
  return total;
}

/**
 * Helper function to verify axios was called specific number of times
 */
export function expectAxiosCalledTimes(
  times: number,
  method?: keyof typeof mockAxios
): void {
  const actual = getAxiosCallCount(method);
  expect(actual).toBe(times);
}

/**
 * Helper function to verify axios was not called
 */
export function expectAxiosNotCalled(method?: keyof typeof mockAxios): void {
  expectAxiosCalledTimes(0, method);
}

/**
 * Helper function to get the last call to axios
 */
export function getLastAxiosCall(method?: keyof typeof mockAxios): any[] {
  if (method) {
    const calls = (mockAxios[method] as any).mock.calls;
    return calls[calls.length - 1];
  }
  
  // Get the most recent call across all methods
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'request'];
  let lastCall: any[] | null = null;
  let lastTime = -1;
  
  for (const m of methods) {
    const calls = (mockAxios[m as keyof typeof mockAxios] as any).mock.calls;
    if (calls.length > 0 && calls.length - 1 > lastTime) {
      lastCall = calls[calls.length - 1];
      lastTime = calls.length - 1;
    }
  }
  
  return lastCall || [];
}

export default mockAxios;
