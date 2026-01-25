import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async addToWishlist(telegramId: string, tobaccoId: string, tobaccoName: string): Promise<WishlistItem> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
      tobaccoName,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(id: string, telegramId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
