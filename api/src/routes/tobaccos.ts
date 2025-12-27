import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TobaccoService } from '../services/tobacco.service.js';
import logger from '../utils/logger.js';

interface GetTobaccosRequest {
  Querystring: {
    search?: string;
    page?: string;
    limit?: string;
  };
}

interface GetTobaccoByIdRequest {
  Params: {
    id: string;
  };
}

export async function tobaccoRoutes(fastify: FastifyInstance): Promise<void> {
  const tobaccoService = new TobaccoService((fastify as any).prisma);

  /**
   * GET /api/v1/tobaccos
   * Search tobaccos with pagination
   */
  fastify.get<GetTobaccosRequest>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            page: { type: 'string', pattern: '^[0-9]+$' },
            limit: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (request: FastifyRequest<GetTobaccosRequest>, reply: FastifyReply) => {
      try {
        const { search, page, limit } = request.query;

        // Parse and validate pagination parameters
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 20;

        if (parsedPage < 1) {
          logger.warn('Invalid page number', { page: parsedPage });
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
          logger.warn('Invalid limit', { limit: parsedLimit });
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_LIMIT',
              message: 'Limit must be between 1 and 100',
            },
          });
        }

        // Search tobaccos
        const result = await tobaccoService.searchTobaccos({
          search,
          page: parsedPage,
          limit: parsedLimit,
        });

        logger.info('Tobaccos retrieved successfully', {
          search,
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
        logger.error('Error in GET /tobaccos endpoint', { error });
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
   * GET /api/v1/tobaccos/:id
   * Get tobacco details by ID
   */
  fastify.get<GetTobaccoByIdRequest>(
    '/:id',
    {
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
    async (request: FastifyRequest<GetTobaccoByIdRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const tobaccoId = parseInt(id, 10);

        if (isNaN(tobaccoId) || tobaccoId < 1) {
          logger.warn('Invalid tobacco ID', { id });
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_ID',
              message: 'ID must be a positive number',
            },
          });
        }

        // Get tobacco by ID
        const tobacco = await tobaccoService.getTobaccoById(tobaccoId);

        if (!tobacco) {
          logger.warn('Tobacco not found', { id: tobaccoId });
          return reply.status(404).send({
            success: false,
            data: null,
            error: {
              code: 'TOBACCO_NOT_FOUND',
              message: 'Tobacco not found',
            },
          });
        }

        logger.info('Tobacco retrieved successfully', { id: tobaccoId });

        return reply.status(200).send({
          success: true,
          data: tobacco,
          error: null,
        });
      } catch (error) {
        logger.error('Error in GET /tobaccos/:id endpoint', { error });
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
