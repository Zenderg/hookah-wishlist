import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';
import { listCommand } from '../commands/list.js';
import { helpCommand } from '../commands/help.js';
import { handleAddSelection } from '../commands/add.js';
import { handleRemoveSelection, handleRemoveConfirmation } from '../commands/remove.js';
import { handleClearConfirmation } from '../commands/clear.js';
import { handleCallbackError } from '../utils/errorHandler.js';

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

    // Handle different callback actions
    if (callbackData.startsWith('add_')) {
      // Handle add selection from search results
      const tobaccoId = callbackData.substring(4); // Remove 'add_' prefix
      await handleAddSelection(ctx, tobaccoId);
      return;
    }

    if (callbackData.startsWith('remove_')) {
      // Handle remove selection (first step)
      const itemId = callbackData.substring(7); // Remove 'remove_' prefix
      await handleRemoveSelection(ctx, itemId);
      return;
    }

    if (callbackData.startsWith('confirm_remove_')) {
      // Handle remove confirmation (second step)
      const itemId = callbackData.substring(15); // Remove 'confirm_remove_' prefix
      await handleRemoveConfirmation(ctx, itemId);
      return;
    }

    if (callbackData === 'confirm_clear') {
      // Handle clear confirmation
      await handleClearConfirmation(ctx);
      return;
    }

    if (callbackData === 'cancel_action') {
      // Handle cancel button clicks
      await handleCancelAction(ctx);
      return;
    }

    // Handle existing actions
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
        await ctx.answerCbQuery('Unknown action');
        await ctx.reply('❌ Unknown action. Please try again.');
    }
  } catch (error) {
    await handleCallbackError(ctx, error, 'callback_query');
  }
};

async function handleCancelAction(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      await ctx.answerCbQuery('Could not identify you');
      return;
    }

    logger.info(`User ${telegramId} cancelled action`);

    await ctx.answerCbQuery('Cancelled');
    await ctx.reply('❌ Action cancelled.');

    // Try to delete of the message with the inline keyboard
    try {
      if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
        await ctx.deleteMessage();
      }
    } catch (deleteError) {
      // Ignore errors when trying to delete the message
      logger.debug('Could not delete message:', deleteError);
    }
  } catch (error) {
    await handleCallbackError(ctx, error, 'cancel_action');
  }
}
