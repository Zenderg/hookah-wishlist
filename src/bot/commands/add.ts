import bot from '../bot';
import logger from '@/utils/logger';
import wishlistService from '@/services/wishlist.service';
import searchService from '@/services/search.service';

export const addCommand = () => {
  bot.onText(/\/add(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const tobaccoId = match?.[1]?.trim();

    logger.info(`/add command received from user ${userId} for tobacco: ${tobaccoId}`);

    if (!userId) {
      await bot.sendMessage(chatId, '❌ Unable to identify user. Please try again.');
      return;
    }

    if (!tobaccoId) {
      await bot.sendMessage(chatId, 'Please provide a tobacco ID.\n\nUsage: /add <tobacco_id>\n\nExample: /add 12345\n\n💡 Tip: Use /search to find tobacco IDs.');
      return;
    }

    try {
      // Send typing action
      await bot.sendChatAction(chatId, 'typing');

      // Verify tobacco exists
      const tobacco = await searchService.getTobaccoDetails(tobaccoId);
      
      if (!tobacco) {
        await bot.sendMessage(chatId, `❌ Tobacco with ID "${tobaccoId}" not found.\n\n💡 Tip: Use /search to find valid tobacco IDs.`);
        return;
      }

      // Add to wishlist
      await wishlistService.addItem(userId, tobaccoId);

      const successMessage = `
✅ Successfully added to wishlist!

📦 ${tobacco.brand} - ${tobacco.name}
🏷️ ID: ${tobaccoId}
${tobacco.flavor ? `🍃 Flavor: ${tobacco.flavor}\n` : ''}

Use /wishlist to view your wishlist.
      `;

      await bot.sendMessage(chatId, successMessage, { parse_mode: 'HTML' });
    } catch (error: any) {
      logger.error('Error in add command:', error);
      
      if (error.message === 'Tobacco already in wishlist') {
        await bot.sendMessage(chatId, `❌ This tobacco is already in your wishlist.\n\nUse /wishlist to view your wishlist.`);
      } else {
        await bot.sendMessage(chatId, '❌ Sorry, an error occurred while adding to wishlist. Please try again later.');
      }
    }
  });
};
