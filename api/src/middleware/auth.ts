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
  try {
    // Get Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      logger.warn('Missing Authorization header', { path: request.url });
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
      logger.warn('Invalid Authorization header format', { path: request.url });
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

    // Verify token using the JWT plugin
    const jwt = (request.server as any).jwt;
    const decoded = jwt.verify(token) as JWTPayload;

    // Attach user to request
    (request as AuthenticatedRequest).user = decoded;

    logger.debug('Token verified successfully', { userId: decoded.userId, path: request.url });
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Token expired', { path: request.url });
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
        logger.warn('Invalid token', { path: request.url });
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

    logger.error('Authentication error', { error, path: request.url });
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
