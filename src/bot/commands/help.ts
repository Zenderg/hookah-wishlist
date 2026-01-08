import bot from '../bot';
import logger from '@/utils/logger';

export const helpCommand = () => {
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    logger.info(`/help command received from user ${userId}`);

    const helpMessage = `
📚 Help - Available Commands

🔍 Search & Browse:
/search <query> - Search for tobaccos by name or brand

📋 Wishlist Management:
/wishlist - View your current wishlist
/add <tobacco_id> - Add tobacco to wishlist
/remove <tobacco_id> - Remove from wishlist

ℹ️ General:
/start - Show welcome message
/help - Show this help message

💡 Tips:
• Use specific search terms for better results
• Your wishlist is saved automatically
• Open the mini-app for a visual interface
    `;

    await bot.sendMessage(chatId, helpMessage);
  });
};
