import bot from '../bot';
import logger from '@/utils/logger';

export const startCommand = () => {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    logger.info(`/start command received from user ${userId}`);

    const welcomeMessage = `
🎉 Welcome to Hookah Wishlist Bot!

This bot helps you manage your hookah tobacco wishlist. Never forget which tobaccos you want to try again!

📋 Available commands:
/start - Show this welcome message
/help - Show all available commands
/search <query> - Search for tobaccos
/wishlist - View your wishlist
/add <tobacco_id> - Add tobacco to wishlist
/remove <tobacco_id> - Remove from wishlist

💡 Tip: Use the mini-app for a better experience!
    `;

    try {
      await bot.sendMessage(chatId, welcomeMessage);
    } catch (error) {
      logger.error('Error sending start message:', error);
    }
  });
};
