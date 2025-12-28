import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';
import { apiClient } from '../utils/api.js';
import type { InlineKeyboardMarkup } from 'telegraf/types';

// Store user search state (in production, use Redis or database)
const userSearchState = new Map<number, { query: string; page: number }>();

export const addCommand = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.reply('Sorry, I could not identify you. Please try again.');
      return;
    }

    logger.info(`User ${telegramId} requested to add an item`);

    await ctx.reply(
      '🔍 Send tobacco name or ID to add to wishlist\n\n' +
        'You can search by tobacco name or enter the exact ID if you know it.'
    );
  } catch (error) {
    logger.error('Error in add command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

// Handle text messages for search
export const handleAddSearch = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.reply('Sorry, I could not identify you. Please try again.');
      return;
    }

    if (!ctx.message || !('text' in ctx.message)) {
      logger.warn('No text in message');
      return;
    }

    const messageText = ctx.message.text;

    logger.info(`User ${telegramId} searching for tobacco: ${messageText}`);

    // Check if it's a numeric ID
    const isNumericId = /^\d+$/.test(messageText.trim());

    if (isNumericId) {
      // Try to add directly by ID
      await addTobaccoById(ctx, telegramId, messageText.trim());
    } else {
      // Search by name
      await searchTobaccos(ctx, telegramId, messageText.trim());
    }
  } catch (error) {
    logger.error('Error handling add search:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

async function searchTobaccos(ctx: Context, telegramId: number, query: string) {
  try {
    logger.info(`Searching tobaccos for user ${telegramId}: ${query}`);

    const response = await apiClient.get('/tobaccos', {
      params: {
        search: query,
        page: 1,
        limit: 20,
      },
    });

    if (!response.data.success) {
      logger.error('API returned unsuccessful response', {
        error: response.data.error,
      });
      await ctx.reply('❌ Failed to search for tobacco. Please try again later.');
      return;
    }

    const tobaccos = response.data.data.items || [];
    const pagination = response.data.data.pagination;

    if (tobaccos.length === 0) {
      await ctx.reply(
        '❌ No tobacco found matching your search.\n\n' +
          'Try a different search term or check the spelling.'
      );
      return;
    }

    // Store search state
    userSearchState.set(telegramId, { query, page: 1 });

    // Display search results with inline keyboard
    let message = `🔍 Search Results (${pagination.total} found)\n\n`;

    const keyboard: InlineKeyboardMarkup['inline_keyboard'] = [];

    tobaccos.forEach((tobacco: any, index: number) => {
      const brandName = tobacco.brand?.name || 'Unknown';
      const tobaccoName = tobacco.name || 'Unknown';
      const price = tobacco.price ? ` - ${tobacco.price}₽` : '';
      const stockStatus = tobacco.inStock ? '✅' : '❌';

      message += `${index + 1}. ${brandName} - ${tobaccoName}${price} ${stockStatus}\n`;

      // Add button for each tobacco
      keyboard.push([
        {
          text: `${index + 1}. ${brandName} - ${tobaccoName}`,
          callback_data: `add_${tobacco.id}`,
        },
      ]);
    });

    // Add pagination buttons if needed
    if (pagination.totalPages > 1) {
      const paginationRow: InlineKeyboardMarkup['inline_keyboard'][0] = [];
      if (pagination.page > 1) {
        paginationRow.push({
          text: '⬅️ Previous',
          callback_data: `search_prev_${query}_1`,
        });
      }
      paginationRow.push({
        text: `${pagination.page}/${pagination.totalPages}`,
        callback_data: 'search_page_info',
      });
      if (pagination.page < pagination.totalPages) {
        paginationRow.push({
          text: 'Next ➡️',
          callback_data: `search_next_${query}_1`,
        });
      }
      keyboard.push(paginationRow);
    }

    // Add cancel button
    keyboard.push([{ text: '❌ Cancel', callback_data: 'cancel_action' }]);

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard },
    });

    logger.info(`Search results displayed to user ${telegramId}`, {
      total: pagination.total,
      displayed: tobaccos.length,
    });
  } catch (error) {
    logger.error('Error searching tobaccos:', error);

    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 401) {
        await ctx.reply('❌ Authentication failed. Please try again later.');
        return;
      }
    }

    await ctx.reply('❌ Failed to search for tobacco. Please try again later.');
  }
}

async function addTobaccoById(ctx: Context, telegramId: number, tobaccoId: string) {
  try {
    logger.info(`Adding tobacco by ID for user ${telegramId}: ${tobaccoId}`);

    const response = await apiClient.post(
      '/bot/wishlist/items',
      {
        tobaccoId: tobaccoId,
      },
      {
        params: { telegramId: telegramId.toString() },
      }
    );

    if (!response.data.success) {
      const errorCode = response.data.error?.code;

      if (errorCode === 'TOBACCO_NOT_FOUND') {
        await ctx.reply(
          '❌ Tobacco with this ID not found.\n\n' +
            'Please check the ID or use /add to search by name.'
        );
        return;
      }

      if (errorCode === 'ALREADY_IN_WISHLIST') {
        await ctx.reply('⚠️ This tobacco is already in your wishlist!');
        return;
      }

      logger.error('API returned unsuccessful response', {
        error: response.data.error,
      });
      await ctx.reply('❌ Failed to add tobacco to wishlist. Please try again later.');
      return;
    }

    const item = response.data.data;
    const brandName = item.tobacco?.brand?.name || 'Unknown';
    const tobaccoName = item.tobacco?.name || 'Unknown';

    await ctx.reply(`✅ Added ${brandName} - ${tobaccoName} to wishlist!`);

    logger.info(`Tobacco added to wishlist successfully`, {
      userId: telegramId,
      tobaccoId,
      wishlistItemId: item.id,
    });
  } catch (error) {
    logger.error('Error adding tobacco by ID:', error);

    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        await ctx.reply(
          '❌ Tobacco with this ID not found.\n\n' +
            'Please check the ID or use /add to search by name.'
        );
        return;
      }

      if (axiosError.response?.status === 409) {
        await ctx.reply('⚠️ This tobacco is already in your wishlist!');
        return;
      }

      if (axiosError.response?.status === 401) {
        await ctx.reply('❌ Authentication failed. Please try again later.');
        return;
      }
    }

    await ctx.reply('❌ Failed to add tobacco to wishlist. Please try again later.');
  }
}

export async function handleAddSelection(ctx: Context, tobaccoId: string) {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.answerCbQuery('Could not identify you');
      return;
    }

    logger.info(`User ${telegramId} selected tobacco to add: ${tobaccoId}`);

    const response = await apiClient.post(
      '/bot/wishlist/items',
      {
        tobaccoId: tobaccoId,
      },
      {
        params: { telegramId: telegramId.toString() },
      }
    );

    if (!response.data.success) {
      const errorCode = response.data.error?.code;

      if (errorCode === 'TOBACCO_NOT_FOUND') {
        await ctx.answerCbQuery('Tobacco not found');
        await ctx.reply('❌ Tobacco not found. It may have been removed.');
        return;
      }

      if (errorCode === 'ALREADY_IN_WISHLIST') {
        await ctx.answerCbQuery('Already in wishlist');
        await ctx.reply('⚠️ This tobacco is already in your wishlist!');
        return;
      }

      logger.error('API returned unsuccessful response', {
        error: response.data.error,
      });
      await ctx.answerCbQuery('Failed to add');
      await ctx.reply('❌ Failed to add tobacco to wishlist. Please try again later.');
      return;
    }

    const item = response.data.data;
    const brandName = item.tobacco?.brand?.name || 'Unknown';
    const tobaccoName = item.tobacco?.name || 'Unknown';

    await ctx.answerCbQuery('Added to wishlist');
    await ctx.reply(`✅ Added ${brandName} - ${tobaccoName} to wishlist!`);

    logger.info(`Tobacco added to wishlist successfully`, {
      userId: telegramId,
      tobaccoId,
      wishlistItemId: item.id,
    });
  } catch (error) {
    logger.error('Error handling add selection:', error);

    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        await ctx.answerCbQuery('Tobacco not found');
        await ctx.reply('❌ Tobacco not found. It may have been removed.');
        return;
      }

      if (axiosError.response?.status === 409) {
        await ctx.answerCbQuery('Already in wishlist');
        await ctx.reply('⚠️ This tobacco is already in your wishlist!');
        return;
      }
    }

    await ctx.answerCbQuery('Failed to add');
    await ctx.reply('❌ Failed to add tobacco to wishlist. Please try again later.');
  }
}
