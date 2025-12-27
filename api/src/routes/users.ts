import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const userService = new UserService((fastify as any).prisma);

  /**
   * GET /api/v1/users/me
   * Returns the currently authenticated user's profile
   */
  fastify.get(
    '/me',
    {
      onRequest: authMiddleware,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authenticatedRequest = request as AuthenticatedRequest;
        const userId = authenticatedRequest.user.userId;

        // Get user by ID
        const user = await userService.getUserById(userId);

        if (!user) {
          logger.warn('User not found', { userId });
          return reply.status(404).send({
            success: false,
            data: null,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        logger.info('User profile retrieved successfully', { userId });

        return reply.status(200).send({
          success: true,
          data: {
            id: user.id,
            telegramId: Number(user.telegramId),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          error: null,
        });
      } catch (error) {
        logger.error('Error in /users/me endpoint', { error });
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
