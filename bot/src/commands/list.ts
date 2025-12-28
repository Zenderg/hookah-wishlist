import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';
import { apiClient } from '../utils/api.js';

export const listCommand = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.reply('Sorry, I could not identify you. Please try again.');
      return;
    }

    logger.info(`User ${telegramId} requested to list wishlist items`);

    // Fetch wishlist from API
    const response = await apiClient.get('/bot/wishlist/text', {
      params: { telegramId: telegramId.toString() },
    });

    logger.info(`API response status: ${response.status}`);

    if (!response.data.success) {
      logger.error('API returned unsuccessful response', {
        error: response.data.error,
      });

      if (response.data.error?.code === 'USER_NOT_FOUND') {
        await ctx.reply('👤 User not found. Please use /start to create your account first.');
        return;
      }

      await ctx.reply('❌ Failed to fetch your wishlist. Please try again later.');
      return;
    }

    const wishlistText = response.data.data.text;
    const pagination = response.data.data.pagination;

    // Create inline keyboard with action buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Refresh', callback_data: 'action_refresh_wishlist' },
          { text: '❓ Help', callback_data: 'action_help' },
        ],
        [{ text: '📱 Open Mini App', url: `https://t.me/${ctx.botInfo?.username}/app` }],
      ],
    };

    await ctx.reply(wishlistText, { reply_markup: keyboard });
    logger.info(`Wishlist displayed to user ${telegramId}`, {
      totalItems: pagination?.total || 0,
    });
  } catch (error) {
    logger.error('Error in list command:', error);

    if (error instanceof Error) {
      // Handle axios errors
      if ('response' in error) {
        const axiosError = error as any;
        logger.error('Axios error response:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        });

        if (axiosError.response?.status === 404) {
          await ctx.reply('👤 User not found. Please use /start to create your account first.');
          return;
        }

        if (axiosError.response?.status === 401) {
          await ctx.reply('❌ Authentication failed. Please try again later.');
          return;
        }

        if (axiosError.response?.status === 500) {
          await ctx.reply('❌ Server error. Please try again later.');
          return;
        }
      }

      // Handle network errors
      if ('code' in error && (error as any).code === 'ECONNREFUSED') {
        await ctx.reply('❌ Could not connect to the server. Please try again later.');
        return;
      }
    }

    await ctx.reply('❌ Failed to fetch your wishlist. Please try again later.');
  }
};
