import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedBrands {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BrandService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all brands with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of brands
   */
  async getBrands(params: PaginationParams): Promise<PaginatedBrands> {
    try {
      const { page = 1, limit = 20 } = params;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.brand.count();

      // Get paginated results
      const brands = await this.prisma.brand.findMany({
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      });

      const totalPages = Math.ceil(total / limit);

      logger.info('Brands retrieved successfully', {
        page,
        limit,
        total,
        results: brands.length,
      });

      return {
        data: brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          imageUrl: brand.imageUrl,
          createdAt: brand.createdAt,
          updatedAt: brand.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error fetching brands', { error, params });
      throw new Error('Failed to fetch brands');
    }
  }

  /**
   * Get brand by slug with tobacco count
   * @param slug - Brand slug
   * @returns Brand with tobacco count or null if not found
   */
  async getBrandBySlug(slug: string): Promise<any | null> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              tobaccos: true,
            },
          },
        },
      });

      if (!brand) {
        logger.debug('Brand not found', { slug });
        return null;
      }

      logger.info('Brand retrieved successfully', { slug });

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        imageUrl: brand.imageUrl,
        tobaccoCount: brand._count.tobaccos,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      };
    } catch (error) {
      logger.error('Error fetching brand', { error, slug });
      throw new Error('Failed to fetch brand');
    }
  }
}
