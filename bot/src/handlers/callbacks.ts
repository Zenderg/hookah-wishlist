import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';
import { listCommand } from '../commands/list.js';
import { helpCommand } from '../commands/help.js';

export const handleCallbackQuery = async (ctx: Context) => {
  try {
    const callbackQuery = ctx.callbackQuery;

    if (!callbackQuery) {
      logger.warn('No callback query found');
      return;
    }

    const callbackData = 'data' in callbackQuery ? callbackQuery.data : undefined;
    const telegramId = ctx.from?.id;

    if (!callbackData) {
      logger.warn('No callback data found');
      await ctx.answerCbQuery('Invalid callback data');
      return;
    }

    logger.info(`Callback query received from user ${telegramId}: ${callbackData}`);

    // Answer the callback query to remove the loading indicator
    await ctx.answerCbQuery();

    // Handle different callback actions
    switch (callbackData) {
      case 'action_view_wishlist':
        logger.info(`User ${telegramId} clicked View Wishlist button`);
        await listCommand(ctx);
        break;

      case 'action_help':
        logger.info(`User ${telegramId} clicked Help button`);
        await helpCommand(ctx);
        break;

      case 'action_refresh_wishlist':
        logger.info(`User ${telegramId} clicked Refresh Wishlist button`);
        await listCommand(ctx);
        break;

      default:
        logger.warn(`Unknown callback action: ${callbackData}`);
        await ctx.reply('❌ Unknown action. Please try again.');
    }
  } catch (error) {
    logger.error('Error in callback handler:', error);
    try {
      await ctx.answerCbQuery('An error occurred');
    } catch (answerError) {
      logger.error('Error answering callback query:', answerError);
    }
  }
};
