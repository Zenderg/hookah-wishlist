import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger.js';

export interface JWTPayload {
  userId: number;
  telegramId: number;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
}

/**
 * JWT authentication middleware
 * Verifies JWT tokens and attaches user to request
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  logger.info('[AUTH MIDDLEWARE] Checking authentication', { path: request.url, method: request.method });

  try {
    // Get Authorization header
    const authHeader = request.headers.authorization;

    logger.debug('[AUTH MIDDLEWARE] Authorization header present', {
      hasAuthHeader: !!authHeader,
      headerPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
    });

    if (!authHeader) {
      logger.warn('[AUTH MIDDLEWARE] Missing Authorization header', { path: request.url });
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required',
        },
      });
    }

    // Extract Bearer token
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    if (!match) {
      logger.warn('[AUTH MIDDLEWARE] Invalid Authorization header format', {
        path: request.url,
        header: authHeader.substring(0, 50),
      });
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
        },
      });
    }

    const token = match[1];

    logger.debug('[AUTH MIDDLEWARE] Token extracted', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 30) + '...',
    });

    // Verify token using the JWT plugin
    const jwt = (request.server as any).jwt;
    const decoded = jwt.verify(token) as JWTPayload;

    logger.info('[AUTH MIDDLEWARE] Token verified successfully', {
      userId: decoded.userId,
      telegramId: decoded.telegramId,
      path: request.url,
    });

    // Attach user to request
    (request as AuthenticatedRequest).user = decoded;

    logger.debug('[AUTH MIDDLEWARE] User attached to request', { userId: decoded.userId });
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('[AUTH MIDDLEWARE] Token expired', {
          path: request.url,
          error: error.message,
        });
        return reply.status(401).send({
          success: false,
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired',
          },
        });
      }

      if (error.name === 'JsonWebTokenError') {
        logger.warn('[AUTH MIDDLEWARE] Invalid token', {
          path: request.url,
          error: error.message,
        });
        return reply.status(401).send({
          success: false,
          data: null,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
          },
        });
      }
    }

    logger.error('[AUTH MIDDLEWARE] Authentication error', {
      error: error instanceof Error ? error.message : String(error),
      path: request.url,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return reply.status(401).send({
      success: false,
      data: null,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
      },
    });
  }
}
