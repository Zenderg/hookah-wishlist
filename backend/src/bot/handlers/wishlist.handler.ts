import { Injectable } from '@nestjs/common';
import { WishlistService } from '../../wishlist/wishlist.service';

@Injectable()
export class WishlistHandler {
  constructor(private readonly wishlistService: WishlistService) {}

  async handle(ctx: any) {
    const telegramId = ctx.from?.id?.toString();

    if (!telegramId) {
      await ctx.reply('❌ Unable to identify user. Please try again.');
      return;
    }

    const wishlist = await this.wishlistService.getUserWishlist(telegramId);

    if (wishlist.length === 0) {
      const emptyMessage = `
📭 <b>Your wishlist is empty</b>

Use the mini-app to discover and add tobaccos to your wishlist!
      `;
      await ctx.reply(emptyMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔍 Discover Tobaccos',
                url: process.env.TELEGRAM_MINI_APP_URL || 'https://t.me/your_bot/your_app',
              },
            ],
          ],
        },
      });
      return;
    }

    let message = `📋 <b>Your Wishlist (${wishlist.length} items)</b>\n\n`;

    wishlist.forEach((item, index) => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      message += `${index + 1}. <b>${item.tobaccoName}</b>\n`;
      message += `   📅 Added: ${date}\n\n`;
    });

    message += `💡 <b>Tip:</b> Show this list at a tobacco shop to help staff find your desired tobaccos.`;

    await ctx.reply(message, {
      parse_mode: 'HTML',
    });
  }
}
