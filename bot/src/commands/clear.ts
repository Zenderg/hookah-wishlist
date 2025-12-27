import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const clearCommand = async (ctx: Context) => {
  try {
    await ctx.reply(
      '🗑️ Clear wishlist feature is coming soon! You will be able to clear your entire wishlist.'
    );
    logger.info(`User ${ctx.from?.id} requested to clear wishlist`);
  } catch (error) {
    logger.error('Error in clear command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
