import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';
import { apiClient } from '../utils/api.js';
import type { InlineKeyboardMarkup } from 'telegraf/types';

export const clearCommand = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.reply('Sorry, I could not identify you. Please try again.');
      return;
    }

    logger.info(`User ${telegramId} requested to clear wishlist`);

    // Get wishlist items to check count
    const wishlistResponse = await apiClient.get('/bot/wishlist', {
      params: { telegramId: telegramId.toString(), limit: '100' },
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

    const totalItems = wishlistResponse.data.data.pagination?.total || 0;

    if (totalItems === 0) {
      await ctx.reply(
        '📋 Your wishlist is already empty\n\n' +
          'Use the /add command to add tobacco flavors to your wishlist!'
      );
      return;
    }

    // Show warning with confirmation
    const keyboard: InlineKeyboardMarkup['inline_keyboard'] = [
      [
        { text: '✅ Yes, clear all', callback_data: 'confirm_clear' },
        { text: '❌ No, cancel', callback_data: 'cancel_action' },
      ],
    ];

    await ctx.reply(
      `⚠️ This will remove ALL items from your wishlist.\n\n` +
        `You have ${totalItems} item${totalItems > 1 ? 's' : ''} in your wishlist.\n\n` +
        `This action cannot be undone.`,
      { reply_markup: { inline_keyboard: keyboard } }
    );

    logger.info(`Clear confirmation shown to user ${telegramId}`, { totalItems });
  } catch (error) {
    logger.error('Error in clear command:', error);

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

export async function handleClearConfirmation(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.answerCbQuery('Could not identify you');
      return;
    }

    logger.info(`User ${telegramId} confirmed clearing wishlist`);

    // Get all wishlist items
    const wishlistResponse = await apiClient.get('/bot/wishlist', {
      params: { telegramId: telegramId.toString(), limit: '100' },
    });

    if (!wishlistResponse.data.success) {
      logger.error('API returned unsuccessful response', {
        error: wishlistResponse.data.error,
      });
      await ctx.answerCbQuery('Failed to fetch wishlist');
      await ctx.reply('❌ Failed to fetch your wishlist. Please try again later.');
      return;
    }

    const items = wishlistResponse.data.data.items || [];
    const totalItems = items.length;

    if (totalItems === 0) {
      await ctx.answerCbQuery('Wishlist is empty');
      await ctx.reply('📋 Your wishlist is already empty.');
      return;
    }

    // Remove all items one by one
    let removedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        await apiClient.delete(`/bot/wishlist/items/${item.id}`, {
          params: { telegramId: telegramId.toString() },
        });
        removedCount++;
      } catch (error) {
        logger.error(`Failed to remove item ${item.id}:`, error);
        failedCount++;
      }
    }

    if (removedCount === totalItems) {
      await ctx.answerCbQuery('Wishlist cleared');
      await ctx.reply(
        `✅ Wishlist cleared!\n\n` +
          `Removed ${removedCount} item${removedCount > 1 ? 's' : ''} from your wishlist.\n` +
          `0 items remaining.`
      );

      logger.info(`Wishlist cleared successfully`, {
        userId: telegramId,
        removedCount,
      });
    } else if (removedCount > 0) {
      await ctx.answerCbQuery('Partially cleared');
      await ctx.reply(
        `⚠️ Wishlist partially cleared.\n\n` +
          `Removed ${removedCount} item${removedCount > 1 ? 's' : ''}.\n` +
          `Failed to remove ${failedCount} item${failedCount > 1 ? 's' : ''}.\n` +
          `Please try again or contact support.`
      );

      logger.warn(`Wishlist partially cleared`, {
        userId: telegramId,
        removedCount,
        failedCount,
      });
    } else {
      await ctx.answerCbQuery('Failed to clear');
      await ctx.reply('❌ Failed to clear wishlist. Please try again later.');

      logger.error(`Failed to clear wishlist`, {
        userId: telegramId,
        totalItems,
      });
    }
  } catch (error) {
    logger.error('Error handling clear confirmation:', error);
    await ctx.answerCbQuery('Failed to clear');
    await ctx.reply('❌ Failed to clear wishlist. Please try again later.');
  }
}
