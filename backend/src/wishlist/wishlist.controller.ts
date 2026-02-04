import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { TelegramId } from '../auth/decorators/telegram-id.decorator';

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@TelegramId() telegramId: string) {
    return this.wishlistService.getUserWishlist(telegramId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(@TelegramId() telegramId: string, @Body() addToWishlistDto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(telegramId, addToWishlistDto.tobaccoId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeFromWishlist(@Param('id') id: string, @TelegramId() telegramId: string) {
    return this.wishlistService.removeFromWishlist(id, telegramId);
  }
}
