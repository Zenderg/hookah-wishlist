import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const helpCommand = async (ctx: Context) => {
  try {
    const helpMessage = `
📚 *Hookah Wishlist Bot - Help*

Here are all available commands:

🚀 *Getting Started*
/start - Start the bot and see welcome message
/help - Show this help message

📋 *Wishlist Management*
/list - View all items in your wishlist
/add - Add a new item to your wishlist
/remove - Remove an item from your wishlist
/clear - Clear your entire wishlist

📱 *Mini App*
/app - Open the Mini App for a better experience

💡 *Tips*
• Use the Mini App for the best experience
• You can add items by name, URL, or both
• Items are stored securely in your personal wishlist

Need more help? Contact support!
    `;

    await ctx.replyWithMarkdownV2(helpMessage);
    logger.info(`User ${ctx.from?.id} requested help`);
  } catch (error) {
    logger.error('Error in help command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
