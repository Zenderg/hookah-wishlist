import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { validateInitData } from '../utils/telegram.js';
import logger from '../utils/logger.js';

interface TelegramAuthRequest {
  Body: {
    initData: string;
  };
}

interface RefreshTokenRequest {
  Headers: {
    authorization: string;
  };
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService((fastify as any).prisma);

  /**
   * POST /api/v1/auth/telegram
   * Authenticate via Telegram initData and return JWT token
   */
  fastify.post<TelegramAuthRequest>(
    '/telegram',
    async (request: FastifyRequest<TelegramAuthRequest>, reply: FastifyReply) => {
      logger.info('[AUTH ROUTE] POST /auth/telegram - Received request');

      try {
        const { initData } = request.body;

        logger.info('[AUTH ROUTE] Request body received', {
          initDataLength: initData?.length,
          initDataPreview: initData?.substring(0, 100) + '...',
        });

        // Validate input
        if (!initData) {
          logger.warn('[AUTH ROUTE] Missing initData in request');
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'MISSING_INIT_DATA',
              message: 'initData is required',
            },
          });
        }

        // Get bot token from environment
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          logger.error('[AUTH ROUTE] TELEGRAM_BOT_TOKEN not configured');
          return reply.status(500).send({
            success: false,
            data: null,
            error: {
              code: 'SERVER_CONFIG_ERROR',
              message: 'Server configuration error',
            },
          });
        }

        logger.info('[AUTH ROUTE] Bot token configured, validating initData');

        // Validate Telegram initData
        const validation = validateInitData(initData, botToken);

        logger.info('[AUTH ROUTE] Validation result', {
          valid: validation.valid,
          hasUser: !!validation.user,
          error: validation.error,
        });

        if (!validation.valid || !validation.user) {
          logger.warn('[AUTH ROUTE] Invalid Telegram initData', {
            error: validation.error,
            initDataLength: initData.length,
            initDataPreview: initData.substring(0, 200),
          });
          return reply.status(401).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_INIT_DATA',
              message: validation.error || 'Invalid Telegram initData',
            },
          });
        }

        logger.info('[AUTH ROUTE] Telegram user validated', {
          telegramId: validation.user.id,
          username: validation.user.username,
          firstName: validation.user.first_name,
        });

        // Authenticate user (create or update)
        logger.info('[AUTH ROUTE] Calling authService.authenticateViaTelegram');
        const authResult = await authService.authenticateViaTelegram(validation.user);

        logger.info('[AUTH ROUTE] Auth service result', {
          success: authResult.success,
          hasUser: !!authResult.user,
          error: authResult.error,
        });

        if (!authResult.success || !authResult.user) {
          logger.error('[AUTH ROUTE] Failed to authenticate user', {
            telegramId: validation.user.id,
            error: authResult.error,
          });
          return reply.status(500).send({
            success: false,
            data: null,
            error: {
              code: 'AUTHENTICATION_FAILED',
              message: authResult.error || 'Failed to authenticate user',
            },
          });
        }

        // Generate JWT token
        const jwt = (fastify as any).jwt;
        const token = jwt.sign({
          userId: authResult.user.id,
          telegramId: authResult.user.telegramId,
        });

        logger.info('[AUTH ROUTE] User authenticated successfully', {
          userId: authResult.user.id,
          telegramId: authResult.user.telegramId,
          tokenLength: token.length,
        });

        return reply.status(200).send({
          success: true,
          data: {
            token,
            user: authResult.user,
          },
          error: null,
        });
      } catch (error) {
        logger.error('[AUTH ROUTE] Error in /auth/telegram endpoint', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return reply.status(500).send({
          success: false,
          data: null,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/auth/refresh
   * Refresh JWT token (optional endpoint)
   */
  fastify.post<RefreshTokenRequest>(
    '/refresh',
    async (request: FastifyRequest<RefreshTokenRequest>, reply: FastifyReply) => {
      logger.info('[AUTH ROUTE] POST /auth/refresh - Received request');

      try {
        const authHeader = request.headers.authorization;

        if (!authHeader) {
          logger.warn('[AUTH ROUTE] Missing Authorization header in /refresh');
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
          logger.warn('[AUTH ROUTE] Invalid Authorization header format in /refresh');
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

        logger.info('[AUTH ROUTE] Token extracted, verifying');

        // Verify current token
        const jwt = (request.server as any).jwt;
        const decoded = jwt.verify(token) as {
          userId: number;
          telegramId: number;
        };

        logger.info('[AUTH ROUTE] Token verified', { userId: decoded.userId, telegramId: decoded.telegramId });

        // Get user data
        const userResult = await authService.getUserById(decoded.userId);

        if (!userResult.success || !userResult.user) {
          logger.warn('[AUTH ROUTE] User not found during token refresh', { userId: decoded.userId });
          return reply.status(404).send({
            success: false,
            data: null,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        // Generate new token
        const newToken = (fastify as any).jwt.sign({
          userId: userResult.user.id,
          telegramId: userResult.user.telegramId,
        });

        logger.info('[AUTH ROUTE] Token refreshed successfully', { userId: userResult.user.id });

        return reply.status(200).send({
          success: true,
          data: {
            token: newToken,
            user: userResult.user,
          },
          error: null,
        });
      } catch (error) {
        // Handle JWT verification errors
        if (error instanceof Error) {
          if (error.name === 'TokenExpiredError') {
            logger.warn('[AUTH ROUTE] Token expired in /refresh');
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
            logger.warn('[AUTH ROUTE] Invalid token in /refresh');
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

        logger.error('[AUTH ROUTE] Error in /auth/refresh endpoint', {
          error: error instanceof Error ? error.message : String(error),
        });
        return reply.status(500).send({
          success: false,
          data: null,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
        });
      }
    }
  );
}
