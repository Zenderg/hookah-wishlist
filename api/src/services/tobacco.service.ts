import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

export interface TobaccoSearchParams {
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedTobaccos {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TobaccoService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Search tobaccos with pagination
   * @param params - Search parameters including search query, page, and limit
   * @returns Paginated list of tobaccos with brand information
   */
  async searchTobaccos(params: TobaccoSearchParams): Promise<PaginatedTobaccos> {
    try {
      const { search, page = 1, limit = 20 } = params;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build where clause for search
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { brand: { name: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {};

      // Get total count
      const total = await this.prisma.tobacco.count({ where });

      // Get paginated results
      const tobaccos = await this.prisma.tobacco.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      const totalPages = Math.ceil(total / limit);

      logger.info('Tobaccos searched successfully', {
        search,
        page,
        limit,
        total,
        results: tobaccos.length,
      });

      return {
        data: tobaccos.map((tobacco) => ({
          id: tobacco.id,
          name: tobacco.name,
          slug: tobacco.slug,
          description: tobacco.description,
          imageUrl: tobacco.imageUrl,
          price: tobacco.price ? Number(tobacco.price) : null,
          inStock: tobacco.inStock,
          brand: {
            id: tobacco.brand.id,
            name: tobacco.brand.name,
            slug: tobacco.brand.slug,
            imageUrl: tobacco.brand.imageUrl,
          },
          createdAt: tobacco.createdAt,
          updatedAt: tobacco.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error searching tobaccos', { error, params });
      throw new Error('Failed to search tobaccos');
    }
  }

  /**
   * Get tobacco by ID
   * @param id - Tobacco ID
   * @returns Tobacco with brand information or null if not found
   */
  async getTobaccoById(id: number): Promise<any | null> {
    try {
      const tobacco = await this.prisma.tobacco.findUnique({
        where: { id },
        include: {
          brand: true,
        },
      });

      if (!tobacco) {
        logger.debug('Tobacco not found', { id });
        return null;
      }

      logger.info('Tobacco retrieved successfully', { id });

      return {
        id: tobacco.id,
        name: tobacco.name,
        slug: tobacco.slug,
        description: tobacco.description,
        imageUrl: tobacco.imageUrl,
        price: tobacco.price ? Number(tobacco.price) : null,
        inStock: tobacco.inStock,
        brand: {
          id: tobacco.brand.id,
          name: tobacco.brand.name,
          slug: tobacco.brand.slug,
          description: tobacco.brand.description,
          imageUrl: tobacco.brand.imageUrl,
        },
        createdAt: tobacco.createdAt,
        updatedAt: tobacco.updatedAt,
      };
    } catch (error) {
      logger.error('Error fetching tobacco', { error, id });
      throw new Error('Failed to fetch tobacco');
    }
  }
}
