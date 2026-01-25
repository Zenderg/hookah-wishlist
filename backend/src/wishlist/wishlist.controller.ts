import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Body() body: { telegramId: string }) {
    return this.wishlistService.getUserWishlist(body.telegramId);
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
  async removeFromWishlist(@Param('id') id: string, @Body() body: { telegramId: string }) {
    return this.wishlistService.removeFromWishlist(id, body.telegramId);
  }
}
