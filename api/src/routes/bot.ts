import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WishlistService } from '../services/wishlist.service.js';
import { UserService } from '../services/user.service.js';
import { botAuthMiddleware } from '../middleware/botAuth.js';
import logger from '../utils/logger.js';

interface GetWishlistTextRequest {
  Querystring: {
    telegramId: string;
    page?: string;
    limit?: string;
  };
}

interface GetWishlistSummaryRequest {
  Querystring: {
    telegramId: string;
  };
}

export async function botRoutes(fastify: FastifyInstance): Promise<void> {
  const wishlistService = new WishlistService((fastify as any).prisma);
  const userService = new UserService((fastify as any).prisma);

  /**
   * GET /api/v1/bot/wishlist/text
   * Retrieve user's wishlist formatted as text with emojis for Telegram
   */
  fastify.get<GetWishlistTextRequest>(
    '/wishlist/text',
    {
      onRequest: botAuthMiddleware,
      schema: {
        querystring: {
          type: 'object',
          required: ['telegramId'],
          properties: {
            telegramId: { type: 'string', pattern: '^[0-9]+$' },
            page: { type: 'string', pattern: '^[0-9]+$' },
            limit: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (request: FastifyRequest<GetWishlistTextRequest>, reply: FastifyReply) => {
      try {
        const { telegramId, page, limit } = request.query;

        // Parse telegram ID
        const parsedTelegramId = BigInt(telegramId);

        // Find user by telegram ID
        const user = await userService.findUserByTelegramId(parsedTelegramId);

        if (!user) {
          logger.warn('User not found', { telegramId });
          return reply.status(404).send({
            success: false,
            data: null,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        // Parse and validate pagination parameters
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 20;

        if (parsedPage < 1) {
          logger.warn('Invalid page number', { userId: user.id, page: parsedPage });
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
          logger.warn('Invalid limit', { userId: user.id, limit: parsedLimit });
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
        const result = await wishlistService.getWishlist(user.id, {
          page: parsedPage,
          limit: parsedLimit,
        });

        // Format as text with emojis for Telegram
        let text = '';

        if (result.items.length === 0) {
          text = '📋 Your wishlist is empty\n\n';
          text += 'Use the /add command to add tobacco flavors to your wishlist!';
        } else {
          text = `📋 Your Wishlist (${result.pagination.total} items)\n\n`;

          result.items.forEach((item, index) => {
            const itemNumber = (parsedPage - 1) * parsedLimit + index + 1;
            text += `${itemNumber}. ${item.tobacco.brand.name} - ${item.tobacco.name}\n`;
            if (item.tobacco.description) {
              text += `   📝 ${item.tobacco.description}\n`;
            }
            if (item.notes) {
              text += `   💭 Note: ${item.notes}\n`;
            }
            if (item.tobacco.price) {
              text += `   💰 Price: ${item.tobacco.price}₽\n`;
            }
            if (item.tobacco.inStock !== null) {
              text += `   ${item.tobacco.inStock ? '✅ In stock' : '❌ Out of stock'}\n`;
            }
            text += '\n';
          });

          // Add pagination info
          text += `📄 Page ${parsedPage} of ${result.pagination.totalPages}\n`;
          text += `Showing ${result.items.length} of ${result.pagination.total} items`;
        }

        logger.info('Bot wishlist text retrieved successfully', {
          userId: user.id,
          telegramId,
          page: parsedPage,
          limit: parsedLimit,
          total: result.pagination.total,
        });

        return reply.status(200).send({
          success: true,
          data: {
            text,
            pagination: result.pagination,
          },
          error: null,
        });
      } catch (error) {
        logger.error('Error in GET /bot/wishlist/text endpoint', { error });
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
   * GET /api/v1/bot/wishlist/summary
   * Retrieve a summary of user's wishlist
   */
  fastify.get<GetWishlistSummaryRequest>(
    '/wishlist/summary',
    {
      onRequest: botAuthMiddleware,
      schema: {
        querystring: {
          type: 'object',
          required: ['telegramId'],
          properties: {
            telegramId: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (request: FastifyRequest<GetWishlistSummaryRequest>, reply: FastifyReply) => {
      try {
        const { telegramId } = request.query;

        // Parse telegram ID
        const parsedTelegramId = BigInt(telegramId);

        // Find user by telegram ID
        const user = await userService.findUserByTelegramId(parsedTelegramId);

        if (!user) {
          logger.warn('User not found', { telegramId });
          return reply.status(404).send({
            success: false,
            data: null,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        // Get wishlist (first page with max 3 items)
        const result = await wishlistService.getWishlist(user.id, {
          page: 1,
          limit: 3,
        });

        // Get last updated timestamp from the most recent item
        const lastUpdated = result.items.length > 0 ? result.items[0].addedAt : null;

        logger.info('Bot wishlist summary retrieved successfully', {
          userId: user.id,
          telegramId,
          totalItems: result.pagination.total,
        });

        return reply.status(200).send({
          success: true,
          data: {
            totalItems: result.pagination.total,
            recentItems: result.items.map((item) => ({
              id: item.id,
              tobacco: {
                id: item.tobacco.id,
                name: item.tobacco.name,
                brand: item.tobacco.brand.name,
              },
              addedAt: item.addedAt,
            })),
            lastUpdated,
          },
          error: null,
        });
      } catch (error) {
        logger.error('Error in GET /bot/wishlist/summary endpoint', { error });
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
