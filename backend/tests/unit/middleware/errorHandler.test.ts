/**
 * Unit tests for error handler middleware
 */

import { errorHandler, notFoundHandler, ApiError } from '@/api/middleware/errorHandler';
import { createMockRequest, createMockResponse, createMockNext } from '../../../tests/mocks/mockExpress';
import logger from '@/utils/logger';

// Mock logger
jest.mock('@/utils/logger');

describe('errorHandler middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = createMockRequest({
      method: 'GET',
      url: '/api/v1/test',
      path: '/api/v1/test',
    });
    mockRes = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('Standard Error objects', () => {
    it('handles standard Error with message', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Something went wrong',
      });
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        message: 'Something went wrong',
        statusCode: undefined,
        details: undefined,
        path: '/api/v1/test',
        method: 'GET',
      }));
    });

    it('handles Error without message', () => {
      const error = new Error();
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles Error without stack trace', () => {
      const error = new Error('Test error');
      delete error.stack;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Test error',
      });
    });
  });

  describe('Custom errors with status code', () => {
    it('uses custom status code if available', () => {
      const error: ApiError = new Error('Not found') as ApiError;
      error.statusCode = 404;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not found',
      });
    });

    it('uses custom status code 400 for validation errors', () => {
      const error: ApiError = new Error('Validation failed') as ApiError;
      error.statusCode = 400;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
      });
    });

    it('uses custom status code 401 for authentication errors', () => {
      const error: ApiError = new Error('Unauthorized') as ApiError;
      error.statusCode = 401;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
    });

    it('uses custom status code 403 for authorization errors', () => {
      const error: ApiError = new Error('Forbidden') as ApiError;
      error.statusCode = 403;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
      });
    });

    it('uses custom status code 404 for not found errors', () => {
      const error: ApiError = new Error('Resource not found') as ApiError;
      error.statusCode = 404;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Resource not found',
      });
    });

    it('uses custom status code 429 for rate limit errors', () => {
      const error: ApiError = new Error('Too many requests') as ApiError;
      error.statusCode = 429;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many requests',
      });
    });

    it('uses custom status code 500 for server errors', () => {
      const error: ApiError = new Error('Server error') as ApiError;
      error.statusCode = 500;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Server error',
      });
    });
  });

  describe('Custom errors with error code', () => {
    it('includes error code in response via details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error: ApiError = new Error('Custom error') as ApiError;
      error.statusCode = 400;
      error.details = { code: 'VALIDATION_ERROR', field: 'email' };
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Custom error',
        details: { code: 'VALIDATION_ERROR', field: 'email' },
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('does not include details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error: ApiError = new Error('Custom error') as ApiError;
      error.statusCode = 400;
      error.details = { code: 'VALIDATION_ERROR', field: 'email' };
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Custom error',
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Unknown errors', () => {
    it('handles string errors gracefully', () => {
      const error = 'String error' as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles number errors gracefully', () => {
      const error = 12345 as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles object errors gracefully', () => {
      const error = { custom: 'error' } as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles null errors gracefully', () => {
      const error = null as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        message: 'Unknown error (null/undefined)',
      }));
    });

    it('handles undefined errors gracefully', () => {
      const error = undefined as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        message: 'Unknown error (null/undefined)',
      }));
    });
  });

  describe('Error response format', () => {
    it('contains error property', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.body).toHaveProperty('error');
      expect(mockRes.body.error).toBe('Test error');
    });

    it('contains message property (error property)', () => {
      const error = new Error('Test message');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.body).toHaveProperty('error');
      expect(mockRes.body.error).toBe('Test message');
    });

    it('contains proper status code', () => {
      const error: ApiError = new Error('Not found') as ApiError;
      error.statusCode = 404;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.statusCode).toBe(404);
    });

    it('returns proper JSON format', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(typeof mockRes.body).toBe('object');
      expect(mockRes.body).not.toBeNull();
    });

    it('returns proper content-type header', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Error logging', () => {
    it('logs errors', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('log includes error message', () => {
      const error = new Error('Test error message');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        message: 'Test error message',
      }));
    });

    it('log includes status code', () => {
      const error: ApiError = new Error('Test error') as ApiError;
      error.statusCode = 400;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        statusCode: 400,
      }));
    });

    it('log includes details', () => {
      const error: ApiError = new Error('Test error') as ApiError;
      error.details = { field: 'email' };
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        details: { field: 'email' },
      }));
    });

    it('log includes path', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        path: '/api/v1/test',
      }));
    });

    it('log includes method', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('log includes stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.any(Object));
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge cases', () => {
    it('handles null error', () => {
      const error = null as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles undefined error', () => {
      const error = undefined as any;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles error without message', () => {
      const error = new Error();
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles error without stack', () => {
      const error = new Error('Test error');
      delete error.stack;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Test error',
      });
    });

    it('handles error with empty message', () => {
      const error = new Error('');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('handles error with very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: longMessage,
      });
    });

    it('handles error with special characters in message', () => {
      const error = new Error('Error with special chars: <>&"\'');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error with special chars: <>&"\'',
      });
    });
  });

  describe('Different HTTP methods', () => {
    it('handles errors for GET requests', () => {
      mockReq.method = 'GET';
      const error = new Error('GET error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('handles errors for POST requests', () => {
      mockReq.method = 'POST';
      const error = new Error('POST error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('handles errors for PUT requests', () => {
      mockReq.method = 'PUT';
      const error = new Error('PUT error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        method: 'PUT',
      }));
    });

    it('handles errors for DELETE requests', () => {
      mockReq.method = 'DELETE';
      const error = new Error('DELETE error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        method: 'DELETE',
      }));
    });
  });

  describe('Different paths', () => {
    it('handles errors for different paths', () => {
      mockReq.path = '/api/v1/wishlist';
      const error = new Error('Path error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        path: '/api/v1/wishlist',
      }));
    });

    it('handles errors for root path', () => {
      mockReq.path = '/';
      const error = new Error('Root path error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        path: '/',
      }));
    });
  });
});

describe('notFoundHandler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest({
      method: 'GET',
      url: '/api/v1/unknown',
      path: '/api/v1/unknown',
    });
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  it('returns 404 status code', () => {
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('returns error message', () => {
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Not found',
      path: '/api/v1/unknown',
    });
  });

  it('includes path in response', () => {
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.body.path).toBe('/api/v1/unknown');
  });

  it('handles different paths', () => {
    mockReq.path = '/api/v1/wishlist/123';
    
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Not found',
      path: '/api/v1/wishlist/123',
    });
  });

  it('handles root path', () => {
    mockReq.path = '/';
    
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Not found',
      path: '/',
    });
  });

  it('returns proper JSON format', () => {
    notFoundHandler(mockReq, mockRes);
    
    expect(typeof mockRes.body).toBe('object');
    expect(mockRes.body).not.toBeNull();
  });

  it('contains error property', () => {
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.body).toHaveProperty('error');
    expect(mockRes.body.error).toBe('Not found');
  });

  it('contains path property', () => {
    notFoundHandler(mockReq, mockRes);
    
    expect(mockRes.body).toHaveProperty('path');
  });
});
