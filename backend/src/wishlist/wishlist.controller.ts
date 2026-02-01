import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Query('telegramId') telegramId: string) {
    return this.wishlistService.getUserWishlist(telegramId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(@Body() addToWishlistDto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(
      addToWishlistDto.telegramId,
      addToWishlistDto.tobaccoId,
      addToWishlistDto.tobaccoName,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeFromWishlist(@Param('id') id: string, @Query('telegramId') telegramId: string) {
    return this.wishlistService.removeFromWishlist(id, telegramId);
  }
}
