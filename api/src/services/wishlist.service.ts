import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

interface GetWishlistOptions {
  page?: number;
  limit?: number;
}

interface AddToWishlistOptions {
  userId: number;
  tobaccoId: number;
  notes?: string;
}

interface RemoveFromWishlistOptions {
  userId: number;
  itemId: number;
}

export class WishlistService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or create user's wishlist
   */
  private async getOrCreateWishlist(userId: number) {
    let wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: { userId },
      });
      logger.info('Created new wishlist for user', { userId });
    }

    return wishlist;
  }

  /**
   * Get user's wishlist with pagination
   */
  async getWishlist(userId: number, options: GetWishlistOptions = {}) {
    const { page = 1, limit = 20 } = options;

    // Get or create wishlist
    const wishlist = await this.getOrCreateWishlist(userId);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.wishlistItem.count({
      where: { wishlistId: wishlist.id },
    });

    // Get items with pagination
    const items = await this.prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        tobacco: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        addedAt: item.addedAt,
        notes: item.notes,
        tobacco: {
          id: item.tobacco.id,
          name: item.tobacco.name,
          slug: item.tobacco.slug,
          description: item.tobacco.description,
          imageUrl: item.tobacco.imageUrl,
          price: item.tobacco.price ? Number(item.tobacco.price) : null,
          inStock: item.tobacco.inStock,
          brand: {
            id: item.tobacco.brand.id,
            name: item.tobacco.brand.name,
            slug: item.tobacco.brand.slug,
            imageUrl: item.tobacco.brand.imageUrl,
          },
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add tobacco to user's wishlist
   */
  async addToWishlist(options: AddToWishlistOptions) {
    const { userId, tobaccoId, notes } = options;

    // Check if tobacco exists
    const tobacco = await this.prisma.tobacco.findUnique({
      where: { id: tobaccoId },
    });

    if (!tobacco) {
      return {
        success: false,
        error: 'TOBACCO_NOT_FOUND',
        message: 'Tobacco not found',
      };
    }

    // Get or create wishlist
    const wishlist = await this.getOrCreateWishlist(userId);

    // Check if already in wishlist
    const existingItem = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_tobaccoId: {
          wishlistId: wishlist.id,
          tobaccoId,
        },
      },
    });

    if (existingItem) {
      return {
        success: false,
        error: 'ALREADY_IN_WISHLIST',
        message: 'Tobacco is already in your wishlist',
      };
    }

    // Add to wishlist
    const wishlistItem = await this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        tobaccoId,
        notes,
      },
      include: {
        tobacco: {
          include: {
            brand: true,
          },
        },
      },
    });

    logger.info('Tobacco added to wishlist', {
      userId,
      wishlistItemId: wishlistItem.id,
      tobaccoId,
    });

    return {
      success: true,
      item: {
        id: wishlistItem.id,
        addedAt: wishlistItem.addedAt,
        notes: wishlistItem.notes,
        tobacco: {
          id: wishlistItem.tobacco.id,
          name: wishlistItem.tobacco.name,
          slug: wishlistItem.tobacco.slug,
          description: wishlistItem.tobacco.description,
          imageUrl: wishlistItem.tobacco.imageUrl,
          price: wishlistItem.tobacco.price ? Number(wishlistItem.tobacco.price) : null,
          inStock: wishlistItem.tobacco.inStock,
          brand: {
            id: wishlistItem.tobacco.brand.id,
            name: wishlistItem.tobacco.brand.name,
            slug: wishlistItem.tobacco.brand.slug,
            imageUrl: wishlistItem.tobacco.brand.imageUrl,
          },
        },
      },
    };
  }

  /**
   * Remove item from user's wishlist
   */
  async removeFromWishlist(options: RemoveFromWishlistOptions) {
    const { userId, itemId } = options;

    // Get user's wishlist
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return {
        success: false,
        error: 'WISHLIST_NOT_FOUND',
        message: 'Wishlist not found',
      };
    }

    // Check if item belongs to user's wishlist
    const wishlistItem = await this.prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlistId: wishlist.id,
      },
    });

    if (!wishlistItem) {
      return {
        success: false,
        error: 'WISHLIST_ITEM_NOT_FOUND',
        message: 'Wishlist item not found',
      };
    }

    // Delete item
    await this.prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    logger.info('Tobacco removed from wishlist', {
      userId,
      wishlistItemId: itemId,
    });

    return {
      success: true,
      message: 'Item removed from wishlist successfully',
    };
  }
}
