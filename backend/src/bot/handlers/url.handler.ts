import { Injectable, Logger } from '@nestjs/common';
import { WishlistService } from '../../wishlist/wishlist.service';
import { HookahDbService } from '../../hookah-db/hookah-db.service';

@Injectable()
export class UrlHandler {
  private readonly logger = new Logger(UrlHandler.name);
  private readonly htreviewsUrlPattern = /^https?:\/\/(?:www\.)?htreviews\.org\/tobaccos\/([^\/]+)(?:\/([^\/]+)(?:\/([^\/]+))?)?$/;

  constructor(
    private readonly wishlistService: WishlistService,
    private readonly hookahDbService: HookahDbService,
  ) {}

  async handle(ctx: any): Promise<void> {
    const telegramId = ctx.from?.id?.toString();
    const text = ctx.message?.text;

    if (!telegramId) {
      await ctx.reply('❌ Не удалось определить пользователя. Попробуйте еще раз.');
      return;
    }

    if (!text) {
      await ctx.reply('❌ Не удалось получить сообщение. Попробуйте еще раз.');
      return;
    }

    // Validate the URL format
    const match = text.match(this.htreviewsUrlPattern);
    if (!match) {
      await ctx.reply('❌ Это не ссылка на htreviews.org. Пожалуйста, отправьте ссылку на табак с htreviews.org.');
      return;
    }

    const [, brandSlug, lineSlug, tobaccoSlug] = match;

    if (!tobaccoSlug) {
      await ctx.reply('❌ Ссылка должна указывать на конкретный табак, а не на бренд или линейку.');
      return;
    }

    // Get tobacco by URL using the API endpoint
    try {
      await ctx.reply('🔍 Поиск табака...');

      // Get tobacco by URL
      const tobacco = await this.hookahDbService.getTobaccoByUrl(text);

      // Get brand name
      let brandName = 'Неизвестный бренд';
      try {
        const brand = await this.hookahDbService.getBrandById(tobacco.brandId);
        brandName = brand.name;
      } catch (error) {
        this.logger.warn(`Failed to fetch brand ${tobacco.brandId}`);
      }

      // Add to wishlist
      const wishlistItem = await this.wishlistService.addToWishlist(telegramId, tobacco.id);

      const successMessage = `
✅ <b>Табак добавлен в вишлист!</b>

🍃 <b>${tobacco.name}</b>
🏭 Бренд: ${brandName}
⭐ Рейтинг: ${tobacco.rating} (${tobacco.ratingsCount} отзывов)

💡 Используйте команду /wishlist, чтобы посмотреть все сохраненные табаки.
      `;

      await ctx.reply(successMessage, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logger.error('Error processing URL:', error);
      await ctx.reply('❌ Произошла ошибка при обработке ссылки. Попробуйте еще раз.');
    }
  }

  canHandle(text: string): boolean {
    return this.htreviewsUrlPattern.test(text);
  }
}
