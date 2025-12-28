import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const appCommand = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name || 'there';
    const botUsername = ctx.botInfo?.username;

    logger.info(`User ${telegramId} requested to open Mini App`);

    // Create inline keyboard with Mini App button
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Launch Mini App',
            url: `https://t.me/${botUsername}/app`,
          },
        ],
        [{ text: '❓ Help', callback_data: 'action_help' }],
      ],
    };

    const message = `
📱 **Mini App Access**

Hi ${firstName}! Click the button below to open the Hookah Wishlist Mini App.

The Mini App provides a beautiful web interface where you can:
• 📋 Browse and manage your wishlist
• 🔍 Search for hookah tobaccos and brands
• ⭐ Add or remove items from your wishlist
• 🎨 Enjoy a modern, user-friendly experience

Ready to explore? Click the button below! 👇
    `.trim();

    await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'Markdown' });
    logger.info(`Mini App link sent to user ${telegramId}`);
  } catch (error) {
    logger.error('Error in app command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
