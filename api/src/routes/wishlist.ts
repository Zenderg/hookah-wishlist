import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WishlistService } from '../services/wishlist.service.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

interface GetWishlistRequest {
  Querystring: {
    page?: string;
    limit?: string;
  };
}

interface AddToWishlistRequest {
  Body: {
    tobaccoId: string;
    notes?: string;
  };
}

interface RemoveFromWishlistRequest {
  Params: {
    id: string;
  };
}

export async function wishlistRoutes(fastify: FastifyInstance): Promise<void> {
  const wishlistService = new WishlistService((fastify as any).prisma);

  /**
   * GET /api/v1/wishlist
   * Retrieve user's wishlist
   */
  fastify.get<GetWishlistRequest>(
    '/',
    {
      onRequest: authMiddleware,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', pattern: '^[0-9]+$' },
            limit: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (request: FastifyRequest<GetWishlistRequest>, reply: FastifyReply) => {
      try {
        const authenticatedRequest = request as AuthenticatedRequest;
        const userId = authenticatedRequest.user.userId;
        const { page, limit } = request.query;

        // Parse and validate pagination parameters
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 20;

        if (parsedPage < 1) {
          logger.warn('Invalid page number', { userId, page: parsedPage });
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_PAGE',
              message: 'Page must be a positive number',
            },
          });
        }

        if (parsedLimit < 1 || parsedLimit > 100) {
          logger.warn('Invalid limit', { userId, limit: parsedLimit });
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_LIMIT',
              message: 'Limit must be between 1 and 100',
            },
          });
        }

        // Get wishlist
        const result = await wishlistService.getWishlist(userId, {
          page: parsedPage,
          limit: parsedLimit,
        });

        logger.info('Wishlist retrieved successfully', {
          userId,
          page: parsedPage,
          limit: parsedLimit,
          total: result.pagination.total,
        });

        return reply.status(200).send({
          success: true,
          data: result,
          error: null,
        });
      } catch (error) {
        logger.error('Error in GET /wishlist endpoint', { error });
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
   * POST /api/v1/wishlist/items
   * Add item to wishlist
   */
  fastify.post<AddToWishlistRequest>(
    '/items',
    {
      onRequest: authMiddleware,
      schema: {
        body: {
          type: 'object',
          required: ['tobaccoId'],
          properties: {
            tobaccoId: { type: 'string', pattern: '^[0-9]+$' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<AddToWishlistRequest>, reply: FastifyReply) => {
      try {
        const authenticatedRequest = request as AuthenticatedRequest;
        const userId = authenticatedRequest.user.userId;
        const { tobaccoId, notes } = request.body;

        // Parse tobacco ID
        const parsedTobaccoId = parseInt(tobaccoId, 10);

        if (isNaN(parsedTobaccoId) || parsedTobaccoId < 1) {
          logger.warn('Invalid tobacco ID', { userId, tobaccoId });
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_TOBACCO_ID',
              message: 'Tobacco ID must be a positive number',
            },
          });
        }

        // Add to wishlist
        const result = await wishlistService.addToWishlist({
          userId,
          tobaccoId: parsedTobaccoId,
          notes,
        });

        if (!result.success) {
          logger.warn('Failed to add to wishlist', {
            userId,
            tobaccoId: parsedTobaccoId,
            error: result.error,
          });

          // Return appropriate error code
          const error = result.error as string;
          const statusCodeMap: Record<string, number> = {
            TOBACCO_NOT_FOUND: 404,
            ALREADY_IN_WISHLIST: 409,
          };

          const statusCode = error in statusCodeMap ? statusCodeMap[error] : 400;

          return reply.status(statusCode).send({
            success: false,
            data: null,
            error: {
              code: result.error,
              message: result.message,
            },
          });
        }

        logger.info('Item added to wishlist successfully', {
          userId,
          wishlistItemId: result.item?.id,
          tobaccoId: parsedTobaccoId,
        });

        return reply.status(201).send({
          success: true,
          data: result.item,
          error: null,
        });
      } catch (error) {
        logger.error('Error in POST /wishlist/items endpoint', { error });
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
   * DELETE /api/v1/wishlist/items/:id
   * Remove item from wishlist
   */
  fastify.delete<RemoveFromWishlistRequest>(
    '/items/:id',
    {
      onRequest: authMiddleware,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', pattern: '^[0-9]+$' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest<RemoveFromWishlistRequest>, reply: FastifyReply) => {
      try {
        const authenticatedRequest = request as AuthenticatedRequest;
        const userId = authenticatedRequest.user.userId;
        const { id } = request.params;

        // Parse item ID
        const parsedItemId = parseInt(id, 10);

        if (isNaN(parsedItemId) || parsedItemId < 1) {
          logger.warn('Invalid wishlist item ID', { userId, itemId: id });
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_ITEM_ID',
              message: 'Item ID must be a positive number',
            },
          });
        }

        // Remove from wishlist
        const result = await wishlistService.removeFromWishlist({
          userId,
          itemId: parsedItemId,
        });

        if (!result.success) {
          logger.warn('Failed to remove from wishlist', {
            userId,
            itemId: parsedItemId,
            error: result.error,
          });

          // Return appropriate error code
          const error = result.error as string;
          const statusCodeMap: Record<string, number> = {
            WISHLIST_NOT_FOUND: 404,
            WISHLIST_ITEM_NOT_FOUND: 404,
          };

          const statusCode = error in statusCodeMap ? statusCodeMap[error] : 400;

          return reply.status(statusCode).send({
            success: false,
            data: null,
            error: {
              code: result.error,
              message: result.message,
            },
          });
        }

        logger.info('Item removed from wishlist successfully', {
          userId,
          itemId: parsedItemId,
        });

        return reply.status(200).send({
          success: true,
          data: {
            message: result.message,
          },
          error: null,
        });
      } catch (error) {
        logger.error('Error in DELETE /wishlist/items/:id endpoint', { error });
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
