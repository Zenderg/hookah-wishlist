import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const startCommand = async (ctx: Context) => {
  try {
    const welcomeMessage = `
🎉 Welcome to Hookah Wishlist Bot!

I'll help you manage your hookah wishlist. Here's what you can do:

📋 /list - View your wishlist
➕ /add - Add items to your wishlist
➖ /remove - Remove items from your wishlist
🗑️ /clear - Clear your entire wishlist
📱 /app - Open the Mini App
❓ /help - Show this help message

Let's get started! Try /help to see all available commands.
    `;

    await ctx.reply(welcomeMessage);
    logger.info(`User ${ctx.from?.id} started the bot`);
  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
