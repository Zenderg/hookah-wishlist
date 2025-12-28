import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from '../config/logger.js';
import type {
  ScrapedBrand,
  ScrapedTobacco,
  BrandUpsertResult,
  TobaccoUpsertResult,
} from '../types/index.js';

/**
 * PostgreSQL connection pool
 */
let pool: Pool | null = null;

/**
 * Prisma adapter
 */
let adapter: PrismaPg | null = null;

/**
 * Prisma client instance
 * Singleton pattern to avoid multiple connections
 */
let prisma: PrismaClient | null = null;

/**
 * Initialize or get Prisma client instance
 * @returns Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    logger.info('Initializing Prisma Client...');

    // Create PostgreSQL connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create Prisma adapter
    adapter = new PrismaPg(pool);

    // Initialize Prisma Client with adapter (same as API)
    // Note: We're using Prisma Client from root project
    prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });

    logger.info('Prisma Client initialized successfully');
  }

  return prisma;
}

/**
 * Test database connection
 * @returns Promise that resolves when connection is successful
 */
export async function testConnection(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from database
 * @returns Promise that resolves when disconnection is complete
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Prisma client disconnected');
  }
  if (adapter) {
    adapter = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  }
}

/**
 * Create or update a brand based on slug
 * @param brand - Scraped brand data
 * @returns Promise resolving to BrandUpsertResult
 */
export async function upsertBrand(brand: ScrapedBrand): Promise<BrandUpsertResult> {
  try {
    const client = getPrismaClient();

    // Check if brand already exists
    const existingBrand = await client.brand.findUnique({
      where: { slug: brand.slug },
    });

    if (existingBrand) {
      // Update existing brand
      const updatedBrand = await client.brand.update({
        where: { slug: brand.slug },
        data: {
          name: brand.name,
          description: brand.description || null,
          imageUrl: brand.imageUrl || null,
          htreviewsUrl: brand.htreviewsUrl,
          updatedAt: new Date(),
        },
      });

      logger.debug(`Updated brand: ${brand.name} (ID: ${updatedBrand.id})`);
      return {
        success: true,
        brandId: updatedBrand.id,
        isNew: false,
      };
    } else {
      // Create new brand
      const newBrand = await client.brand.create({
        data: {
          name: brand.name,
          slug: brand.slug,
          description: brand.description || null,
          imageUrl: brand.imageUrl || null,
          htreviewsUrl: brand.htreviewsUrl,
          updatedAt: new Date(),
        },
      });

      logger.debug(`Created brand: ${brand.name} (ID: ${newBrand.id})`);
      return {
        success: true,
        brandId: newBrand.id,
        isNew: true,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to upsert brand ${brand.name}: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
      isNew: false,
    };
  }
}

/**
 * Create or update a tobacco based on brandId + slug
 * @param brandId - Database ID of brand
 * @param tobacco - Scraped tobacco data
 * @returns Promise resolving to TobaccoUpsertResult
 */
export async function upsertTobacco(
  brandId: number,
  tobacco: ScrapedTobacco
): Promise<TobaccoUpsertResult> {
  try {
    const client = getPrismaClient();

    // Check if tobacco already exists for this brand
    const existingTobacco = await client.tobacco.findFirst({
      where: {
        brandId,
        slug: tobacco.slug,
      },
    });

    if (existingTobacco) {
      // Update existing tobacco
      const updatedTobacco = await client.tobacco.update({
        where: {
          id: existingTobacco.id,
        },
        data: {
          name: tobacco.name,
          description: tobacco.description || null,
          imageUrl: tobacco.imageUrl || null,
          htreviewsUrl: tobacco.htreviewsUrl,
          metadata: tobacco.metadata as any,
          scrapedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.debug(
        `Updated tobacco: ${tobacco.name} (ID: ${updatedTobacco.id}, Brand ID: ${brandId})`
      );
      return {
        success: true,
        tobaccoId: updatedTobacco.id,
        isNew: false,
      };
    } else {
      // Create new tobacco
      const newTobacco = await client.tobacco.create({
        data: {
          brandId,
          name: tobacco.name,
          slug: tobacco.slug,
          description: tobacco.description || null,
          imageUrl: tobacco.imageUrl || null,
          htreviewsUrl: tobacco.htreviewsUrl,
          metadata: tobacco.metadata as any,
          scrapedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.debug(
        `Created tobacco: ${tobacco.name} (ID: ${newTobacco.id}, Brand ID: ${brandId})`
      );
      return {
        success: true,
        tobaccoId: newTobacco.id,
        isNew: true,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to upsert tobacco ${tobacco.name} for brand ID ${brandId}: ${errorMessage}`
    );
    return {
      success: false,
      error: errorMessage,
      isNew: false,
    };
  }
}

/**
 * Get a brand by its slug
 * @param slug - Brand slug
 * @returns Promise resolving to brand or null if not found
 */
export async function getBrandBySlug(
  slug: string
): Promise<{ id: number; name: string } | null> {
  try {
    const client = getPrismaClient();

    const brand = await client.brand.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
      },
    });

    return brand;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to get brand by slug ${slug}: ${errorMessage}`);
    return null;
  }
}

/**
 * Get all brands from database
 * @returns Promise resolving to array of brands
 */
export async function getAllBrands(): Promise<
  Array<{ id: number; name: string; slug: string }>
> {
  try {
    const client = getPrismaClient();

    const brands = await client.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return brands;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to get all brands: ${errorMessage}`);
    return [];
  }
}

/**
 * Get tobacco count for a specific brand
 * @param brandId - Brand database ID
 * @returns Promise resolving to count of tobaccos
 */
export async function getTobaccoCount(brandId: number): Promise<number> {
  try {
    const client = getPrismaClient();

    const count = await client.tobacco.count({
      where: { brandId },
    });

    return count;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to get tobacco count for brand ID ${brandId}: ${errorMessage}`
    );
    return 0;
  }
}

export default {
  getPrismaClient,
  testConnection,
  disconnectDatabase,
  upsertBrand,
  upsertTobacco,
  getBrandBySlug,
  getAllBrands,
  getTobaccoCount,
};
