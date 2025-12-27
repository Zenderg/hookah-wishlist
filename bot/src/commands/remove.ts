import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const removeCommand = async (ctx: Context) => {
  try {
    await ctx.reply(
      '➖ Remove item from wishlist feature is coming soon! You will be able to remove items by ID or name.'
    );
    logger.info(`User ${ctx.from?.id} requested to remove an item`);
  } catch (error) {
    logger.error('Error in remove command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
