import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { User } from '../database/entities/user.entity';
import { HookahDbService, TobaccoWithDetails } from '../hookah-db/hookah-db.service';

// Wishlist item with full tobacco details
export interface WishlistItemWithDetails extends WishlistItem {
  tobacco: TobaccoWithDetails;
}

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private hookahDbService: HookahDbService,
  ) {}

  async getUserWishlist(telegramId: string): Promise<WishlistItem[]> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
    });

    if (!user) {
      return [];
    }

    return this.wishlistRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  // Get user wishlist with full tobacco details
  async getUserWishlistWithDetails(telegramId: string): Promise<WishlistItemWithDetails[]> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
    });

    if (!user) {
      return [];
    }

    const wishlistItems = await this.wishlistRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    if (wishlistItems.length === 0) {
      return [];
    }

    // Get tobacco IDs
    const tobaccoIds = wishlistItems.map((item) => item.tobaccoId);

    // Fetch tobaccos with brand and line details
    const tobaccos = await this.hookahDbService.getTobaccosByIdsWithDetails(tobaccoIds);

    // Create a map for quick lookup
    const tobaccoMap = new Map(tobaccos.map((tobacco) => [tobacco.id, tobacco]));

    // Combine wishlist items with tobacco details
    return wishlistItems
      .map((item) => {
        const tobacco = tobaccoMap.get(item.tobaccoId);
        if (!tobacco) {
          return null;
        }
        return {
          ...item,
          tobacco,
        };
      })
      .filter((item): item is WishlistItemWithDetails => item !== null);
  }

  async addToWishlist(telegramId: string, tobaccoId: string): Promise<WishlistItem> {
    let user = await this.userRepository.findOne({
      where: { telegramId },
    });

    // Create user if they don't exist (for better UX, especially with mock users)
    if (!user) {
      user = this.userRepository.create({
        telegramId,
        username: null, // Username will be updated when user validates via auth endpoint
      });
      await this.userRepository.save(user);
    }

    const existingItem = await this.wishlistRepository.findOne({
      where: { userId: user.id, tobaccoId },
    });

    if (existingItem) {
      return existingItem;
    }

    const wishlistItem = this.wishlistRepository.create({
      userId: user.id,
      tobaccoId,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(id: string, telegramId: string): Promise<void> {
    let user = await this.userRepository.findOne({
      where: { telegramId },
    });

    // Create user if they don't exist (for better UX, especially with mock users)
    if (!user) {
      user = this.userRepository.create({
        telegramId,
        username: null, // Username will be updated when user validates via auth endpoint
      });
      await this.userRepository.save(user);
    }

    const wishlistItem = await this.wishlistRepository.findOne({
      where: { id: Number(id) },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Wishlist item not found');
    }

    if (wishlistItem.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this item');
    }

    await this.wishlistRepository.delete(id);
  }
}
