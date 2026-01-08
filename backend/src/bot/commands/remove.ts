import bot from '../bot';
import logger from '@/utils/logger';
import wishlistService from '@/services/wishlist.service';

export const removeCommand = () => {
  bot.onText(/\/remove(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const tobaccoId = match?.[1]?.trim();

    logger.info(`/remove command received from user ${userId} for tobacco: ${tobaccoId}`);

    if (!userId) {
      await bot.sendMessage(chatId, '❌ Unable to identify user. Please try again.');
      return;
    }

    if (!tobaccoId) {
      await bot.sendMessage(chatId, 'Please provide a tobacco ID.\n\nUsage: /remove <tobacco_id>\n\nExample: /remove 12345\n\n💡 Tip: Use /wishlist to see tobacco IDs in your wishlist.');
      return;
    }

    try {
      // Send typing action
      await bot.sendChatAction(chatId, 'typing');

      // Remove from wishlist
      await wishlistService.removeItem(userId, tobaccoId);

      const successMessage = `
✅ Successfully removed from wishlist!

🏷️ Removed tobacco ID: ${tobaccoId}

Use /wishlist to view your updated wishlist.
      `;

      await bot.sendMessage(chatId, successMessage, { parse_mode: 'HTML' });
    } catch (error: any) {
      logger.error('Error in remove command:', error);
      
      if (error.message === 'Wishlist not found') {
        await bot.sendMessage(chatId, `❌ Your wishlist is empty.\n\nUse /search to find tobaccos and /add to add them to your wishlist.`);
      } else if (error.message === 'Tobacco not found in wishlist') {
        await bot.sendMessage(chatId, `❌ Tobacco with ID "${tobaccoId}" not found in your wishlist.\n\n💡 Tip: Use /wishlist to see tobacco IDs in your wishlist.`);
      } else {
        await bot.sendMessage(chatId, '❌ Sorry, an error occurred while removing from wishlist. Please try again later.');
      }
    }
  });
};
