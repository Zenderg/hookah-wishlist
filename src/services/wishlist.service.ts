import logger from '@/utils/logger';
import { wishlistStorage } from '@/storage';
import { Wishlist, WishlistItem, WishlistWithDetails } from '@/models/wishlist';
import searchService from './search.service';

export class WishlistService {
  private getWishlistKey(userId: number): string {
    return `wishlist_${userId}`;
  }

  async getWishlist(userId: number): Promise<Wishlist | null> {
    logger.info(`Getting wishlist for user ${userId}`);

    const key = this.getWishlistKey(userId);
    const wishlist = await wishlistStorage.get(key) as Wishlist | null;

    return wishlist;
  }

  async getWishlistWithDetails(userId: number): Promise<WishlistWithDetails | null> {
    const wishlist = await this.getWishlist(userId);
    
    if (!wishlist) {
      return null;
    }

    // Fetch tobacco details for each item
    const itemsWithDetails = await Promise.all(
      wishlist.items.map(async (item) => {
        const tobacco = await searchService.getTobaccoDetails(item.tobaccoId);
        return {
          ...item,
          tobacco: tobacco || undefined,
        };
      })
    );

    return {
      ...wishlist,
      items: itemsWithDetails,
    };
  }

  async createWishlist(userId: number): Promise<Wishlist> {
    logger.info(`Creating wishlist for user ${userId}`);

    const now = new Date().toISOString();
    const wishlist: Wishlist = {
      userId,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.saveWishlist(wishlist);

    return wishlist;
  }

  async saveWishlist(wishlist: Wishlist): Promise<void> {
    logger.info(`Saving wishlist for user ${wishlist.userId}`);

    const key = this.getWishlistKey(wishlist.userId);
    await wishlistStorage.set(key, wishlist);
  }

  async addItem(userId: number, tobaccoId: string, notes?: string): Promise<Wishlist> {
    logger.info(`Adding tobacco ${tobaccoId} to wishlist for user ${userId}`);

    let wishlist = await this.getWishlist(userId);

    if (!wishlist) {
      wishlist = await this.createWishlist(userId);
    }

    // Check if item already exists
    const existingItem = wishlist.items.find((item) => item.tobaccoId === tobaccoId);
    if (existingItem) {
      throw new Error('Tobacco already in wishlist');
    }

    const newItem: WishlistItem = {
      tobaccoId,
      addedAt: new Date().toISOString(),
      notes,
    };

    wishlist.items.push(newItem);
    wishlist.updatedAt = new Date().toISOString();

    await this.saveWishlist(wishlist);

    return wishlist;
  }

  async removeItem(userId: number, tobaccoId: string): Promise<Wishlist> {
    logger.info(`Removing tobacco ${tobaccoId} from wishlist for user ${userId}`);

    const wishlist = await this.getWishlist(userId);

    if (!wishlist) {
      throw new Error('Wishlist not found');
    }

    const itemIndex = wishlist.items.findIndex((item) => item.tobaccoId === tobaccoId);
    if (itemIndex === -1) {
      throw new Error('Tobacco not found in wishlist');
    }

    wishlist.items.splice(itemIndex, 1);
    wishlist.updatedAt = new Date().toISOString();

    await this.saveWishlist(wishlist);

    return wishlist;
  }

  async clearWishlist(userId: number): Promise<void> {
    logger.info(`Clearing wishlist for user ${userId}`);

    const wishlist = await this.getWishlist(userId);

    if (!wishlist) {
      throw new Error('Wishlist not found');
    }

    wishlist.items = [];
    wishlist.updatedAt = new Date().toISOString();

    await this.saveWishlist(wishlist);
  }

  formatWishlist(wishlist: WishlistWithDetails): string {
    if (wishlist.items.length === 0) {
      return '📋 Your wishlist is empty.\n\nUse /search to find tobaccos and /add to add them to your wishlist.';
    }

    let message = `📋 Your Wishlist (${wishlist.items.length} items)\n\n`;

    wishlist.items.forEach((item, index) => {
      message += `${index + 1}. ${item.tobacco?.brand || 'Unknown'} - ${item.tobacco?.name || 'Unknown'}\n`;
      message += `   🏷️ ID: ${item.tobaccoId}\n`;
      if (item.tobacco?.flavor) {
        message += `   🍃 Flavor: ${item.tobacco.flavor}\n`;
      }
      if (item.notes) {
        message += `   📝 Notes: ${item.notes}\n`;
      }
      message += `   ➕ Added: ${new Date(item.addedAt).toLocaleDateString()}\n\n`;
    });

    message += `Use /remove <tobacco_id> to remove items from your wishlist`;

    return message;
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
