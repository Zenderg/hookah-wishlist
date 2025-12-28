import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger.js';
import * as crypto from 'crypto';

/**
 * Bot authentication middleware
 * Validates X-API-Key header against BOT_API_KEY environment variable
 */
export async function botAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get X-API-Key header
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      logger.warn('Missing X-API-Key header', { path: request.url });
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: 'MISSING_API_KEY',
          message: 'X-API-Key header is required',
        },
      });
    }

    // Get expected API key from environment
    const expectedApiKey = process.env.BOT_API_KEY;

    if (!expectedApiKey) {
      logger.error('BOT_API_KEY environment variable is not configured');
      return reply.status(500).send({
        success: false,
        data: null,
        error: {
          code: 'SERVER_CONFIGURATION_ERROR',
          message: 'Server configuration error',
        },
      });
    }

    // Use constant-time comparison to prevent timing attacks
    const keyBuffer = Buffer.from(apiKey, 'utf8');
    const expectedBuffer = Buffer.from(expectedApiKey, 'utf8');

    if (
      keyBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(keyBuffer, expectedBuffer)
    ) {
      logger.warn('Invalid API key', { path: request.url });
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
        },
      });
    }

    logger.debug('API key verified successfully', { path: request.url });
  } catch (error) {
    logger.error('Bot authentication error', { error, path: request.url });
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
