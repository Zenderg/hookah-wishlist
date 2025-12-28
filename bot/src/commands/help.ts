import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const helpCommand = async (ctx: Context) => {
  try {
    const helpMessage = `
📚 <b>Hookah Wishlist Bot - Help</b>

Here are all available commands:

🚀 <b>Getting Started</b>
/start - Start the bot and see welcome message
/help - Show this help message

📋 <b>Wishlist Management</b>
/list - View all items in your wishlist

📱 <b>Mini App</b>
/app - Open the Mini App for a better experience

💡 <b>Tips</b>
• Use the Mini App for the best experience
• You can add items by name, URL, or both
• Items are stored securely in your personal wishlist

Need more help? Contact support!
    `.trim();

    await ctx.replyWithHTML(helpMessage);
    logger.info(`User ${ctx.from?.id} requested help`);
  } catch (error) {
    logger.error('Error in help command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};
