import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BrandService } from '../services/brand.service.js';
import logger from '../utils/logger.js';

interface GetBrandsRequest {
  Querystring: {
    page?: string;
    limit?: string;
  };
}

interface GetBrandBySlugRequest {
  Params: {
    slug: string;
  };
}

export async function brandRoutes(fastify: FastifyInstance): Promise<void> {
  const brandService = new BrandService((fastify as any).prisma);

  /**
   * GET /api/v1/brands
   * List all brands with pagination
   */
  fastify.get<GetBrandsRequest>(
    '/',
    {
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
    async (request: FastifyRequest<GetBrandsRequest>, reply: FastifyReply) => {
      try {
        const { page, limit } = request.query;

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

        // Get brands
        const result = await brandService.getBrands({
          page: parsedPage,
          limit: parsedLimit,
        });

        logger.info('Brands retrieved successfully', {
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
        logger.error('Error in GET /brands endpoint', { error });
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
   * GET /api/v1/brands/:slug
   * Get brand details by slug
   */
  fastify.get<GetBrandBySlugRequest>(
    '/:slug',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
          required: ['slug'],
        },
      },
    },
    async (request: FastifyRequest<GetBrandBySlugRequest>, reply: FastifyReply) => {
      try {
        const { slug } = request.params;

        if (!slug || slug.trim().length === 0) {
          logger.warn('Empty slug provided');
          return reply.status(400).send({
            success: false,
            data: null,
            error: {
              code: 'INVALID_SLUG',
              message: 'Slug is required',
            },
          });
        }

        // Get brand by slug
        const brand = await brandService.getBrandBySlug(slug);

        if (!brand) {
          logger.warn('Brand not found', { slug });
          return reply.status(404).send({
            success: false,
            data: null,
            error: {
              code: 'BRAND_NOT_FOUND',
              message: 'Brand not found',
            },
          });
        }

        logger.info('Brand retrieved successfully', { slug });

        return reply.status(200).send({
          success: true,
          data: brand,
          error: null,
        });
      } catch (error) {
        logger.error('Error in GET /brands/:slug endpoint', { error });
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
