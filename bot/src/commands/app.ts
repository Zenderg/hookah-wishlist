import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const appCommand = async (ctx: Context) => {
  try {
    await ctx.reply(
      '📱 Mini App feature is coming soon! You will be able to open a beautiful web interface for managing your wishlist.'
    );
    logger.info(`User ${ctx.from?.id} requested to open Mini App`);
  } catch (error) {
    logger.error('Error in app command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
