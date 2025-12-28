import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const startCommand = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name || 'there';

    logger.info(`User ${telegramId} started the bot`);

    // Create inline keyboard with action buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: '📋 View Wishlist', callback_data: 'action_view_wishlist' },
          { text: '❓ Help', callback_data: 'action_help' },
        ],
        [{ text: '📱 Open Mini App', url: `https://t.me/${ctx.botInfo?.username}/app` }],
      ],
    };

    const welcomeMessage = `
🎉 Welcome to Hookah Wishlist Bot, ${firstName}!

I'll help you manage your hookah wishlist. Here's what you can do:

📋 /list - View your wishlist
❓ /help - Show all available commands

Use the buttons below to get started quickly!
    `.trim();

    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
    logger.info(`Welcome message sent to user ${telegramId}`);
  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
