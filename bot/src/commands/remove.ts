import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';
import { apiClient } from '../utils/api.js';
import type { InlineKeyboardMarkup } from 'telegraf/types';

export const removeCommand = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.reply('Sorry, I could not identify you. Please try again.');
      return;
    }

    logger.info(`User ${telegramId} requested to remove an item`);

    // Get wishlist items
    const wishlistResponse = await apiClient.get('/bot/wishlist', {
      params: { telegramId: telegramId.toString(), limit: '20' },
    });

    if (!wishlistResponse.data.success) {
      logger.error('API returned unsuccessful response', {
        error: wishlistResponse.data.error,
      });

      if (wishlistResponse.data.error?.code === 'USER_NOT_FOUND') {
        await ctx.reply('👤 User not found. Please use /start to create your account first.');
        return;
      }

      await ctx.reply('❌ Failed to fetch your wishlist. Please try again later.');
      return;
    }

    const items = wishlistResponse.data.data.items || [];
    const totalItems = wishlistResponse.data.data.pagination?.total || 0;

    if (totalItems === 0) {
      await ctx.reply(
        '📋 Your wishlist is empty\n\n' +
          'Use the /add command to add tobacco flavors to your wishlist!'
      );
      return;
    }

    // Display wishlist with inline keyboard
    let message = `📋 Your Wishlist (${totalItems} item${totalItems > 1 ? 's' : ''})\n\n`;
    message += 'Select an item to remove:\n\n';

    const keyboard: InlineKeyboardMarkup['inline_keyboard'] = [];

    items.forEach((item: any, index: number) => {
      const brandName = item.tobacco?.brand?.name || 'Unknown';
      const tobaccoName = item.tobacco?.name || 'Unknown';

      message += `${index + 1}. ${brandName} - ${tobaccoName}\n`;

      // Add button for each item
      keyboard.push([
        {
          text: `${index + 1}. ${brandName} - ${tobaccoName}`,
          callback_data: `remove_${item.id}`,
        },
      ]);
    });

    if (totalItems > items.length) {
      message += `\n... and ${totalItems - items.length} more item${totalItems - items.length > 1 ? 's' : ''}\n`;
      message += '\nShowing the first 20 items. Use /clear to remove all items.';
    }

    // Add cancel button
    keyboard.push([{ text: '❌ Cancel', callback_data: 'cancel_action' }]);

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard },
    });

    logger.info(`Wishlist displayed for removal to user ${telegramId}`, {
      totalItems,
    });
  } catch (error) {
    logger.error('Error in remove command:', error);

    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        await ctx.reply('👤 User not found. Please use /start to create your account first.');
        return;
      }

      if (axiosError.response?.status === 401) {
        await ctx.reply('❌ Authentication failed. Please try again later.');
        return;
      }
    }

    await ctx.reply('❌ Failed to fetch your wishlist. Please try again later.');
  }
};

export async function handleRemoveSelection(ctx: Context, itemId: string) {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.answerCbQuery('Could not identify you');
      return;
    }

    logger.info(`User ${telegramId} selected item to remove: ${itemId}`);

    // Get item details
    const wishlistResponse = await apiClient.get('/bot/wishlist', {
      params: { telegramId: telegramId.toString() },
    });

    let brandName = 'Unknown';
    let tobaccoName = 'Unknown';

    if (wishlistResponse.data.success) {
      const items = wishlistResponse.data.data.items || [];
      const item = items.find((i: any) => i.id === parseInt(itemId, 10));
      if (item) {
        brandName = item.tobacco?.brand?.name || 'Unknown';
        tobaccoName = item.tobacco?.name || 'Unknown';
      }
    }

    // Show confirmation dialog
    const keyboard: InlineKeyboardMarkup['inline_keyboard'] = [
      [
        { text: '✅ Yes, remove it', callback_data: `confirm_remove_${itemId}` },
        { text: '❌ No, cancel', callback_data: 'cancel_action' },
      ],
    ];

    await ctx.answerCbQuery();
    await ctx.reply(
      `⚠️ Are you sure you want to remove:\n\n${brandName} - ${tobaccoName}\n\nThis action cannot be undone.`,
      { reply_markup: { inline_keyboard: keyboard } }
    );

    logger.info(`Remove confirmation shown to user ${telegramId}`, { itemId });
  } catch (error) {
    logger.error('Error handling remove selection:', error);
    await ctx.answerCbQuery('Failed to show confirmation');
    await ctx.reply('❌ Failed to show confirmation. Please try again later.');
  }
}

export async function handleRemoveConfirmation(ctx: Context, itemId: string) {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.answerCbQuery('Could not identify you');
      return;
    }

    logger.info(`User ${telegramId} confirmed removal of item: ${itemId}`);

    // Get item details before removal
    const wishlistResponse = await apiClient.get('/bot/wishlist', {
      params: { telegramId: telegramId.toString() },
    });

    let brandName = 'Unknown';
    let tobaccoName = 'Unknown';

    if (wishlistResponse.data.success) {
      const items = wishlistResponse.data.data.items || [];
      const item = items.find((i: any) => i.id === parseInt(itemId, 10));
      if (item) {
        brandName = item.tobacco?.brand?.name || 'Unknown';
        tobaccoName = item.tobacco?.name || 'Unknown';
      }
    }

    // Remove item from wishlist
    const response = await apiClient.delete(`/bot/wishlist/items/${itemId}`, {
      params: { telegramId: telegramId.toString() },
    });

    if (!response.data.success) {
      const errorCode = response.data.error?.code;

      if (errorCode === 'WISHLIST_ITEM_NOT_FOUND') {
        await ctx.answerCbQuery('Item not found');
        await ctx.reply('❌ Item not found. It may have been removed already.');
        return;
      }

      logger.error('API returned unsuccessful response', {
        error: response.data.error,
      });
      await ctx.answerCbQuery('Failed to remove');
      await ctx.reply('❌ Failed to remove item. Please try again later.');
      return;
    }

    await ctx.answerCbQuery('Removed');
    await ctx.reply(`✅ Removed ${brandName} - ${tobaccoName} from wishlist!`);

    logger.info(`Item removed from wishlist successfully`, {
      userId: telegramId,
      itemId,
    });
  } catch (error) {
    logger.error('Error handling remove confirmation:', error);

    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        await ctx.answerCbQuery('Item not found');
        await ctx.reply('❌ Item not found. It may have been removed already.');
        return;
      }
    }

    await ctx.answerCbQuery('Failed to remove');
    await ctx.reply('❌ Failed to remove item. Please try again later.');
  }
}
