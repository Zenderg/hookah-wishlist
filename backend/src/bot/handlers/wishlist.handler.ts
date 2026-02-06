import { Injectable } from '@nestjs/common';
import { WishlistService } from '../../wishlist/wishlist.service';
import { HookahDbService } from '../../hookah-db/hookah-db.service';

@Injectable()
export class WishlistHandler {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly hookahDbService: HookahDbService,
  ) {}

  async handle(ctx: any) {
    const telegramId = ctx.from?.id?.toString();

    if (!telegramId) {
      await ctx.reply('❌ Не удалось определить пользователя. Попробуйте еще раз.');
      return;
    }

    const wishlist = await this.wishlistService.getUserWishlist(telegramId);

    if (wishlist.length === 0) {
      const emptyMessage = `
📭 <b>Ваш вишлист пуст</b>

Используйте мини-приложение, чтобы найти и добавить табаки в ваш вишлист!
      `;
      await ctx.reply(emptyMessage, {
        parse_mode: 'HTML',
      });
      return;
    }

    let message = `📋 <b>Ваш вишлист (${wishlist.length} элементов)</b>\n\n`;

    // Fetch tobacco details for each wishlist item
    for (const [index, item] of wishlist.entries()) {
      try {
        const tobacco = await this.hookahDbService.getTobaccoById(item.tobaccoId);
        let brandName = 'Неизвестный бренд';
        let lineName = '';

        try {
          const brand = await this.hookahDbService.getBrandById(tobacco.brandId);
          brandName = brand.name;
        } catch (brandError) {
          // If brand fetch fails, use default text
        }

        if (tobacco.lineId) {
          try {
            const line = await this.hookahDbService.getLineById(tobacco.lineId);
            lineName = line.name;
          } catch (lineError) {
            // If line fetch fails, leave lineName empty
          }
        }

        message += `${index + 1}. <b>${tobacco.name}</b>\n`;
        message += `   🏭 Бренд: ${brandName}\n`;
        if (lineName) {
          message += `   📦 Линейка: ${lineName}\n`;
        }
        message += '\n';
      } catch (error) {
        // If tobacco fetch fails, show tobacco ID as fallback
        message += `${index + 1}. <b>${item.tobaccoId}</b>\n\n`;
      }
    }

    message += `💡 <b>Совет:</b> Покажите этот список в магазине табаков, чтобы помочь сотрудникам найти желаемые табаки.`;

    await ctx.reply(message, {
      parse_mode: 'HTML',
    });
  }
}
