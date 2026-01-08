import bot from '../bot';
import logger from '@/utils/logger';
import searchService from '@/services/search.service';
import { sessionManager } from '../session';

export const searchCommand = () => {
  bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const query = match?.[1]?.trim();

    logger.info(`/search command received from user ${userId} with query: ${query}`);

    if (!query) {
      await bot.sendMessage(chatId, 'Please provide a search query.\n\nUsage: /search <query>\n\nExample: /search Al Fakher');
      return;
    }

    // Store search query in session
    if (userId) {
      sessionManager.set(userId, { searchQuery: query });
    }

    try {
      // Send typing action
      await bot.sendChatAction(chatId, 'typing');

      // Search for tobaccos
      const result = await searchService.search(query, 1, 10);

      // Format and send results
      const message = searchService.formatSearchResults(result.results, result.page, result.total);
      
      // Send message with HTML parsing
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      logger.error('Error in search command:', error);
      await bot.sendMessage(chatId, '❌ Sorry, an error occurred while searching. Please try again later.');
    }
  });
};
