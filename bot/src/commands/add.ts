import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const addCommand = async (ctx: Context) => {
  try {
    await ctx.reply(
      '➕ Add item to wishlist feature is coming soon! You will be able to add items by name or URL.'
    );
    logger.info(`User ${ctx.from?.id} requested to add an item`);
  } catch (error) {
    logger.error('Error in add command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
