import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
  ) {}

  async getUserWishlist(telegramId: string): Promise<WishlistItem[]> {
    // TODO: Get user ID from telegram ID
    // For now, just return empty array
    return [];
  }

  async addToWishlist(telegramId: string, tobaccoId: string, tobaccoName: string): Promise<WishlistItem> {
    // TODO: Get user ID from telegram ID and add to wishlist
    // For now, just return empty object
    return {} as WishlistItem;
  }

  async removeFromWishlist(id: string, telegramId: string): Promise<void> {
    // TODO: Remove item from wishlist for user
  }
}
