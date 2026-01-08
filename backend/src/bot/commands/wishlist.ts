import bot from '../bot';
import logger from '@/utils/logger';
import wishlistService from '@/services/wishlist.service';

export const wishlistCommand = () => {
  bot.onText(/\/wishlist/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    logger.info(`/wishlist command received from user ${userId}`);

    if (!userId) {
      await bot.sendMessage(chatId, '❌ Unable to identify user. Please try again.');
      return;
    }

    try {
      // Send typing action
      await bot.sendChatAction(chatId, 'typing');

      // Get wishlist with details
      const wishlist = await wishlistService.getWishlistWithDetails(userId);

      if (!wishlist) {
        await bot.sendMessage(chatId, '📋 Your wishlist is empty.\n\nUse /search to find tobaccos and /add to add them to your wishlist.');
        return;
      }

      // Format and send wishlist
      const message = wishlistService.formatWishlist(wishlist);
      
      // Send message with HTML parsing
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Error in wishlist command:', error);
      await bot.sendMessage(chatId, '❌ Sorry, an error occurred while retrieving your wishlist. Please try again later.');
    }
  });
};
