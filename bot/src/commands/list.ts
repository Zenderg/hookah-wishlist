import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const listCommand = async (ctx: Context) => {
  try {
    await ctx.reply('📋 Your wishlist will be displayed here. This feature is coming soon!');
    logger.info(`User ${ctx.from?.id} requested to list items`);
  } catch (error) {
    logger.error('Error in list command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
